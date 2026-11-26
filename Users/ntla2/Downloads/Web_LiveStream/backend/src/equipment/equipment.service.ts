import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export const EQUIPMENT_STATUSES = ['NEW', 'GOOD', 'IN_USE', 'DAMAGED', 'REPAIRING', 'LIQUIDATED'] as const;
const EDITABLE = ['name', 'brand', 'model', 'serialNumber', 'quantity', 'categoryId', 'status', 'managerId', 'holderId', 'dueDate', 'note'] as const;

export type Actor = { id?: string; name?: string; role: string };

/** Ai làm được gì: ADMIN + Thủ kho toàn quyền; MANAGER cập nhật tình trạng + bàn giao/thu hồi; nhân sự khác chỉ xem. */
export const EQUIPMENT_ADMINS = ['ADMIN', 'THU_KHO'];
export function assertCan(actor: Actor, action: 'manage' | 'operate') {
  if (EQUIPMENT_ADMINS.includes(actor.role)) return;
  if (action === 'operate' && actor.role === 'MANAGER') return;
  throw new ForbiddenException(action === 'manage' ? 'Chỉ Admin/Thủ kho được thêm/sửa/xóa thiết bị và danh mục' : 'Chỉ Admin/Thủ kho/Quản lý được thao tác thiết bị');
}

export const formatCode = (n: number) => `TB-${String(n).padStart(4, '0')}`;

/** Đang được giữ và đã qua ngày dự kiến trả */
export const isOverdue = (e: { holderId?: string | null; dueDate?: Date | string | null }, now = new Date()) =>
  !!e.holderId && !!e.dueDate && new Date(e.dueDate).getTime() < now.getTime();

/** Chuẩn hóa dữ liệu nhập: bỏ trường lạ, kiểm tra tình trạng / số lượng / ngày */
export function cleanInput(body: any, partial: boolean) {
  const data: Record<string, any> = {};
  for (const k of EDITABLE) {
    if (body?.[k] === undefined) continue;
    const v = body[k];
    data[k] = typeof v === 'string' ? v.trim() || null : v;
  }
  if (!partial && !data.name) throw new BadRequestException('Thiếu tên thiết bị');
  if ('name' in data && !data.name) throw new BadRequestException('Tên thiết bị không được trống');
  if ('quantity' in data) {
    const q = Number(data.quantity);
    if (!Number.isInteger(q) || q < 0) throw new BadRequestException('Số lượng phải là số nguyên ≥ 0');
    data.quantity = q;
  }
  if ('status' in data && !EQUIPMENT_STATUSES.includes(data.status)) throw new BadRequestException('Tình trạng không hợp lệ');
  if ('dueDate' in data && data.dueDate) {
    const d = new Date(data.dueDate);
    if (isNaN(d.getTime())) throw new BadRequestException('Ngày dự kiến trả không hợp lệ');
    data.dueDate = d;
  }
  return data;
}

