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
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats() {
        const totalSessions = await this.prisma.liveSession.count();
        const totalLeads = await this.prisma.customer.count();
        const totalOrders = await this.prisma.shipment.count();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const leadsData = await this.prisma.customer.findMany({
            where: {
                createdAt: { gte: sevenDaysAgo }
            },
            select: {
                createdAt: true,
                aiIntent: true
            }
        });
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('vi-VN', { weekday: 'short' });
            const dayLeads = leadsData.filter(l => l.createdAt.getDate() === d.getDate());
            chartData.push({
                date: dateStr,
                total: dayLeads.length,
                hot: dayLeads.filter(l => l.aiIntent === 'HOT_LEAD').length
            });
        }
        return {
            metrics: {
                sessions: totalSessions,
                leads: totalLeads,
                orders: totalOrders,
                conversionRate: totalLeads > 0 ? Math.round((totalOrders / totalLeads) * 100) : 0
            },
            chartData
        };
    }
};
DashboardService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], DashboardService);
export { DashboardService };
//# sourceMappingURL=dashboard.service.js.map