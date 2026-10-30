import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

// Comment "phù hợp CRM" = có giá trị tuyển sinh (lead, hỏi tuyển sinh, câu hỏi). Đáp án minigame có tab riêng.
const CRM_CATEGORIES = ['LEAD', 'ADMISSION', 'QUESTION'];

const INTENT_LABELS: Record<string, string> = {
  ADMISSION_PHONE: 'Để lại SĐT',
  ADMISSION_CONTACT: 'Cần tư vấn / liên hệ',
  ADMISSION_REGISTER: 'Muốn đăng ký',
  ADMISSION_TUITION: 'Hỏi học phí / học bổng',
  ADMISSION_REQUIREMENT: 'Hỏi xét tuyển',
  ADMISSION_DORM: 'Hỏi ký túc xá',
  ADMISSION_MAJOR: 'Hỏi về ngành',
};

const CATEGORY_LABELS: Record<string, string> = {
  QUESTION: 'Câu hỏi',
  SPAM: 'Spam',
  CHAT: 'Bình luận',
};

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
    const session = await this.prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: { comments: { orderBy: { serverTimestamp: 'asc' } } },
    });
    if (!session) return null;

    const gifts = session.comments.filter(c => c.category === 'GIFT').map(c => {
      const raw = c.rawPayload ? JSON.parse(c.rawPayload) : {};
      return {
        user: c.displayName || c.username,
        username: c.username,
        avatar: c.avatar,
        giftName: raw.giftName || 'Quà tặng',
        giftCount: Number(raw.giftCount) || 1,
        time: c.serverTimestamp.toISOString(),
      };
    });

    // Bảng xếp hạng người tặng: tổng số quà + chi tiết từng loại
    const giftersMap = new Map<string, { user: string; username: string; avatar: string | null; total: number; gifts: Record<string, number> }>();
    for (const g of gifts) {
      const row = giftersMap.get(g.username) || { user: g.user, username: g.username, avatar: g.avatar, total: 0, gifts: {} };
      row.total += g.giftCount;
      row.gifts[g.giftName] = (row.gifts[g.giftName] || 0) + g.giftCount;
      giftersMap.set(g.username, row);
    }
    const topGifters = [...giftersMap.values()].sort((a, b) => b.total - a.total);

    const comments = session.comments.filter(c => c.category !== 'GIFT');
    return {
      id: session.id,
      name: session.title,
      date: session.createdAt.toLocaleDateString(),
      comments: comments.length,
      crmComments: comments.filter(c => CRM_CATEGORIES.includes(c.category)).length,
      totalGifts: gifts.reduce((sum, g) => sum + g.giftCount, 0),
      rawData: {
        comments: comments.map(c => ({
          user: c.displayName || c.username,
          content: c.content,
          category: c.category,
          intent: c.category === 'QUIZ' ? 'Tham gia Minigame' : (INTENT_LABELS[c.aiIntent || ''] || CATEGORY_LABELS[c.category] || 'Bình luận'),
          isCrm: CRM_CATEGORIES.includes(c.category),
          time: c.serverTimestamp.toISOString(),
        })),
        gifts,
        topGifters,
      }
    };
  }
}

