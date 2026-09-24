import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const totalSessions = await this.prisma.liveSession.count();
    const totalLeads = await this.prisma.customer.count();
    const totalOrders = await this.prisma.shipment.count();
    
    // Get last 7 days leads for the chart
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Group leads by day
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
}
