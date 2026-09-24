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
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LiveEngineService } from './live-engine.service.js';
let LiveGateway = class LiveGateway {
    liveEngineService;
    server;
    constructor(liveEngineService) {
        this.liveEngineService = liveEngineService;
    }
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
    }
    handleJoinLiveSession(liveSessionId, client) {
        client.join(liveSessionId);
        console.log(`Client ${client.id} joined session ${liveSessionId}`);
        return { event: 'joined', data: liveSessionId };
    }
    async handleStartTiktok(payload) {
        try {
            await this.liveEngineService.connectToTiktok(payload.liveSessionId, payload.tiktokUsername, this.server);
            return { event: 'tiktokStatus', data: { status: 'connected', username: payload.tiktokUsername } };
        }
        catch (e) {
            return { event: 'tiktokStatus', data: { status: 'error', message: e.message } };
        }
    }
    handleStopTiktok(liveSessionId) {
        this.liveEngineService.disconnectFromTiktok(liveSessionId);
        return { event: 'tiktokStatus', data: { status: 'disconnected' } };
    }
};
__decorate([
    WebSocketServer(),
    __metadata("design:type", Server)
], LiveGateway.prototype, "server", void 0);
__decorate([
    SubscribeMessage('joinLiveSession'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Socket]),
    __metadata("design:returntype", void 0)
], LiveGateway.prototype, "handleJoinLiveSession", null);
__decorate([
    SubscribeMessage('startTiktokConnection'),
    __param(0, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LiveGateway.prototype, "handleStartTiktok", null);
__decorate([
    SubscribeMessage('stopTiktokConnection'),
    __param(0, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LiveGateway.prototype, "handleStopTiktok", null);
LiveGateway = __decorate([
    WebSocketGateway({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [LiveEngineService])
], LiveGateway);
export { LiveGateway };
//# sourceMappingURL=live.gateway.js.map