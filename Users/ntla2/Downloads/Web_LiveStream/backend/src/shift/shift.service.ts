import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ShiftService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    const assignments = data.assignments?.create || [];
    const registeredIds = JSON.stringify(data.registered || []);
    
    // day có thể là số (weekday) hoặc string ngày => chuyển về số hoặc null
    let dayVal: number | null = null;
    if (data.day !== undefined && data.day !== null) {
      const parsed = parseInt(String(data.day));
      dayVal = isNaN(parsed) ? null : parsed;
    }
    
    return this.prisma.liveSession.create({
      data: {
        title: data.title || 'Ca trực mới',
        day: dayVal,
        time: data.time,
        project: data.type || data.project || 'Khác',
        color: data.color || '#005691',
        registered: registeredIds,
        status: 'SCHEDULED',
        assignments: assignments.length > 0 ? {
          create: assignments.map((a: any) => ({ staffId: Number(a.staffId) }))
        } : undefined
      }
    });
  }

  async findAll() {
    const sessions = await this.prisma.liveSession.findMany({
      include: {
        assignments: {
          include: { staff: true }
        }
      }
    });
    
    return sessions.map(s => ({
      id: s.id,
      title: s.title,
      day: s.day,
      time: s.time,
      type: s.project,
      project: s.project,
      color: s.color,
      status: s.status,
      assignments: s.assignments,
      registered: s.registered ? JSON.parse(s.registered) : []
    }));
  }

  async findOne(id: string) {
    return this.prisma.liveSession.findUnique({
      where: { id },
      include: { assignments: { include: { staff: true } } }
    });
  }

  async update(id: string, data: any) {
    const { assignments, type, registered, ...rest } = data;
    if (type) rest.project = type;
    if (registered !== undefined) rest.registered = JSON.stringify(registered);
    
    if (assignments && assignments.create) {
      await this.prisma.liveSessionAssignment.deleteMany({ where: { liveSessionId: id } });
      await this.prisma.liveSessionAssignment.createMany({
        data: assignments.create.map((a: any) => ({ liveSessionId: id, staffId: Number(a.staffId) }))
      });
    }
    
    return this.prisma.liveSession.update({
      where: { id },
      data: rest
    });
  }

  async remove(id: string) {
    return this.prisma.liveSession.delete({ where: { id } });
  }

  async removeAssignment(assignmentId: string) {
    return this.prisma.liveSessionAssignment.delete({ where: { id: Number(assignmentId) } });
  }

  async assignStaff(shiftId: string, data: any) {
    return this.prisma.liveSessionAssignment.create({
      data: {
        liveSessionId: shiftId,
        staffId: Number(data.staffId)
      }
    });
  }
}
