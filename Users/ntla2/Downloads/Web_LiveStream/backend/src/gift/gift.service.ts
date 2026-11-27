import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { GiftStockService, stockStatus, type StockActor } from './gift-stock.service.js';

@Injectable()
export class GiftService {
  constructor(private prisma: PrismaService, private stock: GiftStockService) {}

  /** Tạo quà: số tồn ban đầu ghi thành 1 lần nhập kho */
  async create(data: any, actor: StockActor) {
    const initial = Math.max(0, Math.floor(Number(data?.stock) || 0));
    const gift = await this.prisma.gift.create({
      data: { name: String(data?.name ?? '').trim(), sku: String(data?.sku ?? '').trim(), price: String(data?.price ?? ''), stock: 0, status: stockStatus(0) },
    }).catch((e: any) => {
      if (e?.code === 'P2002') throw new BadRequestException('Mã SKU đã tồn tại');
      throw e;
    });
    if (initial > 0) await this.stock.importStock(gift.id, { quantity: initial, note: 'Nhập kho ban đầu khi tạo quà' }, actor);
    return this.findOne(gift.id);
  }

  /** Danh sách kèm tổng đã nhập / đã tặng / tồn kho */
  async findAll() {
    const [gifts, totals] = await Promise.all([this.prisma.gift.findMany({ orderBy: { id: 'desc' } }), this.stock.totals()]);
    return gifts.map((g) => {
      const t = totals[g.id] ?? { imported: 0, given: 0, returned: 0, adjusted: 0 };
      return { ...g, status: stockStatus(g.stock), imported: t.imported, given: t.given - t.returned, adjusted: t.adjusted, sent: t.given - t.returned };
    });
  }

  async findOne(id: number) {
    const gift = await this.prisma.gift.findUnique({ where: { id } });
    if (!gift) throw new NotFoundException('Gift not found');
    return gift;
  }

  /** Sửa thông tin quà; đổi số tồn trực tiếp = điều chỉnh kiểm kê (ghi lịch sử) */
  async update(id: number, data: any, actor: StockActor) {
    await this.findOne(id);
    const info: any = {};
    for (const k of ['name', 'sku', 'price'] as const) if (data?.[k] !== undefined) info[k] = String(data[k]).trim();
    if (Object.keys(info).length) await this.prisma.gift.update({ where: { id }, data: info });
    if (data?.stock !== undefined && data.stock !== null && data.stock !== '') {
      await this.stock.adjust(id, Math.floor(Number(data.stock)), actor, data?.adjustNote);
    }
    return this.findOne(id);
  }

  remove(id: number) {
    return this.prisma.gift.delete({ where: { id } });
  }
}
