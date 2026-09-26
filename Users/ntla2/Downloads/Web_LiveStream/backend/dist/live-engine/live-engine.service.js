var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
let LiveEngineService = class LiveEngineService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async processWinner(liveSessionId, questionId, customerId, giftId) {
        return await this.prisma.$transaction(async (tx) => {
            const existingWinner = await tx.winner.findFirst({
                where: { questionId }
            });
            if (existingWinner) {
                throw new ConflictException('Câu hỏi này đã có người trúng thưởng!');
            }
            const gift = await tx.gift.findUnique({
                where: { id: giftId }
            });
            if (!gift || gift.stock <= 0) {
                throw new ConflictException('Quà tặng này đã hết hàng!');
            }
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
    async processComment(liveSessionId, tiktokUsername, comment) {
        const customer = await this.prisma.customer.findFirst({
            where: { tiktokAccount: tiktokUsername }
        });
        let customerId = customer?.id;
        if (!customerId) {
            const newCustomer = await this.prisma.customer.create({
                data: {
                    fullName: tiktokUsername,
                    tiktokAccount: tiktokUsername
                }
            });
            customerId = newCustomer.id;
        }
        return await this.prisma.liveComment.create({
            data: {
                liveSessionId,
                customerId,
                username: tiktokUsername,
                content: comment,
                aiIntent: 'NEUTRAL'
            }
        });
    }
    activeConnections = new Map();
    async connectToTiktok(liveSessionId, tiktokUsername, server) {
        this.disconnectFromTiktok(liveSessionId);
        const { WebcastPushConnection } = require('tiktok-live-connector');
        const connection = new WebcastPushConnection(tiktokUsername);
        connection.on('chat', async (data) => {
            console.log(`[TikTok ${tiktokUsername}] ${data.uniqueId}: ${data.comment}`);
            try {
                const savedComment = await this.processComment(liveSessionId, data.uniqueId, data.comment);
                server.to(liveSessionId).emit('newComment', savedComment);
            }
            catch (err) {
                console.error('Lỗi khi xử lý comment TikTok:', err.message);
            }
        });
        connection.on('gift', (data) => {
            if (data.giftType === 1 && !data.repeatEnd) {
            }
            else {
                server.to(liveSessionId).emit('tiktokEvent', { type: 'gift', text: `${data.uniqueId} đã tặng ${data.giftName}` });
            }
        });
        try {
            await connection.connect();
            console.log(`Connected to TikTok Live: ${tiktokUsername}`);
            this.activeConnections.set(liveSessionId, connection);
        }
        catch (err) {
            console.error(`Lỗi kết nối TikTok Live:`, err);
            throw err;
        }
    }
    disconnectFromTiktok(liveSessionId) {
        const connection = this.activeConnections.get(liveSessionId);
        if (connection) {
            connection.disconnect();
            this.activeConnections.delete(liveSessionId);
            console.log(`Disconnected TikTok for session ${liveSessionId}`);
        }
    }
};
LiveEngineService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], LiveEngineService);
export { LiveEngineService };
//# sourceMappingURL=live-engine.service.js.map