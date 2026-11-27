import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export type StockActor = { id?: string; name?: string; role?: string };
export const STOCK_ROLES = ['ADMIN', 'MANAGER', 'THU_KHO'];

/** Trạng thái hiển thị theo tồn kho */
export const stockStatus = (stock: number) => (stock <= 0 ? 'Hết hàng' : stock <= 10 ? 'Sắp hết' : 'Sẵn sàng');

/**
 * Kho quà: mọi thay đổi tồn kho đi qua đây và ghi GiftMovement (ai, lúc nào, bao nhiêu, đơn nào).
 * - Đơn quà tạo → consume (trừ 1, OUT, ghi Shipment.giftId). Hết hàng → báo lỗi.
 * - Xóa đơn / đổi quà / đơn hoàn hàng → release (cộng 1, RETURN, xóa giftId) — chỉ khi đơn đã trừ kho.
 * - Nhập kho → IN. Sửa số tồn tay (kiểm kê) → ADJUST.
 */
@Injectable()
export class GiftStockService {
  constructor(private prisma: PrismaService) {}

  private async move(giftId: number, type: string, quantity: number, stockAfter: number, actor?: StockActor, extra: { shipmentId?: string | null; note?: string | null } = {}) {
    await this.prisma.giftMovement.create({
      data: { giftId, type, quantity, stockAfter, actorId: actor?.id, actorName: actor?.name, shipmentId: extra.shipmentId ?? null, note: extra.note ?? null },
    });
    await this.prisma.gift.update({ where: { id: giftId }, data: { status: stockStatus(stockAfter) } });
  }

  /** Quà khớp tên đơn (đơn lưu tên quà dạng chữ) */
  async findGiftByName(name?: string | null) {
    // So tên bỏ khoảng trắng thừa + không phân biệt hoa thường (DB có tên lỡ gõ dư dấu cách như "Dù FPTU ")
    const norm = (v: unknown) => String(v ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
    const n = norm(name);
    if (!n) return null;
    const gifts = await this.prisma.gift.findMany({ select: { id: true, name: true, stock: true } });
    return gifts.find((g) => norm(g.name) === n) ?? null;
  }

  /** Trừ 1 quà cho đơn. Không tìm thấy quà theo tên → không trừ (trả null). */
  async consume(shipmentId: string, giftName: string | null | undefined, actor?: StockActor) {
    const gift = await this.findGiftByName(giftName);
    if (!gift) return null;
    // Trừ có điều kiện: chỉ khi còn hàng (tránh 2 người tạo đơn cùng lúc làm âm kho)
    const res = await this.prisma.gift.updateMany({ where: { id: gift.id, stock: { gte: 1 } }, data: { stock: { decrement: 1 } } });
    if (res.count === 0) throw new BadRequestException(`Quà "${gift.name}" đã hết trong kho — nhập kho trước khi tạo đơn`);
    // Đọc lại tồn kho thật sau khi trừ (có thể có người khác vừa nhập/trừ cùng lúc)
    const after = (await this.prisma.gift.findUnique({ where: { id: gift.id }, select: { stock: true } }))?.stock ?? gift.stock - 1;
    await this.prisma.shipment.update({ where: { id: shipmentId }, data: { giftId: gift.id } });
    await this.move(gift.id, 'OUT', 1, after, actor, { shipmentId, note: 'Tặng theo đơn' });
    return gift.id;
  }

  /** Hoàn 1 quà về kho nếu đơn đã trừ kho trước đó */
  async release(shipment: { id: string; giftId?: number | null }, actor?: StockActor, note = 'Hoàn về kho') {
    if (!shipment.giftId) return;
    const gift = await this.prisma.gift.update({ where: { id: shipment.giftId }, data: { stock: { increment: 1 } } }).catch(() => null);
    await this.prisma.shipment.update({ where: { id: shipment.id }, data: { giftId: null } }).catch(() => null);
    if (gift) await this.move(gift.id, 'RETURN', 1, gift.stock, actor, { shipmentId: shipment.id, note });
  }

  /** Nhập thêm hàng vào kho */
  async importStock(giftId: number, body: any, actor: StockActor) {
    if (!actor.role || !STOCK_ROLES.includes(actor.role)) throw new ForbiddenException('Chỉ Thủ kho / Quản lý / Admin được nhập kho');
    const quantity = Number(body?.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100000) throw new BadRequestException('Số lượng nhập phải là số nguyên dương');
    const exists = await this.prisma.gift.findUnique({ where: { id: giftId } });
    if (!exists) throw new NotFoundException('Không tìm thấy quà');
    const gift = await this.prisma.gift.update({ where: { id: giftId }, data: { stock: { increment: quantity } } });
    await this.move(giftId, 'IN', quantity, gift.stock, actor, { note: String(body?.note ?? '').trim() || null });
    return { ...gift, status: stockStatus(gift.stock) };
  }

  /** Sửa số tồn trực tiếp (kiểm kê) → ghi chênh lệch */
  async adjust(giftId: number, newStock: number, actor: StockActor, note?: string) {
    const gift = await this.prisma.gift.findUnique({ where: { id: giftId } });
    if (!gift || gift.stock === newStock) return;
    if (!Number.isInteger(newStock) || newStock < 0) throw new BadRequestException('Tồn kho phải là số nguyên ≥ 0');
    await this.prisma.gift.update({ where: { id: giftId }, data: { stock: newStock } });
    await this.move(giftId, 'ADJUST', newStock - gift.stock, newStock, actor, { note: note || 'Điều chỉnh tồn kho (kiểm kê)' });
  }

  /** Tổng nhập / đã tặng theo từng quà */
  async totals() {
    const rows = await this.prisma.giftMovement.groupBy({ by: ['giftId', 'type'], _sum: { quantity: true } });
    const out: Record<number, { imported: number; given: number; returned: number; adjusted: number }> = {};
    for (const r of rows) {
      const t = (out[r.giftId] ??= { imported: 0, given: 0, returned: 0, adjusted: 0 });
      const q = r._sum.quantity ?? 0;
      if (r.type === 'IN') t.imported += q;
      else if (r.type === 'OUT') t.given += q;
      else if (r.type === 'RETURN') t.returned += q;
      else if (r.type === 'ADJUST') t.adjusted += q;
    }
    return out;
  }

  movements(giftId: number) {
    return this.prisma.giftMovement.findMany({ where: { giftId }, orderBy: { createdAt: 'desc' }, take: 500 });
  }
}
