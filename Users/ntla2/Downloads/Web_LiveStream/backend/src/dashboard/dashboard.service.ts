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
      
      const dayLeads = leadsData.filter(l => l.createdAt.toLocaleDateString() === d.toLocaleDateString());
      chartData.push({
        date: dateStr,
        total: dayLeads.length,
        hot: dayLeads.filter(l => (l.leadScore || 0) >= 80).length
      });
    }

    const recentActivities = await this.prisma.lead.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        status: true,
        customer: { select: { fullName: true } }
      }
    });

    return {
      metrics: {
        sessions: totalSessions,
        leads: totalLeads,
        customers: totalCustomers,
        orders: totalOrders,
        conversionRate: totalCustomers > 0 ? Math.round((totalOrders / totalCustomers) * 100) : 0
      },
      chartData,
      recentActivities
    };
  }

  async getAnalytics(sessionId: string) {
    const session = await this.prisma.liveSession.findUnique({ where: { id: sessionId }, include: { comments: true } });
    if (!session) return null;
    return {
      id: session.id,
      name: session.title,
      date: session.createdAt.toLocaleDateString(),
      comments: session.comments.length,
      rawData: {
        comments: session.comments.map(c => ({ user: c.username, content: c.content, intent: c.aiIntent || 'General', time: c.serverTimestamp.toISOString() }))
      }
    };
  }
}

