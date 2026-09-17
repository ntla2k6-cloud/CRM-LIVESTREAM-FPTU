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
let LiveSessionService = class LiveSessionService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createLiveSessionDto) {
        let campaign = await this.prisma.campaign.findFirst();
        if (!campaign) {
            campaign = await this.prisma.campaign.create({ data: { name: 'Default Campaign' } });
        }
        return this.prisma.liveSession.create({
            data: {
                title: createLiveSessionDto.title || 'Phiên Live Mới',
                status: createLiveSessionDto.status || 'SCHEDULED',
                startTime: createLiveSessionDto.startTime ? new Date(createLiveSessionDto.startTime) : null,
                campaign: { connect: { id: campaign.id } }
            }
        });
    }
    findAll() {
        return this.prisma.liveSession.findMany({
            orderBy: { createdAt: 'desc' },
            include: { questions: true }
        });
    }
    findOne(id) {
        return this.prisma.liveSession.findUnique({
            where: { id },
            include: { comments: true, leads: true }
        });
    }
    update(id, updateLiveSessionDto) {
        return this.prisma.liveSession.update({
            where: { id },
            data: updateLiveSessionDto
        });
    }
    remove(id) {
        return this.prisma.liveSession.delete({
            where: { id }
        });
    }
};
LiveSessionService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], LiveSessionService);
export { LiveSessionService };
//# sourceMappingURL=live-session.service.js.map