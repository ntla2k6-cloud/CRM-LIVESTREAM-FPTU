var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PipelineService_1;
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { QuizService } from './quiz.service.js';
import { LeadService } from './lead.service.js';
import { EventsGateway } from '../websocket/events.gateway.js';
let PipelineService = PipelineService_1 = class PipelineService {
    prisma;
    quizService;
    leadService;
    eventsGateway;
    logger = new Logger(PipelineService_1.name);
    constructor(prisma, quizService, leadService, eventsGateway) {
        this.prisma = prisma;
        this.quizService = quizService;
        this.leadService = leadService;
        this.eventsGateway = eventsGateway;
    }
    async processComment(liveSessionId, payload) {
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
        const categoryAndIntent = await this.classifyComment(payload.content);
        let customer = await this.prisma.customer.findFirst({
            where: { tiktokAccount: payload.username }
        });
        if (!customer) {
            customer = await this.prisma.customer.create({
                data: {
                    fullName: payload.displayName || payload.username,
                    tiktokAccount: payload.username
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
                rawPayload: payload.rawPayload ? JSON.stringify(payload.rawPayload) : null,
            },
        });
        if (comment.category === 'QUIZ') {
            await this.quizService.processQuizAnswer(liveSessionId, comment);
        }
        else if (comment.category === 'ADMISSION' || comment.category === 'LEAD') {
            await this.leadService.processPotentialLead(liveSessionId, comment, customer.id, categoryAndIntent);
        }
        this.eventsGateway.server.to(liveSessionId).emit('comment:new', comment);
    }
    async classifyComment(text) {
        const normalized = text.toLowerCase().trim();
        if (/^([1-9][0-9]?[\.\-\s]?)?[a-d]$/i.test(normalized)) {
            return { category: 'QUIZ', intent: 'ANSWER', score: 0 };
        }
        const leadPatterns = [
            { regex: /đăng ký|dang ky|dk|đk/, intent: 'ADMISSION_REGISTER', score: 30 },
            { regex: /học phí|hoc phi|tiền học|bao nhiêu tiền|gia bao nhieu/, intent: 'ADMISSION_TUITION', score: 20 },
            { regex: /ngành|nganh|cntt|it|software|ai|kinh tế|marketing/, intent: 'ADMISSION_MAJOR', score: 10 },
            { regex: /số điện thoại|sđt|sdt|zalo|liên hệ|tư vấn/, intent: 'ADMISSION_CONTACT', score: 50 },
            { regex: /điều kiện|xét tuyển|học bạ|điểm chuẩn/, intent: 'ADMISSION_REQUIREMENT', score: 10 },
        ];
        let maxScore = 0;
        let matchedIntent = null;
        for (const pattern of leadPatterns) {
            if (pattern.regex.test(normalized)) {
                if (pattern.score > maxScore) {
                    maxScore = pattern.score;
                    matchedIntent = pattern.intent;
                }
            }
        }
        if (matchedIntent) {
            return {
                category: maxScore >= 30 ? 'LEAD' : 'ADMISSION',
                intent: matchedIntent,
                score: maxScore
            };
        }
        if (/(http|www|\.com|\.vn)/.test(normalized)) {
            return { category: 'SPAM', intent: null, score: 0 };
        }
        if (/^[?.!]+$/.test(normalized)) {
            return { category: 'QUESTION', intent: null, score: 0 };
        }
        return { category: 'CHAT', intent: null, score: 0 };
    }
};
PipelineService = PipelineService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        QuizService,
        LeadService,
        EventsGateway])
], PipelineService);
export { PipelineService };
//# sourceMappingURL=pipeline.service.js.map