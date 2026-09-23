import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrderDto: any) { return null; }
  async findAll() { return []; }
  async findOne(id: string) { return null; }
  async findByTracking(trackingCode: string) { return null; }
  async update(id: string, updateOrderDto: any) { return null; }
  async remove(id: string) { return null; }
}
