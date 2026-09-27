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
import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PipelineService } from '../comment-engine/pipeline.service.js';
import { TiktokCommentSource } from '../comment-engine/tiktok-comment-source.js';
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
        const source = new TiktokCommentSource();
        this.sources.set(liveSessionId, source);
        source.onComment(async (payload) => {
            await this.pipeline.processComment(liveSessionId, payload);
        });
        source.onGift((data) => {
            this.eventsGateway.server.to(liveSessionId).emit('gift:new', data);
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
};
LiveEngineService = LiveEngineService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        PipelineService,
        EventsGateway])
], LiveEngineService);
export { LiveEngineService };
//# sourceMappingURL=live-engine.service.js.map