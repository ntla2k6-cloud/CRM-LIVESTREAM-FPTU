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
}
