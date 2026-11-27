import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { GiftStockService, stockStatus } from './gift-stock.service.js';
import { OrderService } from '../order/order.service.js';

// DB giả: kho quà + đơn + lịch sử kho
function makeDb(gifts: Array<{ id: number; name: string; stock: number }>) {
  const g = new Map(gifts.map((x) => [x.id, { ...x, status: '' }]));
  const ships = new Map<string, any>();
  const moves: any[] = [];
  const prisma: any = {
    gift: {
      findMany: vi.fn(async () => [...g.values()].map((x) => ({ ...x }))),
      findUnique: vi.fn(async ({ where }) => (g.has(where.id) ? { ...g.get(where.id) } : null)),
      updateMany: vi.fn(async ({ where, data }) => {
        const x = g.get(where.id);
        if (!x || x.stock < where.stock.gte) return { count: 0 };
        x.stock -= data.stock.decrement;
        return { count: 1 };
      }),
      update: vi.fn(async ({ where, data }) => {
        const x = g.get(where.id)!;
        if (data.stock?.increment) x.stock += data.stock.increment;
        else if (typeof data.stock === 'number') x.stock = data.stock;
        if (data.status) x.status = data.status;
        return { ...x };
      }),
    },
    giftMovement: { create: vi.fn(async ({ data }) => { moves.push(data); return data; }) },
    shipment: {
      findFirst: vi.fn(async () => null),
      findUnique: vi.fn(async ({ where }) => (ships.has(where.id) ? { ...ships.get(where.id) } : null)),
      create: vi.fn(async ({ data }) => { ships.set(data.id, { giftId: null, ...data }); return { ...ships.get(data.id) }; }),
      update: vi.fn(async ({ where, data }) => Object.assign(ships.get(where.id), data)),
      delete: vi.fn(async ({ where }) => { ships.delete(where.id); }),
    },
    shipmentHistory: { create: vi.fn(async () => ({})) },
  };
  const stock = new GiftStockService(prisma);
  const email = { sendStatusUpdate: vi.fn().mockResolvedValue(undefined), isConfigured: false } as any;
  return { orders: new OrderService(prisma, email, stock), stock, g, ships, moves };
}

const KHO = { id: 'u1', name: 'Thảo Duyên', role: 'THU_KHO' };

describe('Kho quà', () => {
  it('tạo đơn trừ 1 quà + ghi lịch sử OUT có người làm; hết hàng → báo lỗi và không tạo đơn', async () => {
    const { orders, g, ships, moves } = makeDb([{ id: 1, name: 'Áo', stock: 1 }]);
    await orders.create({ id: 'DON-1', giftName: '  áo ', phone: '0901' }, KHO); // khoảng trắng/hoa thường không ảnh hưởng
    expect(g.get(1)!.stock).toBe(0);
    expect(ships.get('DON-1')!.giftId).toBe(1);
    expect(moves[0]).toMatchObject({ type: 'OUT', quantity: 1, stockAfter: 0, shipmentId: 'DON-1', actorName: 'Thảo Duyên' });
    await expect(orders.create({ id: 'DON-2', giftName: 'Áo', phone: '0902' }, KHO)).rejects.toThrow(BadRequestException);
    expect(ships.has('DON-2')).toBe(false);
  });

  it('xóa đơn / hoàn hàng trả quà về kho đúng 1 lần; đổi quà trả cũ trừ mới', async () => {
    const { orders, g, ships, moves } = makeDb([{ id: 1, name: 'Áo', stock: 5 }, { id: 2, name: 'Balo', stock: 5 }]);
    await orders.create({ id: 'DON-1', giftName: 'Áo', status: 'PACKED' }, KHO);
    await orders.update('DON-1', { giftName: 'Balo' }, KHO);
    expect([g.get(1)!.stock, g.get(2)!.stock]).toEqual([5, 4]);
    await orders.update('DON-1', { status: 'RETURNED' }, KHO);
    expect(g.get(2)!.stock).toBe(5);
    await orders.update('DON-1', { status: 'RETURNED' }, KHO); // lặp lại không cộng thêm
    expect(g.get(2)!.stock).toBe(5);
    await orders.remove('DON-1', KHO); // đơn đã hoàn kho → xóa không cộng nữa
    expect(g.get(2)!.stock).toBe(5);
    expect(ships.has('DON-1')).toBe(false);
    expect(moves.map((m) => m.type)).toEqual(['OUT', 'RETURN', 'OUT', 'RETURN']);
  });

  it('nhập kho: chỉ Thủ kho/Quản lý/Admin, số dương; điều chỉnh ghi chênh lệch', async () => {
    const { stock, g, moves } = makeDb([{ id: 1, name: 'Áo', stock: 2 }]);
    await expect(stock.importStock(1, { quantity: 5 }, { role: 'CSKH' })).rejects.toThrow(ForbiddenException);
    await expect(stock.importStock(1, { quantity: -3 }, KHO)).rejects.toThrow('nguyên dương');
    await stock.importStock(1, { quantity: 50, note: 'Lô tháng 12' }, KHO);
    expect(g.get(1)!.stock).toBe(52);
    await stock.adjust(1, 49, KHO);
    expect(moves.map((m) => [m.type, m.quantity, m.stockAfter])).toEqual([['IN', 50, 52], ['ADJUST', -3, 49]]);
    expect([stockStatus(0), stockStatus(7), stockStatus(49)]).toEqual(['Hết hàng', 'Sắp hết', 'Sẵn sàng']);
  });
});
