import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EventsGateway } from '../websocket/events.gateway.js';

@Injectable()
export class LeadService {
  private readonly logger = new Logger(LeadService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async processPotentialLead(liveSessionId: string, comment: any, customerId: string, classification: { intent: string | null, score: number }) {
    try {
      const existingLead = await this.prisma.lead.findFirst({
        where: {
          customerId,
          liveSessionId,
        }
      });

      if (existingLead) {
        const updatedLead = await this.prisma.lead.update({
          where: { id: existingLead.id },
          data: {
            leadScore: { increment: classification.score },
            latestCommentId: comment.id,
            intent: classification.intent || existingLead.intent, 
          },
          include: { customer: true }
        });
        
        this.eventsGateway.server.to(liveSessionId).emit('lead:updated', updatedLead);
        this.logger.debug(`Đã cập nhật Lead cho ${comment.username}, score: ${updatedLead.leadScore}`);
      } else {
        const newLead = await this.prisma.lead.create({
          data: {
            customerId,
            liveSessionId,
            source: 'LIVESTREAM',
            status: 'NEW',
            leadScore: classification.score,
            intent: classification.intent,
            firstCommentId: comment.id,
            latestCommentId: comment.id,
          },
          include: { customer: true }
        });

        this.eventsGateway.server.to(liveSessionId).emit('lead:new', newLead);
        this.logger.debug(`Đã TẠO Lead mới cho ${comment.username}, intent: ${classification.intent}`);
      }
    } catch (e) {
      this.logger.error('Lỗi khi process Lead', e);
    }
  }
}
