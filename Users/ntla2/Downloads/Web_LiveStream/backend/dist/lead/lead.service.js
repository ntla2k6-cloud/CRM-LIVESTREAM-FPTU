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
let LeadService = class LeadService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(createLeadDto) {
        return this.prisma.lead.create({
            data: {
                ...createLeadDto,
                customer: {
                    connectOrCreate: {
                        where: { tiktokAccount: createLeadDto.tiktokAccount || 'unknown' },
                        create: { tiktokAccount: createLeadDto.tiktokAccount || 'unknown', phone: createLeadDto.phone }
                    }
                },
                campaign: {
                    connectOrCreate: {
                        where: { id: 'default-campaign' },
                        create: { id: 'default-campaign', name: 'Default Campaign' }
                    }
                }
            }
        });
    }
    findAll() {
        return this.prisma.lead.findMany({
            include: { customer: true }
        });
    }
    findOne(id) {
        return this.prisma.lead.findUnique({
            where: { id },
            include: { customer: true }
        });
    }
    update(id, updateLeadDto) {
        return this.prisma.lead.update({
            where: { id },
            data: updateLeadDto,
        });
    }
    remove(id) {
        return this.prisma.lead.delete({ where: { id } });
    }
};
LeadService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], LeadService);
export { LeadService };
//# sourceMappingURL=lead.service.js.map