var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service.js';
let MinigameGateway = class MinigameGateway {
    prisma;
    server;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleStartGame(data, client) {
        console.log('Admin started game for question:', data.questionCode);
        this.server.emit('gameStarted', {
            questionCode: data.questionCode,
            timeLimit: data.timeLimit,
            startedAt: Date.now(),
        });
        return { status: 'success' };
    }
    async handleEndGame(data, client) {
        console.log('Admin ended game for question:', data.questionCode);
        this.server.emit('gameEnded', {
            questionCode: data.questionCode,
        });
        return { status: 'success' };
    }
    broadcastNewComment(comment) {
        this.server.emit('newComment', comment);
    }
    broadcastLeaderboardUpdate(leaderboard) {
        this.server.emit('leaderboardUpdate', leaderboard);
    }
};
__decorate([
    WebSocketServer(),
    __metadata("design:type", Server)
], MinigameGateway.prototype, "server", void 0);
__decorate([
    SubscribeMessage('startGame'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", Promise)
], MinigameGateway.prototype, "handleStartGame", null);
__decorate([
    SubscribeMessage('endGame'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Socket]),
    __metadata("design:returntype", Promise)
], MinigameGateway.prototype, "handleEndGame", null);
MinigameGateway = __decorate([
    WebSocketGateway({ cors: true }),
    __metadata("design:paramtypes", [PrismaService])
], MinigameGateway);
export { MinigameGateway };
//# sourceMappingURL=minigame.gateway.js.map