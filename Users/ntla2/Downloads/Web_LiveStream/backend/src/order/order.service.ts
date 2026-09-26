import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmailService, STATUS_LABELS } from '../email/email.service.js';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async create(data: any) {
    if (data.phone) {
      const giftName = data.gift || data.giftName || '';
      const existing = await this.prisma.shipment.findFirst({
        where: { phone: data.phone, giftName }
      });
      if (existing) return existing;
    }

    const shipment = await this.prisma.shipment.create({
      data: {
        id: data.id || `DON-${Date.now().toString().slice(-6)}`,
        recipientName:    data.recipientName || data.winnerName || '',
        phone:            data.phone || '',
        address:          data.address || '',
        recipientEmail:   data.recipientEmail || null,
        senderName:       data.senderName || 'Uống Gì Chưa',
        senderAddress:    data.senderAddress || 'FPT University HCM, Lô E2a-7, Đường D1, Long Thạnh Mỹ, TP.HCM',
        status:           data.status || 'PACKED',
        currentLocation:  data.currentLocation || 'Kho Uống Gì Chưa',
        giftName:         data.gift || data.giftName || '',
        liveSessionId:    data.liveSessionId || null,
        shippingProvider: data.shippingProvider || null,
        trackingCode:     data.trackingCode || null,
        trackingLink:     data.trackingLink || null,
      }
    });

    // Create initial history entry
    await this.prisma.shipmentHistory.create({
      data: {
        shipmentId: shipment.id,
        status:     shipment.status,
        location:   shipment.currentLocation || 'Kho Uống Gì Chưa',
        note:       'Đơn hàng được tạo',
      }
    });

    return shipment;
  }

  async findAll(sessionId?: string) {
    const where = sessionId ? { liveSessionId: sessionId } : {};
    const shipments = await this.prisma.shipment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { histories: { orderBy: { timestamp: 'desc' } } }
    });

    return shipments.map(s => this.formatShipment(s));
  }

  async findOne(id: string) {
    const s = await this.prisma.shipment.findUnique({
      where: { id },
      include: { histories: { orderBy: { timestamp: 'desc' } } }
    });
    if (!s) return null;
    return this.formatShipment(s);
  }

  async findByTracking(code: string) {
    // Search by trackingCode → orderId → phone
    let s = await this.prisma.shipment.findFirst({
      where: { trackingCode: code },
      include: { histories: { orderBy: { timestamp: 'desc' } } }
    });

    if (!s) {
      s = await this.prisma.shipment.findFirst({
        where: { id: code },
        include: { histories: { orderBy: { timestamp: 'desc' } } }
      });
    }

    if (!s) {
      s = await this.prisma.shipment.findFirst({
        where: { phone: code },
        orderBy: { createdAt: 'desc' },
        include: { histories: { orderBy: { timestamp: 'desc' } } }
      });
    }

    if (!s) throw new NotFoundException('Không tìm thấy đơn hàng');
    return this.formatShipment(s);
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.shipment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Đơn hàng không tồn tại');

    const statusChanged = data.status && data.status !== existing.status;

    const updateData: any = {};
    if (data.status)               updateData.status = data.status;
    if (data.currentLocation)      updateData.currentLocation = data.currentLocation;
    if (data.lastMileCarrier)      updateData.lastMileCarrier = data.lastMileCarrier;
    if (data.lastMileTrackingCode) updateData.lastMileTrackingCode = data.lastMileTrackingCode;
    if (data.lastMileTrackingLink) updateData.lastMileTrackingLink = data.lastMileTrackingLink;
    if (data.shippingProvider)     updateData.shippingProvider = data.shippingProvider;
    if (data.trackingCode)         updateData.trackingCode = data.trackingCode;
    if (data.trackingLink)         updateData.trackingLink = data.trackingLink;
    if (data.address)              updateData.address = data.address;
    if (data.phone)                updateData.phone = data.phone;
    if (data.recipientEmail)       updateData.recipientEmail = data.recipientEmail;
    if (data.winnerName || data.recipientName) {
      updateData.recipientName = data.winnerName || data.recipientName;
    }
    if (data.gift || data.giftName) updateData.giftName = data.gift || data.giftName;

    const updated = await this.prisma.shipment.update({ where: { id }, data: updateData });

    // When status changes: create history + send email
    if (statusChanged) {
      const statusInfo = STATUS_LABELS[data.status];
      const location = data.currentLocation || (statusInfo?.location) || data.status;

      await this.prisma.shipmentHistory.create({
        data: {
          shipmentId: id,
          status:     data.status,
          location,
          note:       data.note || null,
        }
      });

      // Send email notification (non-blocking)
      this.emailService.sendStatusUpdate({ ...updated, id }, data.status)
        .catch(() => {}); // never crash the response
    }

    return updated;
  }

  async remove(id: string) {
    return this.prisma.shipment.delete({ where: { id } });
  }

  async getHistory(id: string) {
    const histories = await this.prisma.shipmentHistory.findMany({
      where: { shipmentId: id },
      orderBy: { timestamp: 'desc' }
    });
    return histories;
  }

  // ─── helpers ────────────────────────────────────────────────────────────────
  private formatShipment(s: any) {
    const statusInfo = STATUS_LABELS[s.status];
    return {
      id:                   s.id,
      date:                 s.createdAt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      // Người gửi
      senderName:           s.senderName || 'Uống Gì Chưa',
      senderAddress:        s.senderAddress || 'FPT University HCM',
      // Người nhận
      recipient:            s.recipientName || '',
      recipientName:        s.recipientName || '',
      phone:                s.phone || '',
      address:              s.address || '',
      recipientEmail:       s.recipientEmail || null,
      // Quà & phiên
      gift:                 s.giftName || 'Quà tặng',
      liveSessionId:        s.liveSessionId || null,
      // Trạng thái
      status:               s.status,
      statusLabel:          statusInfo?.label || s.status,
      currentLocation:      s.currentLocation || statusInfo?.location || '',
      // NCC chặng cuối
      lastMileCarrier:      s.lastMileCarrier || null,
      lastMileTrackingCode: s.lastMileTrackingCode || null,
      lastMileTrackingLink: s.lastMileTrackingLink || null,
      // Legacy
      shippingProvider:     s.shippingProvider || null,
      trackingCode:         s.trackingCode || null,
      trackingLink:         s.trackingLink || null,
      // Timeline
      histories:            (s.histories || []).map((h: any) => ({
        id:        h.id,
        status:    h.status,
        statusLabel: STATUS_LABELS[h.status]?.label || h.status,
        location:  h.location || '',
        note:      h.note || null,
        timestamp: h.timestamp,
        timeStr:   new Date(h.timestamp).toLocaleString('vi-VN', {
          hour: '2-digit', minute: '2-digit',
          day: '2-digit', month: '2-digit', year: 'numeric'
        }),
      })),
    };
  }
}
