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
      include: { questions: true }
    });
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
}
