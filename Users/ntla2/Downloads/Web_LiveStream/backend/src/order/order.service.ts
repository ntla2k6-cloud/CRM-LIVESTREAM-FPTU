import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrderDto: any) {
    return this.prisma.order.create({
      data: createOrderDto,
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: { gift: true },
      orderBy: { date: 'desc' }
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { gift: true }
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findByTracking(trackingCode: string) {
    const order = await this.prisma.order.findFirst({
      where: { trackingCode },
      include: { gift: true }
    });
    if (!order) throw new NotFoundException('Tracking code not found');
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const oldOrder = await this.findOne(id);
    const newOrder = await this.prisma.order.update({
      where: { id },
      data: updateOrderDto as any,
    });

    // Nếu trạng thái thay đổi, tiến hành gửi email
    if (newOrder.status !== oldOrder.status) {
      this.sendTrackingEmail(newOrder);

      // TỰ ĐỘNG TRỪ/CỘNG TỒN KHO khi chuyển trạng thái
      const beforeProcessed = ['Đã tiếp nhận', 'Chờ xử lý'];
      
      const wasBefore = beforeProcessed.includes(oldOrder.status);
      const isNowBefore = beforeProcessed.includes(newOrder.status);

      if (wasBefore && !isNowBefore) {
        // Chuyển từ chưa xử lý -> Đã xử lý/Vận chuyển (Trừ kho)
        await this.prisma.gift.update({
          where: { id: newOrder.giftId },
          data: {
            stock: { decrement: newOrder.qty },
            sent: { increment: newOrder.qty }
          }
        });
      } else if (!wasBefore && isNowBefore) {
        // Hoàn tác: từ Đã xử lý -> Chưa xử lý (Cộng lại kho)
        await this.prisma.gift.update({
          where: { id: newOrder.giftId },
          data: {
            stock: { increment: newOrder.qty },
            sent: { decrement: newOrder.qty }
          }
        });
      }
    }

    return newOrder;
  }

  async remove(id: string) {
    return this.prisma.order.delete({ where: { id } });
  }

  private sendTrackingEmail(order: any) {
    console.log('----------------------------------------------------');
    console.log(`[EMAIL MOCK] Sending email to: ${order.recipient}`);
    console.log(`[EMAIL MOCK] Status changed to: ${order.status}`);
    
    switch (order.status) {
      case 'Đã tiếp nhận':
        console.log('[EMAIL MOCK] Template: Đơn quà của bạn đã được tiếp nhận và đang chuẩn bị.');
        break;
      case 'Đã xử lý':
        console.log('[EMAIL MOCK] Template: Đơn quà đã đóng gói xong, chờ đơn vị vận chuyển tới lấy.');
        break;
      case 'Đang vận chuyển':
        console.log(`[EMAIL MOCK] Template: Đơn quà đang được giao bởi ${order.shippingProvider}`);
        console.log(`[EMAIL MOCK] Mã vận đơn: ${order.trackingCode}`);
        console.log(`[EMAIL MOCK] Link theo dõi: ${order.trackingLink}`);
        break;
      case 'Đã giao':
        console.log('[EMAIL MOCK] Template: Quà đã được giao thành công. Cảm ơn bạn đã tham gia chương trình!');
        break;
    }
    console.log('----------------------------------------------------');
  }
}
