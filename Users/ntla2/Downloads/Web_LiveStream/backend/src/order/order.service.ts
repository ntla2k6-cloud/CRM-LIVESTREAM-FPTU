import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmailService, STATUS_LABELS, CARRIER_VISIBLE_STATUSES } from '../email/email.service.js';

// Trạng thái trước khi giao cho đơn vị vận chuyển
const BEFORE_CARRIER = ['UNPACKED', 'PACKED', 'SENT_TO_ADMIN', 'HANDED_OVER'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "@Ten.TikTok " → "ten.tiktok" để so khớp
export function normalizeTiktok(v?: string | null) {
  const s = (v ?? '').trim().replace(/^@+/, '').toLowerCase();
  return s || null;
}

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
        tiktokAccount:    normalizeTiktok(data.tiktokAccount),
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
    return this.toPublic(await this.findByTrackingRaw(code));
  }

  private toPublic(s: ReturnType<OrderService['formatShipment']>) {
    if (CARRIER_VISIBLE_STATUSES.includes(s.status)) return s;
    return { ...s, lastMileCarrier: null, lastMileTrackingCode: null, lastMileTrackingLink: null, shippingProvider: null, trackingLink: null };
  }

  private async findByTrackingRaw(code: string) {
    // Search by trackingCode / mã vận đơn ĐVVC → orderId → phone
    let s = await this.prisma.shipment.findFirst({
      where: { OR: [{ trackingCode: code }, { lastMileTrackingCode: code }] },
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
    
    // CUSTOMER STATUS MAPPING (Prevent duplicate emails if customer doesn't see a change)
    const CUSTOMER_MAP: Record<string, string> = {
      UNPACKED: 'RECEIVED', PACKED: 'PROCESSED', SENT_TO_ADMIN: 'PROCESSED', HANDED_OVER: 'SHIPPING', IN_TRANSIT: 'SHIPPING', COMPLETED: 'DELIVERED', RETURNED: 'RETURNED'
    };
    const oldCustStatus = CUSTOMER_MAP[existing.status] || existing.status;
    const newCustStatus = CUSTOMER_MAP[data.status] || data.status;
    const customerStatusChanged = data.status && (oldCustStatus !== newCustStatus);

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
    if (data.tiktokAccount !== undefined) updateData.tiktokAccount = normalizeTiktok(data.tiktokAccount);
    if (data.winnerName || data.recipientName) {
      updateData.recipientName = data.winnerName || data.recipientName;
    }
    if (data.gift || data.giftName) updateData.giftName = data.gift || data.giftName;

    const updated = await this.prisma.shipment.update({ where: { id }, data: updateData });

    // When status changes: create history
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
      
      // ONLY send email if CUSTOMER status changed
      if (customerStatusChanged) {
        this.emailService.sendStatusUpdate({ ...updated, id }, data.status).catch(() => {});
      }
    }

    return updated;
  }

  /** Thủ kho chọn nhiều đơn đã đóng gói → "Chuyển Hành chính" (hoặc đổi trạng thái hàng loạt). */
  async bulkStatus(ids: string[], status: string, note?: string) {
    if (!Array.isArray(ids) || ids.length === 0) throw new BadRequestException('Chưa chọn đơn nào');
    if (!STATUS_LABELS[status]) throw new BadRequestException(`Trạng thái không hợp lệ: ${status}`);
    let updated = 0;
    const notFound: string[] = [];
    for (const id of ids) {
      try {
        await this.update(id, { status, note });
        updated++;
      } catch (e) {
        if (e instanceof NotFoundException) notFound.push(id); else throw e;
      }
    }
    return { updated, notFound };
  }

  /**
   * Hành chính gửi lại file mã vận đơn → Thủ kho nhập: gắn ĐVVC + mã + link cho từng đơn.
   * Đơn chưa giao ĐVVC (UNPACKED/PACKED/SENT_TO_ADMIN) chuyển sang HANDED_OVER (ghi lịch sử, gửi mail khách).
   */
  async bulkTracking(rows: Array<{ id?: string; carrier?: string; trackingCode?: string; trackingLink?: string }>) {
    if (!Array.isArray(rows) || rows.length === 0) throw new BadRequestException('File không có dòng nào');
    if (rows.length > 1000) throw new BadRequestException('Tối đa 1000 dòng mỗi lần');
    const result = { updated: 0, notFound: [] as string[], invalid: [] as string[] };
    for (const row of rows) {
      const id = row.id?.trim();
      const trackingCode = row.trackingCode?.trim();
      if (!id || !trackingCode) {
        result.invalid.push(id || '(thiếu mã đơn)');
        continue;
      }
      const existing = await this.prisma.shipment.findUnique({ where: { id } });
      if (!existing) {
        result.notFound.push(id);
        continue;
      }
      const carrier = row.carrier?.trim() || existing.lastMileCarrier || '';
      await this.update(id, {
        lastMileCarrier: carrier,
        lastMileTrackingCode: trackingCode,
        lastMileTrackingLink: row.trackingLink?.trim() || undefined,
        ...(BEFORE_CARRIER.includes(existing.status) && {
          status: 'IN_TRANSIT',
          note: `Hành chính gửi ${carrier || 'ĐVVC'} — mã vận đơn ${trackingCode}`,
        }),
      });
      result.updated++;
    }
    return result;
  }

  /**
   * Thủ kho nhập email (người trúng nhắn qua TikTok) rồi gửi mail chúc mừng kèm mã đơn dự án + link tracking.
   * items: [{ id, email? }] — có email thì lưu trước khi gửi. Mỗi đơn báo kết quả riêng.
   */
  async sendCongrats(items: Array<{ id: string; email?: string }>, resend = false) {
    if (!Array.isArray(items) || items.length === 0) throw new BadRequestException('Chưa chọn đơn nào');
    if (!this.emailService.isConfigured) {
      throw new BadRequestException('Chưa kết nối email: đặt SMTP_HOST, SMTP_USER, SMTP_PASS (và SMTP_FROM_EMAIL) trên Render');
    }
    const results: Array<{ id: string; ok: boolean; error?: string }> = [];
    for (const item of items) {
      const email = item.email?.trim();
      try {
        if (email && !EMAIL_RE.test(email)) throw new Error('Email không hợp lệ');
        const existing = await this.prisma.shipment.findUnique({ where: { id: item.id } });
        if (!existing) throw new Error('Không tìm thấy đơn');
        if (existing.congratsSentAt && !resend) throw new Error('Đã gửi mail chúc mừng trước đó');
        const shipment = email && email !== existing.recipientEmail
          ? await this.prisma.shipment.update({ where: { id: item.id }, data: { recipientEmail: email } })
          : existing;
        if (!shipment.recipientEmail) throw new Error('Chưa có email');
        await this.emailService.sendCongrats(shipment);
        await this.prisma.shipment.update({ where: { id: item.id }, data: { congratsSentAt: new Date() } });
        results.push({ id: item.id, ok: true });
      } catch (e: any) {
        results.push({ id: item.id, ok: false, error: e.message });
      }
    }
    return { sent: results.filter((r) => r.ok).length, results };
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
      tiktokAccount:        s.tiktokAccount || null,
      congratsSentAt:       s.congratsSentAt || null,
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
