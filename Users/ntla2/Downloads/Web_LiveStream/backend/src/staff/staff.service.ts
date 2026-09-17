import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  create(createStaffDto: any) {
    return this.prisma.staff.create({ data: createStaffDto });
  }

  findAll() {
    return this.prisma.staff.findMany();
  }

  findOne(id: number) {
    return this.prisma.staff.findUnique({ where: { id } });
  }

  update(id: number, updateStaffDto: any) {
    return this.prisma.staff.update({
      where: { id },
      data: updateStaffDto,
    });
  }

  remove(id: number) {
    return this.prisma.staff.delete({ where: { id } });
  }
}
