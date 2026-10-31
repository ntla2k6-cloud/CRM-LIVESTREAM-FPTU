import { OrderService } from './order.service.js';

function makeService(initial: any[]) {
  const rows = new Map(initial.map((s) => [s.id, { ...s }]));
  const histories: any[] = [];
  const prisma: any = {
    shipment: {
      findUnique: vi.fn(async ({ where }) => rows.get(where.id) ?? null),
      findFirst: vi.fn(async ({ where }) => [...rows.values()].find((r: any) => (where.OR ?? [{ id: where.id }, { phone: where.phone }]).some((c: any) => Object.entries(c).every(([k, v]) => v !== undefined && r[k] === v))) ?? null),
      update: vi.fn(async ({ where, data }) => Object.assign(rows.get(where.id), data)),
    },
    shipmentHistory: { create: vi.fn(async ({ data }) => { histories.push(data); return data; }) },
  };
  const email = { sendStatusUpdate: vi.fn().mockResolvedValue(undefined), sendCongrats: vi.fn().mockResolvedValue(undefined), isConfigured: true };
  return { service: new OrderService(prisma, email as any), rows, histories, email };
}

describe('OrderService.bulkTracking', () => {
  it('gắn mã vận đơn, đơn chưa giao ĐVVC chuyển IN_TRANSIT + lịch sử + mail; báo đơn không tìm thấy/thiếu mã', async () => {
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
    expect(rows.get('DON-1')).toMatchObject({ status: 'IN_TRANSIT', lastMileCarrier: 'Viettel Post', lastMileTrackingCode: 'VTP123' });
    // Đơn đã đang vận chuyển: chỉ cập nhật mã, giữ trạng thái và ĐVVC cũ
    expect(rows.get('DON-2')).toMatchObject({ status: 'IN_TRANSIT', lastMileCarrier: 'GHTK', lastMileTrackingCode: 'GHTK999' });
    expect(histories).toHaveLength(1);
    expect(histories[0]).toMatchObject({ shipmentId: 'DON-1', status: 'IN_TRANSIT' });
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

describe('OrderService.sendCongrats', () => {
  it('lưu email Thủ kho nhập, gửi mail, đánh dấu đã gửi; không gửi lại, báo lỗi từng đơn', async () => {
    const { service, rows, email } = makeService([
      { id: 'DON-1', status: 'PACKED', giftName: 'Balo' },
      { id: 'DON-2', status: 'PACKED' },
      { id: 'DON-3', status: 'PACKED', recipientEmail: 'c@x.vn', congratsSentAt: new Date() },
    ]);
    const res = await service.sendCongrats([{ id: 'DON-1', email: ' a@x.vn ' }, { id: 'DON-2' }, { id: 'DON-3' }, { id: 'DON-4', email: 'sai' }]);

    expect(res.sent).toBe(1);
    expect(rows.get('DON-1')).toMatchObject({ recipientEmail: 'a@x.vn' });
    expect(rows.get('DON-1')!.congratsSentAt).toBeInstanceOf(Date);
    expect(email.sendCongrats).toHaveBeenCalledTimes(1);
    expect(res.results.map((r) => r.error ?? 'ok')).toEqual(['ok', 'Chưa có email', 'Đã gửi mail chúc mừng trước đó', 'Email không hợp lệ']);
  });

  it('chưa cấu hình SMTP → báo rõ', async () => {
    const { service, email } = makeService([{ id: 'DON-1' }]);
    (email as any).isConfigured = false;
    await expect(service.sendCongrats([{ id: 'DON-1', email: 'a@x.vn' }])).rejects.toThrow('SMTP');
  });
});

describe('OrderService.findByTracking', () => {
  const base = { createdAt: new Date(), histories: [], lastMileCarrier: 'GHTK', lastMileTrackingCode: 'G1', lastMileTrackingLink: 'http://g' };
  it('ẩn mã ĐVVC với khách khi chưa đang vận chuyển, hiện khi IN_TRANSIT', async () => {
    const { service } = makeService([{ ...base, id: 'DON-1', status: 'HANDED_OVER' }, { ...base, id: 'DON-2', status: 'IN_TRANSIT' }]);
    expect(await service.findByTracking('DON-1')).toMatchObject({ lastMileTrackingCode: null, lastMileCarrier: null });
    expect(await service.findByTracking('DON-2')).toMatchObject({ lastMileTrackingCode: 'G1', lastMileCarrier: 'GHTK' });
  });
});
