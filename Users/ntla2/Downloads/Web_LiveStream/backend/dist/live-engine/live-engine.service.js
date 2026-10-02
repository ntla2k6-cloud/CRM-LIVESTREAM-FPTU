var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var LiveEngineService_1;
import { Injectable, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PipelineService } from '../comment-engine/pipeline.service.js';
import { TiktokCommentSource } from '../comment-engine/tiktok-comment-source.js';
import { MockCommentSource } from '../comment-engine/mock-comment-source.js';
import { EventsGateway } from '../websocket/events.gateway.js';
let LiveEngineService = LiveEngineService_1 = class LiveEngineService {
    prisma;
    pipeline;
    eventsGateway;
    logger = new Logger(LiveEngineService_1.name);
    sources = new Map();
    constructor(prisma, pipeline, eventsGateway) {
        this.prisma = prisma;
        this.pipeline = pipeline;
        this.eventsGateway = eventsGateway;
    }
    async processWinner(liveSessionId, questionId, customerId, giftId) {
        return await this.prisma.$transaction(async (tx) => {
            const existingWinner = await tx.winner.findFirst({
                where: { questionId }
            });
            if (existingWinner)
                throw new ConflictException('Câu hỏi này đã có người trúng thưởng!');
            const gift = await tx.gift.findUnique({
                where: { id: giftId }
            });
            if (!gift || gift.stock <= 0)
                throw new ConflictException('Quà tặng này đã hết hàng!');
            await tx.gift.update({
                where: { id: giftId },
                data: { stock: { decrement: 1 } }
            });
            const winner = await tx.winner.create({
                data: {
                    liveSessionId,
                    questionId,
                    customerId,
                    giftId,
                    status: 'PENDING_INFO'
                }
            });
            return winner;
        });
    }
    async connectToTiktok(liveSessionId, tiktokUsername) {
        this.disconnectFromTiktok(liveSessionId);
        const source = (tiktokUsername.toUpperCase() === 'MOCK' || tiktokUsername.toUpperCase() === 'MOCK_LIVE') ? new MockCommentSource() : new TiktokCommentSource();
        this.sources.set(liveSessionId, source);
        source.onComment(async (payload) => {
            await this.pipeline.processComment(liveSessionId, payload);
        });
        source.onGift((data) => {
            this.eventsGateway.server.to(liveSessionId).emit('gift:new', data);
        });
        source.onDisconnected(async () => {
            await this.prisma.liveSession.update({
                where: { id: liveSessionId },
                data: { status: 'COMPLETED', endTime: new Date() }
            }).catch(() => { });
            this.eventsGateway.server.to(liveSessionId).emit('live:ended');
        });
        await source.connect(tiktokUsername);
        return source.getStatus();
    }
    disconnectFromTiktok(liveSessionId) {
        const source = this.sources.get(liveSessionId);
        if (source) {
            source.disconnect();
            this.sources.delete(liveSessionId);
        }
    }
    getTiktokStatus(liveSessionId) {
        const source = this.sources.get(liveSessionId);
        return source ? source.getStatus() : 'DISCONNECTED';
    }
    async resolveLiveSession(input) {
        let username = input;
        if (input.includes('tiktok.com')) {
            const match = input.match(/@([a-zA-Z0-9_.-]+)/);
            if (match)
                username = match[1];
        }
        username = username.replace('@', '').trim();
        if (username.toUpperCase() === 'MOCK' || username.toUpperCase() === 'MOCK_LIVE') {
            const mockData = {
                platformLiveId: 'mock-live-' + Date.now(),
                title: '🔴 [MOCK] Phiên LIVE Giả lập Realtime',
                creatorUsername: 'mock',
                creatorDisplayName: 'Mock Streamer',
                creatorAvatar: '',
                viewerCount: 9999,
                likeCount: 9999,
                status: 'LIVE_NOW',
                liveUrl: 'https://mock.live/MOCK'
            };
            return await this.prisma.liveSession.upsert({
                where: { platformLiveId: mockData.platformLiveId },
                update: { ...mockData },
                create: { ...mockData, platform: 'mock' }
            });
        }
        const { TikTokLiveConnection } = await import('tiktok-live-connector');
        const connection = new TikTokLiveConnection(username, {});
        try {
            const state = await connection.connect();
            connection.disconnect();
            const roomInfo = state.roomInfo;
            if (!roomInfo)
                throw new Error('Không thể lấy thông tin phiên LIVE.');
            const liveData = {
                platformLiveId: state.roomId,
                title: roomInfo.title || 'Phiên LIVE TikTok',
                creatorUsername: roomInfo.owner?.display_id || username,
                creatorDisplayName: roomInfo.owner?.nickname || username,
                creatorAvatar: roomInfo.owner?.avatar_thumb?.url_list?.[0] || '',
                viewerCount: roomInfo.viewer_count || 0,
                likeCount: roomInfo.like_count || 0,
                status: roomInfo.status === 2 ? 'LIVE_NOW' : 'COMPLETED',
                liveUrl: `https://www.tiktok.com/@${roomInfo.owner?.display_id || username}/live`
            };
            const liveSession = await this.prisma.liveSession.upsert({
                where: { platformLiveId: liveData.platformLiveId },
                update: { ...liveData },
                create: { ...liveData, platform: 'tiktok' }
            });
            return liveSession;
        }
        catch (e) {
            throw new BadRequestException(`Lỗi kết nối TikTok: ${e.message}`);
        }
    }
    async getAnalytics(liveSessionId) {
        const totalComments = await this.prisma.liveComment.count({ where: { liveSessionId } });
        const uniqueCommenters = await this.prisma.liveComment.groupBy({
            by: ['username'],
            where: { liveSessionId },
        });
        const totalLeads = await this.prisma.lead.count({ where: { liveSessionId } });
        const hotLeads = await this.prisma.lead.count({ where: { liveSessionId, intent: 'HOT' } });
        const topCommentersData = await this.prisma.liveComment.groupBy({
            by: ['username', 'avatar'],
            where: { liveSessionId },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 20,
        });
        const topComments = await this.prisma.liveComment.findMany({
            where: { liveSessionId },
            orderBy: [
                { likeCount: 'desc' },
                { replyCount: 'desc' }
            ],
            take: 20,
        });
        const recentComments = await this.prisma.liveComment.findMany({
            where: { liveSessionId },
            select: { content: true },
            orderBy: { serverTimestamp: 'desc' },
            take: 1000
        });
        const wordCount = {};
        const stopWords = ['là', 'và', 'của', 'cho', 'em', 'chị', 'ơi', 'ạ', 'có', 'không', 'để', 'được', 'thì', 'mà'];
        recentComments.forEach(c => {
            const words = c.content.toLowerCase().split(/\s+/);
            words.forEach(w => {
                const clean = w.replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, '');
                if (clean.length > 2 && !stopWords.includes(clean)) {
                    wordCount[clean] = (wordCount[clean] || 0) + 1;
                }
            });
        });
        const topKeywords = Object.entries(wordCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([keyword, count]) => ({ keyword, count }));
        return {
            totalComments,
            uniqueUsers: uniqueCommenters.length,
            totalLeads,
            hotLeads,
            topKeywords,
            topCommenters: topCommentersData.map(c => ({
                username: c.username,
                avatar: c.avatar,
                count: c._count.id
            })),
            topComments
        };
    }
};
LiveEngineService = LiveEngineService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        PipelineService,
        EventsGateway])
], LiveEngineService);
export { LiveEngineService };
//# sourceMappingURL=live-engine.service.js.map