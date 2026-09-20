import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class GiftService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.gift.create({ data });
  }

  findAll() {
    return this.prisma.gift.findMany({ orderBy: { id: 'desc' } });
  }

  async findOne(id: number) {
    const gift = await this.prisma.gift.findUnique({ where: { id } });
    if (!gift) throw new NotFoundException('Gift not found');
    return gift;
  }

  update(id: number, data: any) {
    return this.prisma.gift.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.gift.delete({ where: { id } });
  }
}
