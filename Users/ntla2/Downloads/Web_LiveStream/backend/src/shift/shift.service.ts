import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ShiftService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    const assignments = data.assignments?.create || [];
    const registeredIds = JSON.stringify(data.registered || []);
    
    return this.prisma.liveSession.create({
      data: {
        title: data.title,
        day: data.day,
        time: data.time,
        project: data.type || data.project,
        color: data.color,
        registered: registeredIds,
        assignments: {
          create: assignments
        }
      }
    });
  }

  async findAll() {
    const sessions = await this.prisma.liveSession.findMany({
      include: {
        assignments: true
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
    return this.prisma.liveSession.findUnique({ where: { id } });
  }

  async update(id: string, data: any) {
    if (data.registered) {
      data.registered = JSON.stringify(data.registered);
    }
    
    const { assignments, type, ...rest } = data;
    if (type) rest.project = type;
    
    if (assignments && assignments.create) {
      await this.prisma.liveSessionAssignment.deleteMany({ where: { liveSessionId: id } });
      rest.assignments = { create: assignments.create.map((a: any) => ({ staffId: Number(a.staffId) })) };
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
