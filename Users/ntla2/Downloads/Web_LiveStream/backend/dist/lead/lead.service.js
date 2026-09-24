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
    async create(createLeadDto) {
        const { tiktokAccount, phone, fullName, highSchool, location, classGrade, campaignId, ...leadData } = createLeadDto;
        let customer = null;
        if (phone) {
            customer = await this.prisma.customer.findFirst({ where: { phone } });
        }
        else if (tiktokAccount) {
            customer = await this.prisma.customer.findFirst({ where: { tiktokAccount } });
        }
        if (!customer) {
            customer = await this.prisma.customer.create({
                data: {
                    tiktokAccount: tiktokAccount || null,
                    phone: phone || null,
                    fullName: fullName || 'Khách hàng',
                    highSchool: highSchool || '',
                    location: location || '',
                    classGrade: classGrade || ''
                }
            });
        }
        const campId = campaignId || 'default-campaign';
        let campaign = await this.prisma.campaign.findUnique({ where: { id: campId } });
        if (!campaign) {
            campaign = await this.prisma.campaign.create({
                data: { id: campId, name: 'Default Campaign' }
            });
        }
        return this.prisma.lead.create({
            data: {
                ...leadData,
                customerId: customer.id,
                campaignId: campaign.id
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