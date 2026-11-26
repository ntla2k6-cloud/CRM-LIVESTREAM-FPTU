// Kho thiết bị: nhãn, lọc và xuất file dùng chung cho trang /equipment (hàm thuần).
import { toCsv } from '@/lib/trackingImport';

export const EQUIPMENT_STATUSES: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Mới', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  GOOD: { label: 'Tốt', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  IN_USE: { label: 'Đang sử dụng', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  DAMAGED: { label: 'Hư hỏng', color: 'bg-red-50 text-red-700 border-red-200' },
  REPAIRING: { label: 'Đang sửa chữa', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  LIQUIDATED: { label: 'Thanh lý', color: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export const HISTORY_LABELS: Record<string, string> = {
  CREATE: 'Tạo thiết bị', UPDATE: 'Chỉnh sửa', HANDOVER: 'Bàn giao', RETURN: 'Thu hồi',
  STATUS: 'Đổi tình trạng', DELETE: 'Xóa', RESTORE: 'Khôi phục', RETURN_LENDER: 'Trả đồ mượn',
};

export const FIELD_LABELS: Record<string, string> = {
  name: 'Tên', brand: 'Thương hiệu', model: 'Model', serialNumber: 'Serial', quantity: 'Số lượng',
  categoryId: 'Loại', status: 'Tình trạng', managerId: 'Người quản lý', holderId: 'Người giữ', dueDate: 'Hạn trả', note: 'Ghi chú',
  managerName: 'Người quản lý (ngoài)', holderName: 'Người giữ (ngoài)', lenderName: 'Mượn của', lenderContact: 'Liên hệ người cho mượn',
  lenderDueDate: 'Hạn trả phòng', invoiceImage: 'Ảnh hóa đơn',
};

export type Person = { id: string; name?: string | null; email?: string | null; username?: string | null; role?: string };
export const personName = (p?: Person | null) => p?.name || p?.username || p?.email || '—';

/** Tên hiển thị người quản lý / người giữ: tài khoản CRM hoặc tên người ngoài tự nhập */
export const managerLabel = (e: any, people: Map<string, Person>) =>
  e.managerId ? personName(people.get(e.managerId)) : e.managerName || '';
export const holderLabel = (e: any, people: Map<string, Person>) =>
  e.holderId ? personName(people.get(e.holderId)) : e.holderName || '';
export const isHeld = (e: any) => !!(e.holderId || e.holderName);
/** Danh mục đồ mượn (tên có chữ "mượn") → hiện ô mượn của ai / hạn trả */
export const isBorrowCategory = (name?: string | null) => /mượn|muon/i.test(name || '');
export const OTHER = '__OTHER__';

export type EquipmentFilter = {
  q: string; categoryId: string; status: string; managerId: string; holderId: string;
  from: string; to: string; overdueOnly: boolean; unassignedOnly: boolean; borrowedOnly: boolean;
};
export const EMPTY_FILTER: EquipmentFilter = { q: '', categoryId: '', status: '', managerId: '', holderId: '', from: '', to: '', overdueOnly: false, unassignedOnly: false, borrowedOnly: false };

export function filterEquipment(list: any[], f: EquipmentFilter) {
  const q = f.q.trim().toLowerCase();
  const from = f.from ? new Date(f.from + 'T00:00:00').getTime() : null;
  const to = f.to ? new Date(f.to + 'T23:59:59').getTime() : null;
  return list.filter((e) => {
    if (q && ![e.code, e.name, e.brand, e.model, e.serialNumber, e.holderName, e.managerName, e.lenderName].some((v) => String(v ?? '').toLowerCase().includes(q))) return false;
    if (f.categoryId && (f.categoryId === 'NONE' ? e.categoryId : e.categoryId !== f.categoryId)) return false;
    if (f.status && e.status !== f.status) return false;
    // Giá trị lọc người: id tài khoản, 'name:<tên người ngoài>', hoặc 'NONE' (chưa ai giữ)
    const matchPerson = (v: string, id?: string | null, name?: string | null) =>
      v.startsWith('name:') ? (name || '') === v.slice(5) : id === v;
    if (f.managerId && !matchPerson(f.managerId, e.managerId, e.managerName)) return false;
    if (f.holderId && (f.holderId === 'NONE' ? isHeld(e) : !matchPerson(f.holderId, e.holderId, e.holderName))) return false;
    const created = new Date(e.createdAt).getTime();
    if (from !== null && created < from) return false;
    if (to !== null && created > to) return false;
    if (f.overdueOnly && !e.overdue && !e.lenderOverdue) return false;
    if (f.unassignedOnly && isHeld(e)) return false;
    if (f.borrowedOnly && !e.borrowed) return false;
    return true;
  });
}

export function equipmentStats(list: any[]) {
  return {
    total: list.length,
    quantity: list.reduce((s, e) => s + (e.quantity || 0), 0),
    inUse: list.filter((e) => e.status === 'IN_USE').length,
    held: list.filter(isHeld).length,
    damaged: list.filter((e) => e.status === 'DAMAGED').length,
    repairing: list.filter((e) => e.status === 'REPAIRING').length,
    unassigned: list.filter((e) => !isHeld(e) && e.status !== 'LIQUIDATED').length,
    overdue: list.filter((e) => e.overdue || e.lenderOverdue).length,
    borrowed: list.filter((e) => e.borrowed).length,
  };
}

export type ExportKind = 'list' | 'inventory' | 'byHolder' | 'byCategory' | 'damaged' | 'borrowed';
export const EXPORT_KINDS: Record<ExportKind, string> = {
  list: 'Danh sách đang lọc',
  inventory: 'Báo cáo kiểm kê',
  byHolder: 'Theo người đang giữ',
  byCategory: 'Theo loại thiết bị',
  damaged: 'Hư hỏng / cần sửa chữa',
  borrowed: 'Đồ mượn chưa trả',
};

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : '');

/** CSV có BOM (Excel mở đúng tiếng Việt) */
export function buildEquipmentCsv(kind: ExportKind, list: any[], people: Map<string, Person>, cats: Map<string, string>) {
  const mgr = (e: any) => managerLabel(e, people);
  const holder = (e: any) => holderLabel(e, people);
  const cat = (e: any) => (e.categoryId ? cats.get(e.categoryId) || '' : 'Chưa phân loại');
  let rows = [...list];
  if (kind === 'byHolder') rows.sort((a, b) => holder(a).localeCompare(holder(b), 'vi') || a.code.localeCompare(b.code));
  if (kind === 'byCategory') rows.sort((a, b) => cat(a).localeCompare(cat(b), 'vi') || a.code.localeCompare(b.code));
  if (kind === 'damaged') rows = rows.filter((e) => e.status === 'DAMAGED' || e.status === 'REPAIRING');
  if (kind === 'borrowed') rows = rows.filter((e) => e.borrowed);
  if (kind === 'byHolder') rows = rows.filter(isHeld);

  const base = (e: any, i: number) => [
    i + 1, e.code, e.name, [e.brand, e.model].filter(Boolean).join(' '), e.serialNumber || '', cat(e), e.quantity,
    mgr(e), holder(e), EQUIPMENT_STATUSES[e.status]?.label || e.status, fmtDate(e.dueDate),
    [e.overdue && 'QUÁ HẠN TRẢ', e.lenderOverdue && 'QUÁ HẠN TRẢ PHÒNG'].filter(Boolean).join(', '), fmtDate(e.updatedAt), e.note || '',
    e.lenderName || '', e.lenderContact || '', fmtDate(e.lenderDueDate), e.lenderName ? (e.returnedToLenderAt ? `Đã trả ${fmtDate(e.returnedToLenderAt)}` : 'Chưa trả') : '',
    e.hasInvoice ? 'Có' : '',
  ];
  const header = ['STT', 'Mã thiết bị', 'Tên thiết bị', 'Thương hiệu/Model', 'Serial', 'Loại', 'Số lượng', 'Người quản lý', 'Người đang giữ', 'Tình trạng', 'Hạn trả', 'Cảnh báo', 'Ngày cập nhật', 'Ghi chú', 'Mượn của', 'Liên hệ người cho mượn', 'Hạn trả phòng', 'Trả phòng', 'Hóa đơn'];
  const ordered = kind === 'byHolder' ? [header[8], ...header.filter((h) => h !== 'Người đang giữ')] : header;
  const body = rows.map((e, i) => {
    const r = base(e, i);
    return kind === 'byHolder' ? [r[8], ...r.filter((_, j) => j !== 8)] : r;
  });
  if (kind === 'inventory') {
    return toCsv([
      [...ordered, 'Số lượng thực tế', 'Chênh lệch', 'Tình trạng thực tế', 'Ghi chú kiểm kê'],
      ...body.map((r) => [...r, '', '', '', '']),
    ]);
  }
  return toCsv([ordered, ...body]);
}
