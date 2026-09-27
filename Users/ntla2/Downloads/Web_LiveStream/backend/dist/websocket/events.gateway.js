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
let EventsGateway = class EventsGateway {
    server;
    handleConnection(client) {
        console.log(`[WebSocket] Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`[WebSocket] Client disconnected: ${client.id}`);
    }
    handleJoinSession(sessionId, client) {
        client.join(sessionId);
        console.log(`[WebSocket] Client ${client.id} joined session ${sessionId}`);
        return { event: 'joined', data: sessionId };
    }
    handleLeaveSession(sessionId, client) {
        client.leave(sessionId);
        console.log(`[WebSocket] Client ${client.id} left session ${sessionId}`);
        return { event: 'left', data: sessionId };
    }
};
__decorate([
    WebSocketServer(),
    __metadata("design:type", Server)
], EventsGateway.prototype, "server", void 0);
__decorate([
    SubscribeMessage('joinSession'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Socket]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleJoinSession", null);
__decorate([
    SubscribeMessage('leaveSession'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Socket]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleLeaveSession", null);
EventsGateway = __decorate([
    WebSocketGateway({
        cors: {
            origin: '*',
        },
    })
], EventsGateway);
export { EventsGateway };
//# sourceMappingURL=events.gateway.js.map