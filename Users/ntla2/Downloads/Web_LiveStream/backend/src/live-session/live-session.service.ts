import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLiveSessionDto } from './dto/create-live-session.dto.js';
import { UpdateLiveSessionDto } from './dto/update-live-session.dto.js';

@Injectable()
export class LiveSessionService {
  constructor(private prisma: PrismaService) {}

  async create(createLiveSessionDto: any) {
    // Lấy campaign đầu tiên có trong DB để gắn vào
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
      include: {
        questions: true,
        // Số comment thật (không tính quà) + lead của từng phiên cho danh sách phiên
        _count: { select: { comments: { where: { category: { not: 'GIFT' } } }, leads: true } },
      }
    });
  }

  /** Số liệu thật cho trang Kết nối LIVE: tổng comment, lead có SĐT, các phiên live gần đây. */
  async overview() {
    const [totalComments, phoneLeads, recent] = await Promise.all([
      this.prisma.liveComment.count({ where: { category: { not: 'GIFT' } } }),
      this.prisma.lead.count({ where: { customer: { phone: { not: null } } } }),
      this.prisma.liveSession.findMany({
        where: { OR: [{ startTime: { not: null } }, { comments: { some: {} } }] },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true, title: true, status: true, creatorUsername: true, startTime: true, endTime: true, createdAt: true,
          _count: { select: { comments: { where: { category: { not: 'GIFT' } } }, leads: true } },
        },
      }),
    ]);
    return {
      totalComments,
      phoneLeads,
      recentSessions: recent.map(s => ({
        id: s.id,
        title: s.title,
        status: s.status,
        creatorUsername: s.creatorUsername,
        startedAt: (s.startTime || s.createdAt).toISOString(),
        endedAt: s.endTime?.toISOString() ?? null,
        comments: s._count.comments,
        leads: s._count.leads,
      })),
    };
  }

  findOne(id: string) {
    return this.prisma.liveSession.findUnique({
      where: { id },
      include: { comments: true, leads: true }
    });
  }

  update(id: string, updateLiveSessionDto: any) {
    return this.prisma.liveSession.update({
      where: { id },
      data: updateLiveSessionDto
    });
  }

  remove(id: string) {
    return this.prisma.liveSession.delete({
      where: { id }
    });
  }

  async getHistory(id: string) {
    const comments = await this.prisma.liveComment.findMany({
      where: { liveSessionId: id },
      orderBy: { serverTimestamp: 'asc' },
    });
    
    const leads = await this.prisma.lead.findMany({
      where: { liveSessionId: id },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });

    const winners = await this.prisma.winner.findMany({
      where: { liveSessionId: id },
      include: { customer: true, gift: true },
      orderBy: { createdAt: 'desc' },
    });

    return { comments, leads, winners };
  }
}
