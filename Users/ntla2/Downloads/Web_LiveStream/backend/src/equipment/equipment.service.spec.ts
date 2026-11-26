import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { EquipmentService, isOverdue, isLenderOverdue, formatCode, cleanInput, diff } from './equipment.service.js';

const ADMIN = { id: 'u-admin', name: 'Admin', role: 'ADMIN' };
const MANAGER = { id: 'u-mgr', name: 'Quản lý', role: 'MANAGER' };
const STAFF = { id: 'u-staff', name: 'NV', role: 'CSKH' };
const THU_KHO = { id: 'u-kho', name: 'Thủ kho', role: 'THU_KHO' };

function makeService(initial: any[] = []) {
  const rows = new Map(initial.map((e) => [e.id, { deletedAt: null, ...e }]));
  const histories: any[] = [];
  const prisma: any = {
    equipment: {
      count: vi.fn(async () => rows.size),
      // Prisma trả object mới mỗi lần đọc
      findUnique: vi.fn(async ({ where }) => (rows.has(where.id) ? { ...rows.get(where.id) } : null)),
      create: vi.fn(async ({ data }) => {
        if ([...rows.values()].some((r: any) => r.code === data.code)) throw Object.assign(new Error('dup'), { code: 'P2002' });
        const row = { id: `e${rows.size + 1}`, status: 'NEW', holderId: null, deletedAt: null, ...data };
        rows.set(row.id, row);
        return row;
      }),
      update: vi.fn(async ({ where, data }) => Object.assign(rows.get(where.id), data)),
    },
    equipmentHistory: { create: vi.fn(async ({ data }) => { histories.push(data); return data; }) },
  };
  return { service: new EquipmentService(prisma), rows, histories };
}

