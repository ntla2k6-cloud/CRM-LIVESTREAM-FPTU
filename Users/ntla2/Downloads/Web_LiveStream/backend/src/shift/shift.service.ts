import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ShiftService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    try {
      const assignments = data.assignments?.create || [];
      const registeredIds = JSON.stringify(data.registered || []);
      
      let dayVal: number | null = null;
      if (data.day !== undefined && data.day !== null) {
        const parsed = parseInt(String(data.day));
        dayVal = isNaN(parsed) ? null : parsed;
      }
      
      return await this.prisma.liveSession.create({
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
    } catch (error) {
      console.error('Error creating shift:', error);
      throw new InternalServerErrorException('Lỗi khi tạo ca trực mới');
    }
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
    const shift = await this.prisma.liveSession.findUnique({
      where: { id },
      include: { assignments: { include: { staff: true } } }
    });
    if (!shift) {
      throw new NotFoundException('Ca trực không tồn tại');
    }
    return shift;
  }

  async update(id: string, data: any) {
    try {
      const shiftExists = await this.prisma.liveSession.findUnique({ where: { id } });
      if (!shiftExists) {
        throw new NotFoundException('Ca trực không tồn tại');
      }

      const { assignments, type, registered, month, year, day, ...rest } = data;
      if (day !== undefined) rest.day = Number(day);
      if (type) rest.project = type;
      if (registered !== undefined) rest.registered = JSON.stringify(registered);
      
      if (rest.day !== undefined && month && year) {
        rest.scheduledAt = new Date(Date.UTC(Number(year), Number(month) - 1, Number(rest.day), 12, 0, 0));
      }
      
      if (assignments && assignments.create) {
        await this.prisma.liveSessionAssignment.deleteMany({ where: { liveSessionId: id } });
        
        if (assignments.create.length > 0) {
          await this.prisma.liveSessionAssignment.createMany({
            data: assignments.create.map((a: any) => ({ liveSessionId: id, staffId: Number(a.staffId) }))
          });
        }
      }
      
      return await this.prisma.liveSession.update({
        where: { id },
        data: rest
      });
    } catch (error: any) {
      console.error('Error updating shift:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Lỗi khi lưu phân công ca trực');
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.liveSession.delete({ where: { id } });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Ca trực không tồn tại');
      }
      throw new InternalServerErrorException('Lỗi khi xóa ca trực');
    }
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
