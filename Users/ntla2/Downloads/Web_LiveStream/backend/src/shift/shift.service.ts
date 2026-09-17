import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ShiftService {
  constructor(private prisma: PrismaService) {}

  create(createShiftDto: any) {
    return this.prisma.shift.create({ data: createShiftDto });
  }

  findAll() {
    return this.prisma.shift.findMany({
      include: {
        assignments: {
          include: { staff: true }
        }
      }
    });
  }

  findOne(id: number) {
    return this.prisma.shift.findUnique({
      where: { id },
      include: { assignments: { include: { staff: true } } }
    });
  }

  update(id: number, updateShiftDto: any) {
    return this.prisma.shift.update({
      where: { id },
      data: updateShiftDto,
    });
  }

  remove(id: number) {
    return this.prisma.shift.delete({ where: { id } });
  }

  // Add staff to shift
  async assignStaff(shiftId: number, staffId: number) {
    return this.prisma.shiftAssignment.create({
      data: { shiftId, staffId }
    });
  }

  // Remove staff from shift
  async removeStaff(assignmentId: number) {
    return this.prisma.shiftAssignment.delete({
      where: { id: assignmentId }
    });
  }
}
