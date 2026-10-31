import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CommentPayload } from './comment-source.interface.js';
import { QuizService } from './quiz.service.js';
import { LeadService } from './lead.service.js';
import { EventsGateway } from '../websocket/events.gateway.js';
import { classifyComment } from './comment-classifier.js';

const GIFT_COMBO_WINDOW_MS = 90_000;

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly quizService: QuizService,
    private readonly leadService: LeadService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Lưu 1 lượt tặng quà dưới dạng LiveComment category GIFT (không cần đổi schema DB).
   * TikTok hiện combo x1, x2, x3… → cùng người + cùng quà trong 90s mà số lượng tăng = cập nhật bản ghi cũ.
   */
  async processGift(liveSessionId: string, payload: CommentPayload & { giftName: string; giftCount: number }) {
    if (!payload.username || !payload.giftName) return;
    const giftCount = Math.max(1, Math.floor(payload.giftCount || 1));
    const content = `🎁 ${payload.giftName} x${giftCount}`;
    const rawPayload = JSON.stringify({ giftName: payload.giftName, giftCount });

    const recent = await this.prisma.liveComment.findFirst({
      where: {
        liveSessionId,
        category: 'GIFT',
        username: payload.username,
        serverTimestamp: { gte: new Date(Date.now() - GIFT_COMBO_WINDOW_MS) },
        rawPayload: { contains: `"giftName":${JSON.stringify(payload.giftName)}` },
      },
      orderBy: { serverTimestamp: 'desc' },
    });
    const recentCount = recent?.rawPayload ? JSON.parse(recent.rawPayload).giftCount ?? 0 : 0;

    if (recent && giftCount <= recentCount) return; // bản cũ của cùng combo
    if (recent) {
      const updated = await this.prisma.liveComment.update({
        where: { id: recent.id },
        data: { content, rawPayload },
      });
      this.eventsGateway.server.to(liveSessionId).emit('gift:new', updated);
      return;
    }

    let customer = await this.prisma.customer.findFirst({ where: { tiktokAccount: payload.username } });
    if (!customer) {
      customer = await this.prisma.customer.create({
        data: { fullName: payload.displayName || payload.username, tiktokAccount: payload.username },
      });
    }

    const gift = await this.prisma.liveComment.create({
      data: {
        liveSessionId,
        customerId: customer.id,
        platform: payload.platform,
        platformCommentId: payload.platformCommentId,
        username: payload.username,
        displayName: payload.displayName,
        avatar: payload.avatar,
        content,
        category: 'GIFT',
        aiIntent: 'GIFT',
        rawPayload,
        isProcessed: true,
      },
    });
    this.eventsGateway.server.to(liveSessionId).emit('gift:new', gift);
  }

  async processComment(liveSessionId: string, payload: CommentPayload) {
    if (!payload.username || !payload.content) return;
    const existing = await this.prisma.liveComment.findUnique({
      where: {
        platform_platformCommentId: {
          platform: payload.platform,
          platformCommentId: payload.platformCommentId,
        },
      },
    });

    if (existing) {
      this.logger.debug(`Bỏ qua comment bị trùng: ${payload.platformCommentId}`);
      return; 
    }

    const categoryAndIntent = classifyComment(payload.content);

    let customer = await this.prisma.customer.findFirst({
      where: { tiktokAccount: payload.username }
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          fullName: payload.displayName || payload.username,
          tiktokAccount: payload.username,
          phone: categoryAndIntent.phone,
          interestedMajor: categoryAndIntent.major,
        }
      });
    } else if ((categoryAndIntent.phone && !customer.phone) || (categoryAndIntent.major && !customer.interestedMajor)) {
      // Bổ sung SĐT / ngành bóc tách được, không ghi đè dữ liệu CSKH đã nhập
      customer = await this.prisma.customer.update({
        where: { id: customer.id },
        data: {
          phone: customer.phone || categoryAndIntent.phone,
          interestedMajor: customer.interestedMajor || categoryAndIntent.major,
        }
      });
    }

    const comment = await this.prisma.liveComment.create({
      data: {
        liveSessionId,
        customerId: customer.id,
        platform: payload.platform,
        platformCommentId: payload.platformCommentId,
        platformUserId: payload.platformUserId,
        username: payload.username,
        displayName: payload.displayName,
        avatar: payload.avatar,
        content: payload.content,
        category: categoryAndIntent.category,
        aiIntent: categoryAndIntent.intent,
        isProcessed: true,
      },
    });

    if (comment.category === 'QUIZ') {
      await this.quizService.processQuizAnswer(liveSessionId, comment, payload.timestamp);
    } else if (comment.category === 'ADMISSION' || comment.category === 'LEAD') {
      await this.leadService.processPotentialLead(liveSessionId, comment, customer.id, categoryAndIntent);
    }

    this.eventsGateway.server.to(liveSessionId).emit('comment:new', comment);
  }
}