/** {trường: [cũ, mới]} cho lịch sử chỉnh sửa */
export function diff(before: Record<string, any>, after: Record<string, any>) {
  const out: Record<string, [unknown, unknown]> = {};
  for (const k of Object.keys(after)) {
    const a = before[k] instanceof Date ? before[k].toISOString() : before[k] ?? null;
    const b = after[k] instanceof Date ? after[k].toISOString() : after[k] ?? null;
    if (a !== b) out[k] = [a, b];
  }
  return out;
}

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  private log(equipmentId: string, actor: Actor, action: string, extra: Record<string, any> = {}) {
    return this.prisma.equipmentHistory.create({ data: { equipmentId, action, actorId: actor.id, actorName: actor.name, ...extra } });
  }

  private async get(id: string, includeDeleted = false) {
    const e = await this.prisma.equipment.findUnique({ where: { id }, include: { category: true } });
    if (!e || (!includeDeleted && e.deletedAt)) throw new NotFoundException('Không tìm thấy thiết bị');
    return e;
  }

  /** Nhân sự để chọn người quản lý / người giữ (đã được duyệt) */
  people() {
    return this.prisma.user.findMany({
      where: { role: { not: 'GUEST' } },
      select: { id: true, name: true, email: true, username: true, role: true },
      orderBy: { name: 'asc' },
    });
  }

  async findAll(includeDeleted = false) {
    const list = await this.prisma.equipment.findMany({
      where: includeDeleted ? {} : { deletedAt: null },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const now = new Date();
    return list.map((e) => ({ ...e, overdue: isOverdue(e, now) }));
  }

  async findOne(id: string) {
    const e = await this.get(id, true);
    const histories = await this.prisma.equipmentHistory.findMany({ where: { equipmentId: id }, orderBy: { createdAt: 'desc' } });
    return { ...e, overdue: isOverdue(e), histories };
  }

  async create(body: any, actor: Actor) {
    assertCan(actor, 'manage');
    const data = cleanInput(body, false);
    for (let attempt = 0; attempt < 5; attempt++) {
      const n = (await this.prisma.equipment.count()) + 1 + attempt;
      try {
        const created = await this.prisma.equipment.create({ data: { ...(data as any), code: formatCode(n) } });
        await this.log(created.id, actor, 'CREATE', { status: created.status, toUserId: created.holderId, note: created.note });
        return created;
      } catch (e: any) {
        if (e?.code !== 'P2002') throw e; // trùng mã (2 người tạo cùng lúc) → thử số kế tiếp
      }
    }
    throw new BadRequestException('Không tạo được mã thiết bị, thử lại');
  }

  async update(id: string, body: any, actor: Actor) {
    assertCan(actor, 'manage');
    const before = await this.get(id);
    const data = cleanInput(body, true);
    const changes = diff(before, data);
    if (!Object.keys(changes).length) return before;
    const updated = await this.prisma.equipment.update({ where: { id }, data: data as any });
    await this.log(id, actor, 'UPDATE', { changes, status: updated.status, note: body?.historyNote || null });
    return updated;
  }

  async setStatus(id: string, body: any, actor: Actor) {
    assertCan(actor, 'operate');
    const before = await this.get(id);
    const { status } = cleanInput({ status: body?.status }, true);
    if (!status) throw new BadRequestException('Thiếu tình trạng');
    const updated = await this.prisma.equipment.update({ where: { id }, data: { status } });
    await this.log(id, actor, 'STATUS', { status, changes: { status: [before.status, status] }, note: body?.note || null });
    return updated;
  }

  /** Bàn giao cho người nhận (có thể kèm ngày dự kiến trả) */
  async handover(id: string, body: any, actor: Actor) {
    assertCan(actor, 'operate');
    const before = await this.get(id);
    const toUserId = String(body?.toUserId || '').trim();
    if (!toUserId) throw new BadRequestException('Chọn người nhận');
    if (toUserId === before.holderId) throw new BadRequestException('Người này đang giữ thiết bị rồi');
    const extra = cleanInput({ status: body?.status || undefined, dueDate: body?.dueDate || undefined }, true);
    const status = extra.status || (before.status === 'NEW' || before.status === 'GOOD' ? 'IN_USE' : before.status);
    const updated = await this.prisma.equipment.update({
      where: { id },
      data: { holderId: toUserId, status, dueDate: extra.dueDate ?? null },
    });
    await this.log(id, actor, 'HANDOVER', {
      fromUserId: before.holderId, toUserId, status,
      changes: extra.dueDate ? { dueDate: [null, extra.dueDate.toISOString()] } : undefined,
      note: body?.note || null,
    });
    return updated;
  }

  /** Thu hồi: người đang giữ trả lại, ghi tình trạng thực tế */
  async returnBack(id: string, body: any, actor: Actor) {
    assertCan(actor, 'operate');
    const before = await this.get(id);
    if (!before.holderId) throw new BadRequestException('Thiết bị không có ai đang giữ');
    const { status } = cleanInput({ status: body?.status || 'GOOD' }, true);
    const updated = await this.prisma.equipment.update({ where: { id }, data: { holderId: null, dueDate: null, status } });
    await this.log(id, actor, 'RETURN', {
      fromUserId: before.holderId, toUserId: body?.receiverId || actor.id || null, status, note: body?.note || null,
    });
    return updated;
  }

  /** Xóa mềm: ẩn khỏi kho, giữ lịch sử; khôi phục được */
  async remove(id: string, actor: Actor) {
    assertCan(actor, 'manage');
    await this.get(id);
    const updated = await this.prisma.equipment.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.log(id, actor, 'DELETE', { status: updated.status });
    return { ok: true };
  }

  async restore(id: string, actor: Actor) {
    assertCan(actor, 'manage');
    const e = await this.get(id, true);
    if (!e.deletedAt) return e;
    const updated = await this.prisma.equipment.update({ where: { id }, data: { deletedAt: null } });
    await this.log(id, actor, 'RESTORE', { status: updated.status });
    return updated;
  }

  // ─── Danh mục ───────────────────────────────────────────────────────────
  categories() {
    return this.prisma.equipmentCategory.findMany({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { equipments: { where: { deletedAt: null } } } } },
    });
  }

  async saveCategory(id: string | null, body: any, actor: Actor) {
    assertCan(actor, 'manage');
    const name = String(body?.name ?? '').trim();
    if (!name) throw new BadRequestException('Thiếu tên danh mục');
    const data = { name, description: String(body?.description ?? '').trim() || null };
    try {
      return id
        ? await this.prisma.equipmentCategory.update({ where: { id }, data })
        : await this.prisma.equipmentCategory.create({ data });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new BadRequestException('Đã có danh mục cùng tên');
      throw e;
    }
  }

  async removeCategory(id: string, actor: Actor) {
    assertCan(actor, 'manage');
    const used = await this.prisma.equipment.count({ where: { categoryId: id, deletedAt: null } });
    if (used) throw new BadRequestException(`Danh mục đang có ${used} thiết bị — chuyển thiết bị sang danh mục khác trước`);
    await this.prisma.equipmentCategory.delete({ where: { id } });
    return { ok: true };
  }
}
