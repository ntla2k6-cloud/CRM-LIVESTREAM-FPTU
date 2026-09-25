import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const totalSessions = await this.prisma.liveSession.count();
    const totalLeads = await this.prisma.lead.count();
    const totalOrders = await this.prisma.shipment.count();
    const totalCustomers = await this.prisma.customer.count();
    
    // Get last 7 days leads for the chart
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const leadsData = await this.prisma.lead.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        createdAt: true,
        leadScore: true
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
        hot: dayLeads.filter(l => (l.leadScore || 0) >= 80).length
      });
    }

    return {
      metrics: {
        sessions: totalSessions,
        leads: totalLeads,
        customers: totalCustomers,
        orders: totalOrders,
        conversionRate: totalCustomers > 0 ? Math.round((totalOrders / totalCustomers) * 100) : 0
      },
      chartData
    };
  }
}
