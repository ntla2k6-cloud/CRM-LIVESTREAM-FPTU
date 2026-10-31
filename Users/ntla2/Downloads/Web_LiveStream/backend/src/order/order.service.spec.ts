import { OrderService } from './order.service.js';

function makeService(initial: any[]) {
  const rows = new Map(initial.map((s) => [s.id, { ...s }]));
  const histories: any[] = [];
  const prisma: any = {
    shipment: {
      findUnique: vi.fn(async ({ where }) => rows.get(where.id) ?? null),
      update: vi.fn(async ({ where, data }) => Object.assign(rows.get(where.id), data)),
    },
    shipmentHistory: { create: vi.fn(async ({ data }) => { histories.push(data); return data; }) },
  };
  const email = { sendStatusUpdate: vi.fn().mockResolvedValue(undefined) };
  return { service: new OrderService(prisma, email as any), rows, histories, email };
}

describe('OrderService.bulkTracking', () => {
  it('gắn mã vận đơn, đơn chưa giao ĐVVC chuyển HANDED_OVER + lịch sử + mail; báo đơn không tìm thấy/thiếu mã', async () => {
    const { service, rows, histories, email } = makeService([
      { id: 'DON-1', status: 'SENT_TO_ADMIN' },
      { id: 'DON-2', status: 'IN_TRANSIT', lastMileCarrier: 'GHTK' },
    ]);

    const res = await service.bulkTracking([
      { id: 'DON-1', carrier: 'Viettel Post', trackingCode: 'VTP123' },
      { id: 'DON-2', trackingCode: 'GHTK999' },
      { id: 'DON-404', carrier: 'GHTK', trackingCode: 'X' },
      { id: 'DON-1', carrier: 'GHTK', trackingCode: '' },
    ]);

    expect(res).toEqual({ updated: 2, notFound: ['DON-404'], invalid: ['DON-1'] });
    expect(rows.get('DON-1')).toMatchObject({ status: 'HANDED_OVER', lastMileCarrier: 'Viettel Post', lastMileTrackingCode: 'VTP123' });
    // Đơn đã đang vận chuyển: chỉ cập nhật mã, giữ trạng thái và ĐVVC cũ
    expect(rows.get('DON-2')).toMatchObject({ status: 'IN_TRANSIT', lastMileCarrier: 'GHTK', lastMileTrackingCode: 'GHTK999' });
    expect(histories).toHaveLength(1);
    expect(histories[0]).toMatchObject({ shipmentId: 'DON-1', status: 'HANDED_OVER' });
    expect(email.sendStatusUpdate).toHaveBeenCalledTimes(1);
  });
});

describe('OrderService.bulkStatus', () => {
  it('chuyển Hành chính không gửi mail khách (khách vẫn thấy "Đã xử lý")', async () => {
    const { service, rows, histories, email } = makeService([{ id: 'DON-1', status: 'PACKED' }]);
    const res = await service.bulkStatus(['DON-1', 'DON-9'], 'SENT_TO_ADMIN');
    expect(res).toEqual({ updated: 1, notFound: ['DON-9'] });
    expect(rows.get('DON-1')!.status).toBe('SENT_TO_ADMIN');
    expect(histories[0]).toMatchObject({ status: 'SENT_TO_ADMIN', location: 'Phòng Hành chính FPTU' });
    expect(email.sendStatusUpdate).not.toHaveBeenCalled();
  });

  it('từ chối trạng thái lạ', async () => {
    const { service } = makeService([]);
    await expect(service.bulkStatus(['DON-1'], 'FOO')).rejects.toThrow('Trạng thái không hợp lệ');
  });
});
