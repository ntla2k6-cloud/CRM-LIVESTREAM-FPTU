import { Injectable, ConflictException, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { HOT_LEAD_SCORE } from '../comment-engine/comment-classifier.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PipelineService } from '../comment-engine/pipeline.service.js';
import { TiktokCommentSource } from '../comment-engine/tiktok-comment-source.js';
import { MockCommentSource } from '../comment-engine/mock-comment-source.js';
import { EventsGateway } from '../websocket/events.gateway.js';

@Injectable()
export class LiveEngineService {
  private readonly logger = new Logger(LiveEngineService.name);
  private sources = new Map<string, any>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly pipeline: PipelineService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async processWinner(liveSessionId: string, questionId: string, customerId: string, giftId: number) {
    return await this.prisma.$transaction(async (tx) => {
      const existingWinner = await tx.winner.findFirst({
        where: { questionId }
      });
      if (existingWinner) throw new ConflictException('Câu hỏi này đã có người trúng thưởng!');
      const gift = await tx.gift.findUnique({
        where: { id: giftId }
      });
      if (!gift || gift.stock <= 0) throw new ConflictException('Quà tặng này đã hết hàng!');
      
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

  /**
   * Extension gửi link/ID nào thì trả về phiên LIVE trên CRM tương ứng:
   * - ID phiên CRM hoặc link trang CRM `.../live/<id>` → phiên đó
   * - Link TikTok `tiktok.com/@user/live` → phiên đang diễn ra của @user (trong 12h gần nhất), không có thì tạo mới
   */
  async resolveExtensionSession(input: string, title?: string) {
    const value = (input || '').trim();
    if (!value) throw new BadRequestException('Thiếu link TikTok LIVE hoặc ID phiên CRM');

    const tiktokUser = value.includes('tiktok.com') ? value.match(/@([^/?#\s]+)/)?.[1] : undefined;
    if (!tiktokUser) {
      const id = value.includes('/live/') ? value.split('/live/').pop()!.split(/[/?#]/)[0] : value;
      const session = await this.prisma.liveSession.findUnique({ where: { id } });
      if (!session) throw new NotFoundException(`Không tìm thấy phiên LIVE "${id}" trên CRM. Dán link TikTok LIVE hoặc link trang Live của CRM.`);
      return { id: session.id, title: session.title, created: false };
    }

    const username = decodeURIComponent(tiktokUser);
    const since = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const existing = await this.prisma.liveSession.findFirst({
      where: {
        creatorUsername: username,
        status: { in: ['LIVE_NOW', 'SCHEDULED'] },
        OR: [{ startTime: { gte: since } }, { scheduledAt: { gte: since } }, { createdAt: { gte: since } }],
      },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      if (existing.status !== 'LIVE_NOW') {
        await this.prisma.liveSession.update({
          where: { id: existing.id },
          data: { status: 'LIVE_NOW', startTime: existing.startTime ?? new Date() },
        });
      }
      return { id: existing.id, title: existing.title, created: false };
    }

    const now = new Date();
    const session = await this.prisma.liveSession.create({
      data: {
        title: title?.trim() || `LIVE @${username} ${now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`,
        platform: 'tiktok',
        creatorUsername: username,
        liveUrl: `https://www.tiktok.com/@${username}/live`,
        status: 'LIVE_NOW',
        startTime: now,
      },
    });
    this.logger.log(`Tạo phiên LIVE mới từ extension cho @${username}: ${session.id}`);
    return { id: session.id, title: session.title, created: true };
  }

  async assertLiveSessionExists(liveSessionId: string) {
    const session = await this.prisma.liveSession.findUnique({ where: { id: liveSessionId }, select: { id: true } });
    if (!session) {
      throw new NotFoundException(`Không tìm thấy phiên LIVE "${liveSessionId}" trên CRM. Hãy copy đúng link/ID phiên trong trang Live của CRM.`);
    }
  }

  async connectToTiktok(liveSessionId: string, tiktokUsername: string) {
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
      }).catch(() => {});
      this.eventsGateway.server.to(liveSessionId).emit('live:ended');
    });

    await source.connect(tiktokUsername);
    return source.getStatus();
  }

  disconnectFromTiktok(liveSessionId: string) {
    const source = this.sources.get(liveSessionId);
    if (source) {
      source.disconnect();
      this.sources.delete(liveSessionId);
    }
  }
  
  getTiktokStatus(liveSessionId: string) {
    const source = this.sources.get(liveSessionId);
    return source ? source.getStatus() : 'DISCONNECTED';
  }

  async resolveLiveSession(input: string) {
    let username = input;
    if (input.includes('tiktok.com')) {
      const match = input.match(/@([a-zA-Z0-9_.-]+)/);
      if (match) username = match[1];
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
      if (!roomInfo) throw new Error('Không thể lấy thông tin phiên LIVE.');

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
    } catch (e: any) {
      throw new BadRequestException(`Lỗi kết nối TikTok: ${e.message}`);
    }
  }

  async getAnalytics(liveSessionId: string) {
    // Quà tặng lưu chung bảng LiveComment (category GIFT) → loại khỏi số liệu comment
    const commentWhere = { liveSessionId, category: { not: 'GIFT' } };
    const totalComments = await this.prisma.liveComment.count({ where: commentWhere });
    
    // Group by to get unique commenters
    const uniqueCommenters = await this.prisma.liveComment.groupBy({
      by: ['username'],
      where: commentWhere,
    });

    const totalLeads = await this.prisma.lead.count({ where: { liveSessionId } });
    const hotLeads = await this.prisma.lead.count({ where: { liveSessionId, leadScore: { gte: HOT_LEAD_SCORE } } });

    // Top commenters
    const topCommentersData = await this.prisma.liveComment.groupBy({
      by: ['username', 'avatar'],
      where: commentWhere,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    const topComments = await this.prisma.liveComment.findMany({
      where: commentWhere,
      orderBy: [
        { likeCount: 'desc' },
        { replyCount: 'desc' }
      ],
      take: 20,
    });

    // Keyword analytics (Basic frequency count from recent comments)
    // To do this properly without full text search, we can aggregate in JS for the latest 1000 comments
    const recentComments = await this.prisma.liveComment.findMany({
      where: commentWhere,
      select: { content: true },
      orderBy: { serverTimestamp: 'desc' },
      take: 1000
    });

    const wordCount: Record<string, number> = {};
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
}
