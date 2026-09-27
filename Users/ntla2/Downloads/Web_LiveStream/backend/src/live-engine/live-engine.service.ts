import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PipelineService } from '../comment-engine/pipeline.service.js';
import { TiktokCommentSource } from '../comment-engine/tiktok-comment-source.js';
import { EventsGateway } from '../websocket/events.gateway.js';

@Injectable()
export class LiveEngineService {
  private readonly logger = new Logger(LiveEngineService.name);
  private sources = new Map<string, TiktokCommentSource>();

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

  async connectToTiktok(liveSessionId: string, tiktokUsername: string) {
    this.disconnectFromTiktok(liveSessionId);

    const source = new TiktokCommentSource();
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
      throw new Error(`Lỗi kết nối TikTok: ${e.message}`);
    }
  }
}
