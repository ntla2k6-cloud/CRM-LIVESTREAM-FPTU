var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MinigameGateway } from './minigame.gateway.js';
let MinigameService = class MinigameService {
    prisma;
    gateway;
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
    }
    async processIncomingComment(data) {
        const comment = await this.prisma.liveComment.create({
            data: {
                liveSessionId: data.liveSessionId,
                username: data.username,
                content: data.content,
                tiktokUserId: data.tiktokUserId,
            }
        });
        const activeQuestion = await this.prisma.question.findFirst({
            where: {
                liveSessionId: data.liveSessionId,
                status: 'ACTIVE'
            }
        });
        let isCorrect = false;
        if (activeQuestion) {
            const answerRegex = new RegExp(activeQuestion.correctAnswer, 'i');
            isCorrect = answerRegex.test(data.content);
            if (isCorrect) {
                const speedMs = Date.now() - (activeQuestion.startedAt?.getTime() || Date.now());
                let customer = await this.prisma.customer.findUnique({ where: { tiktokAccount: data.username } });
                if (!customer) {
                    customer = await this.prisma.customer.create({
                        data: {
                            tiktokAccount: data.username,
                            fullName: data.username,
                        }
                    });
                }
                await this.prisma.answer.create({
                    data: {
                        questionId: activeQuestion.id,
                        customerId: customer.id,
                        commentId: comment.id,
                        userAnswer: data.content,
                        status: 'CORRECT',
                        responseSpeed: speedMs
                    }
                });
                const topAnswers = await this.prisma.answer.findMany({
                    where: { questionId: activeQuestion.id, status: 'CORRECT' },
                    orderBy: { responseSpeed: 'asc' },
                    take: 10,
                    include: { customer: true }
                });
                const leaderboard = topAnswers.map((ans, idx) => ({
                    rank: idx + 1,
                    name: ans.customer.tiktokAccount,
                    answer: ans.userAnswer,
                    speed: `${(ans.responseSpeed / 1000).toFixed(1)}s`,
                    valid: true,
                    avatar: ans.customer.tiktokAccount?.charAt(1).toUpperCase() || 'U'
                }));
                this.gateway.broadcastLeaderboardUpdate(leaderboard);
            }
        }
        this.gateway.broadcastNewComment({
            id: comment.id,
            name: data.username,
            text: data.content,
            time: "Vừa xong",
            isCorrect
        });
    }
};
MinigameService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        MinigameGateway])
], MinigameService);
export { MinigameService };
//# sourceMappingURL=minigame.service.js.map