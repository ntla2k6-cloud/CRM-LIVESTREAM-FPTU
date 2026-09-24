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
import { Controller, Post, Body } from '@nestjs/common';
import { LiveEngineService } from './live-engine.service.js';
let LiveEngineController = class LiveEngineController {
    liveEngineService;
    constructor(liveEngineService) {
        this.liveEngineService = liveEngineService;
    }
    async declareWinner(body) {
        return this.liveEngineService.processWinner(body.liveSessionId, body.questionId, body.customerId, body.giftId);
    }
    async handleIncomingComment(body) {
        return this.liveEngineService.processComment(body.liveSessionId, body.tiktokUsername, body.comment);
    }
};
__decorate([
    Post('winner'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LiveEngineController.prototype, "declareWinner", null);
__decorate([
    Post('comment'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LiveEngineController.prototype, "handleIncomingComment", null);
LiveEngineController = __decorate([
    Controller('live-engine'),
    __metadata("design:paramtypes", [LiveEngineService])
], LiveEngineController);
export { LiveEngineController };
//# sourceMappingURL=live-engine.controller.js.map