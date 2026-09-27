var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var LeadService_1;
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EventsGateway } from '../websocket/events.gateway.js';
let LeadService = LeadService_1 = class LeadService {
    prisma;
    eventsGateway;
    logger = new Logger(LeadService_1.name);
    constructor(prisma, eventsGateway) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
    }
    async processPotentialLead(liveSessionId, comment, customerId, classification) {
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
            }
            else {
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
        }
        catch (e) {
            this.logger.error('Lỗi khi process Lead', e);
        }
    }
};
LeadService = LeadService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        EventsGateway])
], LeadService);
export { LeadService };
//# sourceMappingURL=lead.service.js.map