describe('EquipmentService', () => {
  it('Admin tạo thiết bị: mã TB-xxxx tự tăng, bỏ qua mã trùng, ghi lịch sử CREATE', async () => {
    const { service, histories } = makeService([{ id: 'old', code: 'TB-0002', name: 'cũ' }]);
    const e = await service.create({ name: ' Máy ảnh Sony ', quantity: '2', status: 'GOOD' }, ADMIN);
    expect(e).toMatchObject({ code: 'TB-0003', name: 'Máy ảnh Sony', quantity: 2 });
    expect(histories[0]).toMatchObject({ action: 'CREATE', actorName: 'Admin' });
  });

  it('phân quyền: nhân viên không thêm/bàn giao; Quản lý bàn giao được nhưng không xóa', async () => {
    const { service } = makeService([{ id: 'e1', code: 'TB-0001', name: 'Mic', status: 'GOOD' }]);
    await expect(service.create({ name: 'x' }, STAFF)).rejects.toThrow(ForbiddenException);
    await expect(service.handover('e1', { toUserId: 'u1' }, STAFF)).rejects.toThrow(ForbiddenException);
    await expect(service.remove('e1', MANAGER)).rejects.toThrow(ForbiddenException);
    await expect(service.handover('e1', { toUserId: 'u1' }, MANAGER)).resolves.toMatchObject({ holderId: 'u1' });
    // Thủ kho toàn quyền như Admin
    await expect(service.create({ name: 'Loa' }, THU_KHO)).resolves.toMatchObject({ name: 'Loa' });
    await expect(service.remove('e1', THU_KHO)).resolves.toEqual({ ok: true });
  });

  it('bàn giao → thu hồi: đổi người giữ, hạn trả, tình trạng; lịch sử ghi từ/đến', async () => {
    const { service, rows, histories } = makeService([{ id: 'e1', code: 'TB-0001', name: 'Mic', status: 'GOOD', holderId: 'u1' }]);
    await service.handover('e1', { toUserId: 'u2', dueDate: '2026-12-01', note: 'đi sự kiện' }, ADMIN);
    expect(rows.get('e1')).toMatchObject({ holderId: 'u2', status: 'IN_USE' });
    expect(rows.get('e1')!.dueDate).toBeInstanceOf(Date);
    expect(histories[0]).toMatchObject({ action: 'HANDOVER', fromUserId: 'u1', toUserId: 'u2', note: 'đi sự kiện' });

    await service.returnBack('e1', { status: 'DAMAGED', note: 'vỡ đầu mic' }, MANAGER);
    expect(rows.get('e1')).toMatchObject({ holderId: null, dueDate: null, status: 'DAMAGED' });
    expect(histories[1]).toMatchObject({ action: 'RETURN', fromUserId: 'u2', toUserId: 'u-mgr', status: 'DAMAGED' });
    await expect(service.returnBack('e1', {}, ADMIN)).rejects.toThrow('không có ai đang giữ');
  });

  it('sửa ghi đúng trường thay đổi; xóa mềm giữ bản ghi + khôi phục', async () => {
    const { service, rows, histories } = makeService([{ id: 'e1', code: 'TB-0001', name: 'Mic', quantity: 1, status: 'GOOD' }]);
    await service.update('e1', { name: 'Mic Shure', quantity: 1 }, ADMIN);
    expect(histories[0]).toMatchObject({ action: 'UPDATE', changes: { name: ['Mic', 'Mic Shure'] } });
    await service.remove('e1', ADMIN);
    expect(rows.get('e1')!.deletedAt).toBeInstanceOf(Date);
    await expect(service.handover('e1', { toUserId: 'u1' }, ADMIN)).rejects.toThrow('Không tìm thấy');
    await service.restore('e1', ADMIN);
    expect(rows.get('e1')!.deletedAt).toBeNull();
    expect(histories.map((h) => h.action)).toEqual(['UPDATE', 'DELETE', 'RESTORE']);
  });

  it('người ngoài (không tài khoản): bàn giao theo tên, chặn trùng, thu hồi ghi tên người trả', async () => {
    const { service, rows, histories } = makeService([{ id: 'e1', code: 'TB-0001', name: 'Mic', status: 'GOOD' }]);
    await service.handover('e1', { toName: ' Chú bảo vệ ' }, ADMIN);
    expect(rows.get('e1')).toMatchObject({ holderId: null, holderName: 'Chú bảo vệ', status: 'IN_USE' });
    await expect(service.handover('e1', { toName: 'chú bảo vệ' }, ADMIN)).rejects.toThrow('đang giữ');
    await service.returnBack('e1', { status: 'GOOD' }, ADMIN);
    expect(rows.get('e1')).toMatchObject({ holderName: null });
    expect(histories[1]).toMatchObject({ action: 'RETURN', fromName: 'Chú bảo vệ' });
    await expect(service.handover('e1', {}, ADMIN)).rejects.toThrow('người nhận');
  });

  it('đồ mượn của phòng: quá hạn trả phòng, trả lại 1 lần', async () => {
    const now = new Date('2026-11-26T12:00:00Z');
    expect(isLenderOverdue({ lenderName: 'Phòng CTSV', lenderDueDate: '2026-11-20' }, now)).toBe(true);
    expect(isLenderOverdue({ lenderName: 'Phòng CTSV', lenderDueDate: '2026-11-20', returnedToLenderAt: '2026-11-21' }, now)).toBe(false);
    const { service, rows, histories } = makeService([{ id: 'e1', code: 'TB-0001', name: 'Loa', status: 'GOOD', lenderName: 'Phòng CTSV', holderName: 'An' }]);
    await service.returnToLender('e1', {}, MANAGER);
    expect(rows.get('e1')!.returnedToLenderAt).toBeInstanceOf(Date);
    expect(rows.get('e1')).toMatchObject({ holderName: null });
    expect(histories[0]).toMatchObject({ action: 'RETURN_LENDER', toName: 'Phòng CTSV', fromName: 'An' });
    await expect(service.returnToLender('e1', {}, MANAGER)).rejects.toThrow('đã trả');
  });

  it('ảnh hóa đơn: chỉ nhận data URL ảnh, chặn ảnh quá lớn; chọn tài khoản thì bỏ tên tự nhập', () => {
    expect(cleanInput({ name: 'x', invoiceImage: 'data:image/jpeg;base64,QUJD' }, false).invoiceImage).toContain('base64');
    expect(() => cleanInput({ name: 'x', invoiceImage: 'javascript:alert(1)' }, false)).toThrow('không hợp lệ');
    expect(() => cleanInput({ name: 'x', invoiceImage: 'data:image/jpeg;base64,' + 'A'.repeat(2_000_001) }, false)).toThrow('quá lớn');
    expect(cleanInput({ name: 'x', holderId: 'u1', holderName: 'Ai đó' }, false)).toMatchObject({ holderId: 'u1', holderName: null });
  });

  it('helpers: quá hạn, mã, kiểm tra dữ liệu', () => {
    const now = new Date('2026-11-26T12:00:00Z');
    expect(isOverdue({ holderId: 'u', dueDate: '2026-11-25' }, now)).toBe(true);
    expect(isOverdue({ holderId: null, dueDate: '2026-11-25' }, now)).toBe(false);
    expect(isOverdue({ holderId: 'u', dueDate: '2026-11-30' }, now)).toBe(false);
    expect(formatCode(7)).toBe('TB-0007');
    expect(() => cleanInput({ name: 'x', status: 'BROKEN' }, false)).toThrow(BadRequestException);
    expect(() => cleanInput({ name: 'x', quantity: -1 }, false)).toThrow(BadRequestException);
    expect(diff({ a: 1, b: 'x' }, { a: 1, b: 'y' })).toEqual({ b: ['x', 'y'] });
  });
});
