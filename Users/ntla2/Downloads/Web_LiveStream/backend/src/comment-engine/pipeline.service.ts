import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CommentPayload } from './comment-source.interface.js';
import { QuizService } from './quiz.service.js';
import { LeadService } from './lead.service.js';
import { EventsGateway } from '../websocket/events.gateway.js';
import { classifyComment } from './comment-classifier.js';

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly quizService: QuizService,
    private readonly leadService: LeadService,
    private readonly eventsGateway: EventsGateway,
  ) {}

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
      await this.quizService.processQuizAnswer(liveSessionId, comment);
    } else if (comment.category === 'ADMISSION' || comment.category === 'LEAD') {
      await this.leadService.processPotentialLead(liveSessionId, comment, customer.id, categoryAndIntent);
    }

    this.eventsGateway.server.to(liveSessionId).emit('comment:new', comment);
  }
}
