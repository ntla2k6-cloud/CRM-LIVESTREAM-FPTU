var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var QuizService_1;
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EventsGateway } from '../websocket/events.gateway.js';
let QuizService = QuizService_1 = class QuizService {
    prisma;
    eventsGateway;
    logger = new Logger(QuizService_1.name);
    constructor(prisma, eventsGateway) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
    }
    async processQuizAnswer(liveSessionId, comment) {
        try {
            const activeQuestion = await this.prisma.question.findFirst({
                where: {
                    liveSessionId,
                    status: 'ACTIVE',
                }
            });
            if (!activeQuestion)
                return;
            const existingAnswer = await this.prisma.answer.findFirst({
                where: {
                    questionId: activeQuestion.id,
                    customerId: comment.customerId,
                }
            });
            if (existingAnswer)
                return;
            const normalizedComment = comment.content.toLowerCase().replace(/[^a-d0-9]/g, '');
            const parsedAnswer = normalizedComment.slice(-1).toUpperCase();
            if (!['A', 'B', 'C', 'D'].includes(parsedAnswer))
                return;
            const isCorrect = parsedAnswer === activeQuestion.correctAnswer.toUpperCase();
            const responseSpeed = activeQuestion.startedAt ? Date.now() - activeQuestion.startedAt.getTime() : 0;
            const answerStatus = isCorrect ? 'CORRECT' : 'INCORRECT';
            const answer = await this.prisma.answer.create({
                data: {
                    questionId: activeQuestion.id,
                    customerId: comment.customerId,
                    commentId: comment.id,
                    userAnswer: parsedAnswer,
                    status: answerStatus,
                    responseSpeed,
                    isWinner: false,
                },
                include: {
                    customer: true
                }
            });
            this.eventsGateway.server.to(liveSessionId).emit('quiz:answer', {
                username: comment.username,
                questionCode: activeQuestion.code,
                answer: parsedAnswer,
                isCorrect,
                responseSpeed,
            });
        }
        catch (e) {
            this.logger.error('Lỗi khi chấm điểm Quiz', e);
        }
    }
};
QuizService = QuizService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        EventsGateway])
], QuizService);
export { QuizService };
//# sourceMappingURL=quiz.service.js.map