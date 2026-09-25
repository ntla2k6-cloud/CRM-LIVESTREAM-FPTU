import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    if (data.phone) {
      const giftName = data.gift || data.giftName || '';
      const existing = await this.prisma.shipment.findFirst({
        where: {
          phone: data.phone,
          giftName: giftName
        }
      });
      if (existing) {
        return existing;
      }
    }

    return this.prisma.shipment.create({
      data: {
        id: data.id || `DON-${Date.now().toString().slice(-6)}`,
        recipientName: data.winnerName || data.recipientName || '',
        phone: data.phone || '',
        address: data.address || '',
        status: data.status || 'Đã tạo đơn',
        giftName: data.gift || '',
        shippingProvider: data.shippingProvider,
        trackingCode: data.trackingCode
      }
    });
  }

  async findAll() {
    const shipments = await this.prisma.shipment.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return shipments.map(s => ({
      id: s.id,
      date: s.createdAt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      recipient: s.recipientName,
      phone: s.phone,
      address: s.address,
      gift: s.giftName || 'Quà tặng',
      status: s.status,
      shippingProvider: s.shippingProvider,
      trackingCode: s.trackingCode
    }));
  }

  async findOne(id: string) {
    return this.prisma.shipment.findUnique({ where: { id } });
  }

  async findByTracking(trackingCode: string) {
    return this.prisma.shipment.findFirst({ where: { trackingCode } });
  }

  async update(id: string, data: any) {
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.shippingProvider) updateData.shippingProvider = data.shippingProvider;
    if (data.trackingCode) updateData.trackingCode = data.trackingCode;
    if (data.address) updateData.address = data.address;
    if (data.phone) updateData.phone = data.phone;
    if (data.winnerName) updateData.recipientName = data.winnerName;
    if (data.gift) updateData.giftName = data.gift;

    return this.prisma.shipment.update({
      where: { id },
      data: updateData
    });
  }

  async remove(id: string) {
    return this.prisma.shipment.delete({ where: { id } });
  }
}
