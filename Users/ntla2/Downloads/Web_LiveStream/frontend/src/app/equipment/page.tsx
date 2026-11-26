'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Wrench, Plus, Search, Download, Tags, Eye, Pencil, Trash2, ArrowRightLeft, Undo2, Activity,
  Loader2, X, AlertTriangle, Boxes, Package, UserCheck, UserX, Hammer, CircleAlert, Clock, RotateCcw, Receipt, Handshake,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import {
  EQUIPMENT_STATUSES, HISTORY_LABELS, FIELD_LABELS, EMPTY_FILTER, EXPORT_KINDS,
  filterEquipment, equipmentStats, buildEquipmentCsv, personName, managerLabel, holderLabel, isHeld, isBorrowCategory, OTHER,
  type EquipmentFilter, type ExportKind, type Person,
} from '@/lib/equipment';

type Modal =
  | { kind: 'form'; item?: any }
  | { kind: 'handover'; item: any }
  | { kind: 'return'; item: any }
  | { kind: 'returnLender'; item: any }
  | { kind: 'status'; item: any }
  | { kind: 'detail'; id: string }
  | { kind: 'categories' }
  | { kind: 'confirm'; title: string; message: string; run: () => Promise<void> };

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—');
const fmtDay = (d?: string | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
const toDateInput = (d?: string | null) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#005691] bg-white';

function StatusBadge({ status }: { status: string }) {
  const s = EQUIPMENT_STATUSES[status] || { label: status, color: 'bg-slate-100 text-slate-500 border-slate-200' };
  return <span className={`inline-block px-2 py-0.5 rounded-lg border text-[11px] font-bold whitespace-nowrap ${s.color}`}>{s.label}</span>;
}

function ModalShell({ title, onClose, children, wide }: { title: React.ReactNode; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90dvh] flex flex-col`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <h3 className="font-black text-slate-900 flex items-center gap-2">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Đóng"><X size={20} /></button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-black text-slate-500 uppercase tracking-wide mb-1">{label}</span>
      {children}
    </label>
  );
}

export default function EquipmentPage() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<EquipmentFilter>(EMPTY_FILTER);
  const [modal, setModal] = useState<Modal | null>(null);
  const [notice, setNotice] = useState<{ msg: string; ok: boolean } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  // Admin + Thủ kho toàn quyền kho thiết bị (khớp EQUIPMENT_ADMINS ở backend)
  const isAdmin = role === 'ADMIN' || role === 'THU_KHO';
  const canOperate = isAdmin || role === 'MANAGER';

  const showNotice = (msg: string, ok = true) => { setNotice({ msg, ok }); setTimeout(() => setNotice(null), 4000); };

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [list, cats, ppl] = await Promise.all([fetchApi('/equipment'), fetchApi('/equipment/categories'), fetchApi('/equipment/people')]);
      setItems(list || []);
      setCategories(cats || []);
      setPeople(ppl || []);
    } catch (e: any) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetch('/api/auth/me', { cache: 'no-store' }).then((r) => r.json()).then((d) => setRole(d?.user?.role || '')).catch(() => {});
  }, [load]);

  const peopleMap = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const who = (id?: string | null) => (id ? personName(peopleMap.get(id)) : null);
  const filtered = useMemo(() => filterEquipment(items, filter), [items, filter]);
  // Tên người ngoài (không tài khoản) đã dùng → thêm vào bộ lọc
  const outsiders = useMemo(() => ({
    managers: Array.from(new Set(items.map((e) => e.managerName).filter(Boolean))).sort() as string[],
    holders: Array.from(new Set(items.map((e) => e.holderName).filter(Boolean))).sort() as string[],
  }), [items]);
  const stats = useMemo(() => equipmentStats(items), [items]);
  const setF = (patch: Partial<EquipmentFilter>) => setFilter((f) => ({ ...f, ...patch }));

  // Gọi API thao tác: báo kết quả bằng toast, tải lại danh sách
  const act = async (fn: () => Promise<any>, okMsg: string) => {
    try {
      await fn();
      showNotice(okMsg);
      setModal(null);
      await load();
    } catch (e: any) {
      showNotice(e.message, false);
      throw e;
    }
  };

  const exportCsv = (kind: ExportKind) => {
    setExportOpen(false);
    const source = kind === 'list' ? filtered : items;
    const csv = buildEquipmentCsv(kind, source, peopleMap, catMap);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kho-thiet-bi_${kind}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const STAT_CARDS = [
    { label: 'Tổng thiết bị', value: stats.total, icon: Boxes, color: 'text-[#005691] bg-blue-50', onClick: () => setFilter(EMPTY_FILTER) },
    { label: 'Tổng số lượng', value: stats.quantity, icon: Package, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Đang sử dụng', value: stats.inUse, icon: Activity, color: 'text-blue-600 bg-blue-50', onClick: () => setF({ status: 'IN_USE' }) },
    { label: 'Đang được giữ', value: stats.held, icon: UserCheck, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Hư hỏng', value: stats.damaged, icon: CircleAlert, color: 'text-red-600 bg-red-50', onClick: () => setF({ status: 'DAMAGED' }) },
    { label: 'Đang sửa chữa', value: stats.repairing, icon: Hammer, color: 'text-amber-600 bg-amber-50', onClick: () => setF({ status: 'REPAIRING' }) },
    { label: 'Chưa bàn giao', value: stats.unassigned, icon: UserX, color: 'text-slate-600 bg-slate-100', onClick: () => setF({ unassignedOnly: true, overdueOnly: false }) },
    { label: 'Đồ mượn chưa trả', value: stats.borrowed, icon: Handshake, color: 'text-amber-600 bg-amber-50', onClick: () => setF({ borrowedOnly: true, overdueOnly: false, unassignedOnly: false }) },
    { label: 'Quá hạn trả', value: stats.overdue, icon: Clock, color: stats.overdue ? 'text-white bg-red-500' : 'text-slate-500 bg-slate-100', onClick: () => setF({ overdueOnly: true, unassignedOnly: false }) },
  ];

  const activeFilters = JSON.stringify(filter) !== JSON.stringify(EMPTY_FILTER);

  return (
    <div className="h-full overflow-y-auto bg-slate-50 pb-24 md:pb-8">
      {notice && (
        <div role="status" className={`fixed top-4 left-1/2 -translate-x-1/2 z-[80] px-4 py-2.5 rounded-xl shadow-lg text-sm font-bold ${notice.ok ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'}`}>
          {notice.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2"><Wrench className="text-[#F58220]" size={24} /> Kho Thiết Bị</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Quản lý · Bàn giao · Kiểm kê</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <>
              <button onClick={() => setModal({ kind: 'categories' })} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-[#005691]">
                <Tags size={15} /> Danh mục
              </button>
              <button onClick={() => setModal({ kind: 'form' })} className="flex items-center gap-2 px-3 py-2 bg-[#00A859] hover:bg-[#008f4c] rounded-xl text-sm font-bold text-white shadow-md">
                <Plus size={15} /> Thêm thiết bị
              </button>
            </>
          )}
          <div className="relative">
            <button onClick={() => setExportOpen((o) => !o)} disabled={!items.length} className="flex items-center gap-2 px-3 py-2 bg-[#005691] hover:bg-[#004270] disabled:opacity-40 rounded-xl text-sm font-bold text-white shadow-md">
              <Download size={15} /> Xuất Excel
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1">
                  {(Object.keys(EXPORT_KINDS) as ExportKind[]).map((k) => (
                    <button key={k} onClick={() => exportCsv(k)} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium">
                      {EXPORT_KINDS[k]}{k === 'list' && <span className="text-slate-400"> ({filtered.length})</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-5 space-y-5">
        {/* Thống kê */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
          {STAT_CARDS.map((c) => (
            <button key={c.label} onClick={c.onClick} disabled={!c.onClick}
              className="text-left bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm hover:border-[#005691] disabled:hover:border-slate-200 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${c.color}`}><c.icon size={16} /></div>
              <div className="text-2xl font-black text-slate-900">{loading ? '…' : c.value}</div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{c.label}</div>
            </button>
          ))}
        </div>

        {stats.overdue > 0 && (
          <button onClick={() => setF({ overdueOnly: true, unassignedOnly: false })}
            className="w-full flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-2xl text-left text-sm text-red-700 font-semibold">
            <AlertTriangle size={18} className="shrink-0" />
            Có {stats.overdue} thiết bị đã quá hạn trả (người giữ trả về kho hoặc kho trả đồ mượn cho phòng). Bấm để xem danh sách.
          </button>
        )}

        {/* Bộ lọc */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input value={filter.q} onChange={(e) => setF({ q: e.target.value })} placeholder="Tìm theo tên, mã, serial, model…" className={`${inputCls} pl-9`} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
            <select value={filter.categoryId} onChange={(e) => setF({ categoryId: e.target.value })} className={inputCls} aria-label="Loại thiết bị">
              <option value="">Tất cả loại</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="NONE">Chưa phân loại</option>
            </select>
            <select value={filter.status} onChange={(e) => setF({ status: e.target.value })} className={inputCls} aria-label="Tình trạng">
              <option value="">Mọi tình trạng</option>
              {Object.entries(EQUIPMENT_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={filter.managerId} onChange={(e) => setF({ managerId: e.target.value })} className={inputCls} aria-label="Người quản lý">
              <option value="">Mọi người quản lý</option>
              {people.map((p) => <option key={p.id} value={p.id}>{personName(p)}</option>)}
              {outsiders.managers.map((n) => <option key={n} value={`name:${n}`}>{n} (ngoài)</option>)}
            </select>
            <select value={filter.holderId} onChange={(e) => setF({ holderId: e.target.value, unassignedOnly: false })} className={inputCls} aria-label="Người đang giữ">
              <option value="">Mọi người giữ</option>
              <option value="NONE">Chưa ai giữ</option>
              {people.map((p) => <option key={p.id} value={p.id}>{personName(p)}</option>)}
              {outsiders.holders.map((n) => <option key={n} value={`name:${n}`}>{n} (ngoài)</option>)}
            </select>
            <input type="date" value={filter.from} onChange={(e) => setF({ from: e.target.value })} className={inputCls} aria-label="Nhập kho từ ngày" title="Nhập kho từ ngày" />
            <input type="date" value={filter.to} onChange={(e) => setF({ to: e.target.value })} className={inputCls} aria-label="Nhập kho đến ngày" title="Nhập kho đến ngày" />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-500">{filtered.length} / {items.length} thiết bị</span>
            {filter.overdueOnly && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-lg font-bold">Chỉ quá hạn</span>}
            {filter.unassignedOnly && <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg font-bold">Chưa bàn giao</span>}
            {filter.borrowedOnly && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg font-bold">Đồ mượn chưa trả</span>}
            {activeFilters && <button onClick={() => setFilter(EMPTY_FILTER)} className="font-bold text-[#005691] hover:underline">Xóa bộ lọc</button>}
          </div>
        </div>

        {/* Danh sách */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 flex justify-center text-slate-400"><Loader2 className="animate-spin" /></div>
          ) : loadError ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-red-600">Không tải được kho thiết bị: {loadError}</p>
              <button onClick={() => { setLoading(true); load(); }} className="mt-3 px-4 py-2 bg-[#005691] text-white text-sm font-bold rounded-xl">Thử lại</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-14 text-center text-sm text-slate-400">
              {items.length ? 'Không có thiết bị nào khớp bộ lọc.' : isAdmin ? 'Kho chưa có thiết bị. Bấm "Thêm thiết bị" để bắt đầu.' : 'Kho chưa có thiết bị.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wide">
                  <tr>
                    {['STT', 'Mã', 'Tên thiết bị', 'Loại', 'SL', 'Người quản lý', 'Người đang giữ', 'Tình trạng', 'Cập nhật', 'Thao tác'].map((h) => (
                      <th key={h} className={`px-3 py-3 text-left ${h === 'SL' ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((e, i) => (
                    <tr key={e.id} className={`hover:bg-slate-50/70 ${e.overdue ? 'bg-red-50/40' : ''}`}>
                      <td className="px-3 py-2.5 text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-[#005691] whitespace-nowrap">{e.code}</td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => setModal({ kind: 'detail', id: e.id })} className="font-bold text-slate-800 hover:text-[#005691] text-left">{e.name}</button>
                        {(e.brand || e.model) && <div className="text-xs text-slate-500">{[e.brand, e.model].filter(Boolean).join(' · ')}</div>}
                        {e.lenderName && (
                          <div className={`text-[11px] font-bold ${e.lenderOverdue ? 'text-red-600' : e.borrowed ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {e.borrowed ? `Mượn của ${e.lenderName}${e.lenderDueDate ? ` · hạn ${fmtDay(e.lenderDueDate)}` : ''}${e.lenderOverdue ? ' (quá hạn)' : ''}` : `Đã trả ${e.lenderName}`}
                          </div>
                        )}
                        {e.hasInvoice && <span className="inline-flex items-center gap-1 text-[10px] text-slate-400"><Receipt size={10} /> có hóa đơn</span>}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">{e.category?.name || <span className="text-slate-400">Chưa phân loại</span>}</td>
                      <td className="px-3 py-2.5 text-right font-bold">{e.quantity}</td>
                      <td className="px-3 py-2.5 text-slate-600">{managerLabel(e, peopleMap) || <span className="text-slate-400">—</span>}</td>
                      <td className="px-3 py-2.5">
                        {isHeld(e) ? (
                          <div>
                            <div className="font-semibold text-slate-700">{holderLabel(e, peopleMap)}{!e.holderId && <span className="ml-1 text-[10px] text-slate-400">(ngoài)</span>}</div>
                            {e.dueDate && (
                              <div className={`text-[11px] font-bold ${e.overdue ? 'text-red-600' : 'text-slate-400'}`}>
                                {e.overdue ? '⚠ Quá hạn ' : 'Hạn trả '}{fmtDay(e.dueDate)}
                              </div>
                            )}
                          </div>
                        ) : <span className="text-slate-400">Trong kho</span>}
                      </td>
                      <td className="px-3 py-2.5"><StatusBadge status={e.status} /></td>
                      <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{fmt(e.updatedAt)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          <IconBtn title="Xem chi tiết" onClick={() => setModal({ kind: 'detail', id: e.id })}><Eye size={15} /></IconBtn>
                          {isAdmin && <IconBtn title="Chỉnh sửa" onClick={() => setModal({ kind: 'form', item: e })}><Pencil size={15} /></IconBtn>}
                          {canOperate && <IconBtn title="Bàn giao" onClick={() => setModal({ kind: 'handover', item: e })}><ArrowRightLeft size={15} /></IconBtn>}
                          {canOperate && e.borrowed && <IconBtn title="Trả đồ mượn cho phòng" onClick={() => setModal({ kind: 'returnLender', item: e })}><Handshake size={15} /></IconBtn>}
                          {canOperate && isHeld(e) && <IconBtn title="Thu hồi" onClick={() => setModal({ kind: 'return', item: e })}><Undo2 size={15} /></IconBtn>}
                          {canOperate && <IconBtn title="Cập nhật tình trạng" onClick={() => setModal({ kind: 'status', item: e })}><Activity size={15} /></IconBtn>}
                          {isAdmin && (
                            <IconBtn title="Xóa" danger onClick={() => setModal({
                              kind: 'confirm', title: 'Xóa thiết bị?',
                              message: `Xóa ${e.code} — ${e.name} khỏi kho. Lịch sử vẫn được giữ và có thể khôi phục.`,
                              run: () => act(() => fetchApi(`/equipment/${e.id}`, { method: 'DELETE' }), `Đã xóa ${e.code}`),
                            })}><Trash2 size={15} /></IconBtn>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal?.kind === 'form' && (
        <EquipmentForm item={modal.item} categories={categories} people={people} onClose={() => setModal(null)}
          onSave={(body) => act(
            () => modal.item ? fetchApi(`/equipment/${modal.item.id}`, { method: 'PATCH', body: JSON.stringify(body) }) : fetchApi('/equipment', { method: 'POST', body: JSON.stringify(body) }),
            modal.item ? 'Đã lưu thay đổi' : 'Đã thêm thiết bị',
          )} />
      )}
      {modal?.kind === 'handover' && (
        <HandoverForm item={modal.item} people={people} holderText={(x) => holderLabel(x, peopleMap)} onClose={() => setModal(null)}
          onSave={(body) => act(() => fetchApi(`/equipment/${modal.item.id}/handover`, { method: 'POST', body: JSON.stringify(body) }), `Đã bàn giao ${modal.item.code}`)} />
      )}
      {modal?.kind === 'return' && (
        <ReturnForm item={modal.item} people={people} holderText={(x) => holderLabel(x, peopleMap)} onClose={() => setModal(null)}
          onSave={(body) => act(() => fetchApi(`/equipment/${modal.item.id}/return`, { method: 'POST', body: JSON.stringify(body) }), `Đã thu hồi ${modal.item.code}`)} />
      )}
      {modal?.kind === 'returnLender' && (
        <ReturnLenderForm item={modal.item} onClose={() => setModal(null)}
          onSave={(body) => act(() => fetchApi(`/equipment/${modal.item.id}/return-lender`, { method: 'POST', body: JSON.stringify(body) }), `Đã trả ${modal.item.code} cho ${modal.item.lenderName}`)} />
      )}
      {modal?.kind === 'status' && (
        <StatusForm item={modal.item} onClose={() => setModal(null)}
          onSave={(body) => act(() => fetchApi(`/equipment/${modal.item.id}/status`, { method: 'POST', body: JSON.stringify(body) }), 'Đã cập nhật tình trạng')} />
      )}
      {modal?.kind === 'detail' && (
        <DetailView id={modal.id} who={who} catMap={catMap} isAdmin={isAdmin} onClose={() => setModal(null)}
          onRestore={(id) => act(() => fetchApi(`/equipment/${id}/restore`, { method: 'POST' }), 'Đã khôi phục thiết bị')} />
      )}
      {modal?.kind === 'categories' && (
        <CategoryManager categories={categories} onClose={() => setModal(null)} onChanged={load} notify={showNotice} />
      )}
      {modal?.kind === 'confirm' && <ConfirmDialog {...modal} onClose={() => setModal(null)} />}
    </div>
  );
}

function IconBtn({ title, onClick, children, danger }: { title: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button title={title} aria-label={title} onClick={onClick}
      className={`p-1.5 rounded-lg border border-slate-200 ${danger ? 'text-red-500 hover:bg-red-50 hover:border-red-200' : 'text-slate-500 hover:text-[#005691] hover:border-[#005691]'}`}>
      {children}
    </button>
  );
}

function SubmitRow({ busy, label, onClose, danger }: { busy: boolean; label: string; onClose: () => void; danger?: boolean }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl">Hủy</button>
      <button type="submit" disabled={busy} className={`px-4 py-2 text-sm font-black text-white rounded-xl flex items-center gap-2 disabled:opacity-60 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#005691] hover:bg-[#004270]'}`}>
        {busy && <Loader2 size={14} className="animate-spin" />} {label}
      </button>
    </div>
  );
}

// Chạy onSave, giữ modal mở khi lỗi (toast đã báo)
function useSubmit(onSave: (body: any) => Promise<void>) {
  const [busy, setBusy] = useState(false);
  const submit = async (body: any) => {
    setBusy(true);
    try { await onSave(body); } catch { /* đã báo lỗi */ } finally { setBusy(false); }
  };
  return { busy, submit };
}

// Chọn người: tài khoản CRM, hoặc "Người khác" → tự nhập tên (người không đăng nhập web)
type PersonValue = { id: string; name: string };
function PersonPicker({ value, onChange, people, empty, required, exclude }: {
  value: PersonValue; onChange: (v: PersonValue) => void; people: Person[]; empty: string; required?: boolean; exclude?: string | null;
}) {
  const isOther = value.id === OTHER;
  return (
    <div className="space-y-2">
      <select value={value.id} onChange={(e) => onChange({ id: e.target.value, name: e.target.value === OTHER ? value.name : '' })} className={inputCls} required={required}>
        <option value="">{empty}</option>
        {people.filter((p) => p.id !== exclude).map((p) => <option key={p.id} value={p.id}>{personName(p)}</option>)}
        <option value={OTHER}>Người khác (nhập tên)…</option>
      </select>
      {isOther && (
        <input autoFocus required={required || isOther} value={value.name} onChange={(e) => onChange({ id: OTHER, name: e.target.value })}
          className={inputCls} placeholder="Tên người (không cần tài khoản web)" />
      )}
    </div>
  );
}
const toPersonValue = (id?: string | null, name?: string | null): PersonValue => (id ? { id, name: '' } : name ? { id: OTHER, name } : { id: '', name: '' });
const fromPersonValue = (v: PersonValue) => (v.id === OTHER ? { id: null, name: v.name.trim() || null } : { id: v.id || null, name: null });

function PersonSelect({ value, onChange, people, empty, required }: { value: string; onChange: (v: string) => void; people: Person[]; empty: string; required?: boolean }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} required={required}>
      <option value="">{empty}</option>
      {people.map((p) => <option key={p.id} value={p.id}>{personName(p)}</option>)}
    </select>
  );
}

function StatusSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      {Object.entries(EQUIPMENT_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
    </select>
  );
}

// Nén ảnh hóa đơn trong trình duyệt (cạnh dài ≤ 1600px, JPEG) trước khi gửi để DB không phình
async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Chỉ nhận file ảnh (JPG, PNG…)');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Không đọc được ảnh')); i.src = url; });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const q of [0.8, 0.65, 0.5]) {
      const data = canvas.toDataURL('image/jpeg', q);
      if (data.length < 1_900_000) return data;
    }
    throw new Error('Ảnh quá lớn, hãy chụp lại gần hơn');
  } finally {
    URL.revokeObjectURL(url);
  }
}

function InvoiceInput({ value, hasExisting, onChange }: { value: string | null | undefined; hasExisting: boolean; onChange: (v: string | null | undefined) => void }) {
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-xl text-sm font-bold text-slate-600 cursor-pointer hover:border-[#005691]">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Receipt size={15} />} {value || hasExisting ? 'Đổi ảnh hóa đơn' : 'Tải ảnh hóa đơn'}
          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            setErr(null); setBusy(true);
            try { onChange(await compressImage(file)); } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
          }} />
        </label>
        {(value || (hasExisting && value !== null)) && (
          <button type="button" onClick={() => onChange(null)} className="text-xs font-bold text-red-500 hover:underline">Xóa ảnh</button>
        )}
        {hasExisting && value === undefined && <span className="text-xs text-slate-500">Đang có ảnh hóa đơn</span>}
        {hasExisting && value === null && <span className="text-xs text-red-500">Ảnh sẽ bị xóa khi lưu</span>}
      </div>
      {value && <img src={value} alt="Ảnh hóa đơn" className="max-h-40 rounded-lg border border-slate-200" />}
      {err && <p className="text-xs font-semibold text-red-600">{err}</p>}
    </div>
  );
}

function EquipmentForm({ item, categories, people, onClose, onSave }: { item?: any; categories: any[]; people: Person[]; onClose: () => void; onSave: (b: any) => Promise<void> }) {
  const [f, setF] = useState({
    name: item?.name || '', brand: item?.brand || '', model: item?.model || '', serialNumber: item?.serialNumber || '',
    quantity: String(item?.quantity ?? 1), categoryId: item?.categoryId || categories[0]?.id || '', status: item?.status || 'NEW',
    dueDate: toDateInput(item?.dueDate), note: item?.note || '',
    lenderName: item?.lenderName || '', lenderContact: item?.lenderContact || '', lenderDueDate: toDateInput(item?.lenderDueDate),
  });
  const [manager, setManager] = useState<PersonValue>(toPersonValue(item?.managerId, item?.managerName));
  const [holder, setHolder] = useState<PersonValue>(toPersonValue(item?.holderId, item?.holderName));
  // undefined = giữ nguyên ảnh cũ, null = xóa, chuỗi = ảnh mới
  const [invoice, setInvoice] = useState<string | null | undefined>(undefined);
  const { busy, submit } = useSubmit(onSave);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const borrowCat = isBorrowCategory(categories.find((c) => c.id === f.categoryId)?.name);
  const showLender = borrowCat || !!f.lenderName;
  const holderSet = !!(holder.id && (holder.id !== OTHER || holder.name.trim()));

  return (
    <ModalShell title={item ? <>Sửa thiết bị <span className="font-mono text-[#005691]">{item.code}</span></> : 'Thêm thiết bị'} onClose={onClose}>
      <form onSubmit={(e) => {
        e.preventDefault();
        const m = fromPersonValue(manager);
        const h = fromPersonValue(holder);
        submit({
          ...f, quantity: Number(f.quantity), categoryId: f.categoryId || null,
          managerId: m.id, managerName: m.name, holderId: h.id, holderName: h.name,
          dueDate: holderSet ? f.dueDate || null : null,
          lenderName: showLender ? f.lenderName || null : null, lenderContact: showLender ? f.lenderContact || null : null,
          lenderDueDate: showLender ? f.lenderDueDate || null : null,
          ...(invoice !== undefined ? { invoiceImage: invoice } : {}),
        });
      }} className="space-y-3">
        <Field label="Tên thiết bị *"><input required value={f.name} onChange={set('name')} className={inputCls} placeholder="VD: Máy ảnh Sony A7 IV" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Thương hiệu"><input value={f.brand} onChange={set('brand')} className={inputCls} /></Field>
          <Field label="Model"><input value={f.model} onChange={set('model')} className={inputCls} /></Field>
          <Field label="Serial number"><input value={f.serialNumber} onChange={set('serialNumber')} className={inputCls} /></Field>
          <Field label="Số lượng *"><input required type="number" min={0} step={1} value={f.quantity} onChange={set('quantity')} className={inputCls} /></Field>
          <Field label="Loại thiết bị">
            <select value={f.categoryId} onChange={set('categoryId')} className={inputCls}>
              <option value="">Chưa phân loại</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Tình trạng"><StatusSelect value={f.status} onChange={(v) => setF({ ...f, status: v })} /></Field>
          <Field label="Người quản lý"><PersonPicker value={manager} onChange={setManager} people={people} empty="— Chưa chọn —" /></Field>
          <Field label="Người đang giữ"><PersonPicker value={holder} onChange={setHolder} people={people} empty="Trong kho" /></Field>
        </div>
        {holderSet && <Field label="Ngày dự kiến trả"><input type="date" value={f.dueDate} onChange={set('dueDate')} className={inputCls} /></Field>}

        {showLender && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
            <p className="text-xs font-black text-amber-800 flex items-center gap-1.5"><Handshake size={14} /> Đồ mượn — ghi rõ mượn của ai để sau này trả</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Mượn của (phòng / người) *"><input required={borrowCat} value={f.lenderName} onChange={set('lenderName')} className={inputCls} placeholder="VD: Phòng CTSV – anh Minh" /></Field>
              <Field label="Liên hệ"><input value={f.lenderContact} onChange={set('lenderContact')} className={inputCls} placeholder="SĐT / email" /></Field>
              <Field label="Hạn trả cho phòng"><input type="date" value={f.lenderDueDate} onChange={set('lenderDueDate')} className={inputCls} /></Field>
            </div>
            {item?.returnedToLenderAt && <p className="text-xs text-emerald-700 font-bold">Đã trả lại ngày {fmtDay(item.returnedToLenderAt)}</p>}
          </div>
        )}

        <Field label="Ảnh hóa đơn (không bắt buộc)"><InvoiceInput value={invoice} hasExisting={!!item?.hasInvoice} onChange={setInvoice} /></Field>
        <Field label="Ghi chú"><textarea value={f.note} onChange={set('note')} rows={2} className={inputCls} /></Field>
        <p className="text-[11px] text-slate-400">Người quản lý chịu trách nhiệm thiết bị; người đang giữ là người được bàn giao trực tiếp. Chọn "Người khác" để nhập tên người không có tài khoản web.</p>
        <SubmitRow busy={busy} label={item ? 'Lưu thay đổi' : 'Thêm thiết bị'} onClose={onClose} />
      </form>
    </ModalShell>
  );
}

function HandoverForm({ item, people, holderText, onClose, onSave }: { item: any; people: Person[]; holderText: (e: any) => string; onClose: () => void; onSave: (b: any) => Promise<void> }) {
  const [to, setTo] = useState<PersonValue>({ id: '', name: '' });
  const [f, setF] = useState({ dueDate: '', status: item.status, note: '' });
  const { busy, submit } = useSubmit(onSave);
  return (
    <ModalShell title={<><ArrowRightLeft size={18} className="text-[#005691]" /> Bàn giao {item.code}</>} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); const p = fromPersonValue(to); submit({ ...f, toUserId: p.id, toName: p.name, dueDate: f.dueDate || null }); }} className="space-y-3">
        <div className="p-3 bg-slate-50 rounded-xl text-sm"><b>{item.name}</b> · đang giữ: <b>{holderText(item) || 'Trong kho'}</b></div>
        <Field label="Người nhận *"><PersonPicker required value={to} onChange={setTo} people={people} exclude={item.holderId} empty="— Chọn người nhận —" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ngày dự kiến trả"><input type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} className={inputCls} /></Field>
          <Field label="Tình trạng khi bàn giao"><StatusSelect value={f.status} onChange={(v) => setF({ ...f, status: v })} /></Field>
        </div>
        <Field label="Ghi chú"><textarea value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} rows={2} className={inputCls} placeholder="VD: mượn cho buổi live 30/11" /></Field>
        <p className="text-[11px] text-slate-400">Người bàn giao được ghi là tài khoản bạn đang đăng nhập. Có ngày dự kiến trả thì hệ thống cảnh báo khi quá hạn.</p>
        <SubmitRow busy={busy} label="Bàn giao" onClose={onClose} />
      </form>
    </ModalShell>
  );
}

function ReturnForm({ item, people, holderText, onClose, onSave }: { item: any; people: Person[]; holderText: (e: any) => string; onClose: () => void; onSave: (b: any) => Promise<void> }) {
  const [f, setF] = useState({ status: 'GOOD', receiverId: '', note: '' });
  const { busy, submit } = useSubmit(onSave);
  return (
    <ModalShell title={<><Undo2 size={18} className="text-[#005691]" /> Thu hồi {item.code}</>} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); submit({ ...f, receiverId: f.receiverId || null }); }} className="space-y-3">
        <div className="p-3 bg-slate-50 rounded-xl text-sm"><b>{item.name}</b> · người trả: <b>{holderText(item)}</b>{item.overdue && <span className="ml-2 text-red-600 font-bold">(quá hạn)</span>}</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tình trạng thực tế"><StatusSelect value={f.status} onChange={(v) => setF({ ...f, status: v })} /></Field>
          <Field label="Người tiếp nhận"><PersonSelect value={f.receiverId} onChange={(v) => setF({ ...f, receiverId: v })} people={people} empty="Tôi (người đang thao tác)" /></Field>
        </div>
        <Field label="Ghi chú"><textarea value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} rows={2} className={inputCls} placeholder="VD: trầy vỏ, thiếu dây sạc" /></Field>
        <SubmitRow busy={busy} label="Thu hồi về kho" onClose={onClose} />
      </form>
    </ModalShell>
  );
}

function ReturnLenderForm({ item, onClose, onSave }: { item: any; onClose: () => void; onSave: (b: any) => Promise<void> }) {
  const [note, setNote] = useState('');
  const { busy, submit } = useSubmit(onSave);
  return (
    <ModalShell title={<><Handshake size={18} className="text-amber-600" /> Trả đồ mượn {item.code}</>} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); submit({ note }); }} className="space-y-3">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          Trả <b>{item.name}</b> cho <b>{item.lenderName}</b>{item.lenderContact && <> ({item.lenderContact})</>}
          {item.lenderDueDate && <> · hạn {fmtDay(item.lenderDueDate)}{item.lenderOverdue && <b className="text-red-600"> (quá hạn)</b>}</>}
        </div>
        <Field label="Ghi chú"><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputCls} placeholder="VD: trả đủ, có biên bản" /></Field>
        <p className="text-[11px] text-slate-400">Sau khi trả, thiết bị vẫn còn trong danh sách (để tra lịch sử) với nhãn "Đã trả".</p>
        <SubmitRow busy={busy} label="Xác nhận đã trả" onClose={onClose} />
      </form>
    </ModalShell>
  );
}

function StatusForm({ item, onClose, onSave }: { item: any; onClose: () => void; onSave: (b: any) => Promise<void> }) {
  const [f, setF] = useState({ status: item.status, note: '' });
  const { busy, submit } = useSubmit(onSave);
  return (
    <ModalShell title={<><Activity size={18} className="text-[#005691]" /> Tình trạng {item.code}</>} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); submit(f); }} className="space-y-3">
        <Field label="Tình trạng mới"><StatusSelect value={f.status} onChange={(v) => setF({ ...f, status: v })} /></Field>
        <Field label="Ghi chú"><textarea value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} rows={2} className={inputCls} placeholder="VD: gửi tiệm sửa ngày 26/11" /></Field>
        <SubmitRow busy={busy} label="Cập nhật" onClose={onClose} />
      </form>
    </ModalShell>
  );
}

function DetailView({ id, who, catMap, isAdmin, onClose, onRestore }: { id: string; who: (id?: string | null) => string | null; catMap: Map<string, string>; isAdmin: boolean; onClose: () => void; onRestore: (id: string) => Promise<void> }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  useEffect(() => { fetchApi(`/equipment/${id}`).then(setData).catch((e) => setError(e.message)); }, [id]);

  const show = (field: string, v: any) => {
    if (v === null || v === undefined || v === '') return '∅';
    if (field === 'status') return EQUIPMENT_STATUSES[v]?.label || v;
    if (field === 'managerId' || field === 'holderId') return who(v) || v;
    if (field === 'categoryId') return catMap.get(v) || 'Danh mục đã xóa';
    if (field === 'dueDate' || field === 'lenderDueDate') return fmtDay(v);
    return String(v);
  };
  const person = (uid?: string | null, name?: string | null, fallback = '—') => (uid ? who(uid) : name) || fallback;

  return (
    <ModalShell wide title={data ? <><span className="font-mono text-[#005691]">{data.code}</span> {data.name}</> : 'Chi tiết thiết bị'} onClose={onClose}>
      {error ? <p className="text-sm text-red-600 font-semibold">{error}</p> : !data ? (
        <div className="py-10 flex justify-center text-slate-400"><Loader2 className="animate-spin" /></div>
      ) : (
        <div className="space-y-5">
          {data.deletedAt && (
            <div className="flex items-center justify-between gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <span>Thiết bị đã bị xóa lúc {fmt(data.deletedAt)}.</span>
              {isAdmin && <button onClick={() => onRestore(data.id).catch(() => {})} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-200 rounded-lg font-bold"><RotateCcw size={13} /> Khôi phục</button>}
            </div>
          )}
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {[
              ['Loại', data.category?.name || 'Chưa phân loại'], ['Số lượng', data.quantity], ['Tình trạng', <StatusBadge key="s" status={data.status} />],
              ['Thương hiệu', data.brand || '—'], ['Model', data.model || '—'], ['Serial', data.serialNumber || '—'],
              ['Người quản lý', person(data.managerId, data.managerName)], ['Người đang giữ', person(data.holderId, data.holderName, 'Trong kho')],
              ['Hạn trả', data.dueDate ? <span key="d" className={data.overdue ? 'text-red-600 font-bold' : ''}>{fmtDay(data.dueDate)}{data.overdue ? ' (quá hạn)' : ''}</span> : '—'],
              ['Ngày tạo', fmt(data.createdAt)], ['Cập nhật', fmt(data.updatedAt)], ['Ghi chú', data.note || '—'],
            ].map(([k, v]) => (
              <div key={String(k)} className="bg-slate-50 rounded-xl p-2.5">
                <dt className="text-[10px] font-black text-slate-400 uppercase tracking-wide">{k}</dt>
                <dd className="font-semibold text-slate-800 mt-0.5 break-words">{v}</dd>
              </div>
            ))}
          </dl>

          {data.lenderName && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm space-y-1">
              <p className="font-black text-amber-800 flex items-center gap-1.5"><Handshake size={14} /> Đồ mượn</p>
              <p>Mượn của <b>{data.lenderName}</b>{data.lenderContact && <> · {data.lenderContact}</>}</p>
              <p>
                Hạn trả phòng: <b className={data.lenderOverdue ? 'text-red-600' : ''}>{data.lenderDueDate ? fmtDay(data.lenderDueDate) : '—'}{data.lenderOverdue ? ' (quá hạn)' : ''}</b>
                {' · '}{data.returnedToLenderAt ? <b className="text-emerald-700">Đã trả {fmtDay(data.returnedToLenderAt)}</b> : <b className="text-amber-700">Chưa trả</b>}
              </p>
            </div>
          )}

          {data.hasInvoice && (
            <div>
              <h4 className="font-black text-slate-800 mb-2 text-sm flex items-center gap-1.5"><Receipt size={15} /> Ảnh hóa đơn</h4>
              {invoice ? (
                <a href={invoice} download={`hoa-don-${data.code}.jpg`} title="Bấm để tải ảnh">
                  <img src={invoice} alt={`Hóa đơn ${data.code}`} className="max-h-80 rounded-xl border border-slate-200" />
                </a>
              ) : (
                <button disabled={invoiceLoading} onClick={async () => {
                  setInvoiceLoading(true);
                  try { setInvoice((await fetchApi(`/equipment/${id}/invoice`))?.invoiceImage || null); } catch (e: any) { setError(e.message); } finally { setInvoiceLoading(false); }
                }} className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-[#005691]">
                  {invoiceLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />} Xem ảnh hóa đơn
                </button>
              )}
            </div>
          )}

          <div>
            <h4 className="font-black text-slate-800 mb-3 text-sm">Lịch sử hoạt động ({data.histories.length})</h4>
            <ol className="relative border-l-2 border-slate-100 ml-2 space-y-4">
              {data.histories.map((h: any) => (
                <li key={h.id} className="ml-4">
                  <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-[#005691] border-2 border-white" />
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <b className="text-slate-800">{HISTORY_LABELS[h.action] || h.action}</b>
                    {h.status && <StatusBadge status={h.status} />}
                    <span className="text-xs text-slate-400">{fmt(h.createdAt)} · {h.actorName || 'Hệ thống'}</span>
                  </div>
                  {h.action === 'HANDOVER' && <p className="text-xs text-slate-600 mt-1">Từ <b>{person(h.fromUserId, h.fromName, 'Kho')}</b> → <b>{person(h.toUserId, h.toName)}</b></p>}
                  {h.action === 'RETURN' && <p className="text-xs text-slate-600 mt-1">Người trả <b>{person(h.fromUserId, h.fromName)}</b> → người nhận <b>{person(h.toUserId, h.toName, 'Kho')}</b></p>}
                  {h.action === 'RETURN_LENDER' && <p className="text-xs text-slate-600 mt-1">Trả lại cho <b>{h.toName}</b>{(h.fromUserId || h.fromName) && <> (đang ở chỗ {person(h.fromUserId, h.fromName)})</>}</p>}
                  {h.changes && Object.keys(h.changes).length > 0 && (
                    <ul className="text-xs text-slate-600 mt-1 space-y-0.5">
                      {Object.entries(h.changes as Record<string, [any, any]>).map(([k, [a, b]]) => (
                        <li key={k}>{FIELD_LABELS[k] || k}: <span className="line-through text-slate-400">{show(k, a)}</span> → <b>{show(k, b)}</b></li>
                      ))}
                    </ul>
                  )}
                  {h.note && <p className="text-xs text-slate-500 mt-1 italic">“{h.note}”</p>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function CategoryManager({ categories, onClose, onChanged, notify }: { categories: any[]; onClose: () => void; onChanged: () => Promise<void>; notify: (m: string, ok?: boolean) => void }) {
  const [editing, setEditing] = useState<{ id?: string; name: string; description: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState<any>(null);

  const run = async (fn: () => Promise<any>, msg: string) => {
    setBusy(true);
    try { await fn(); notify(msg); setEditing(null); setConfirmDel(null); await onChanged(); } catch (e: any) { notify(e.message, false); } finally { setBusy(false); }
  };

  return (
    <ModalShell title={<><Tags size={18} className="text-[#005691]" /> Danh mục loại thiết bị</>} onClose={onClose}>
      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl">
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-800">{c.name} <span className="text-xs font-semibold text-slate-400">({c._count?.equipments ?? 0} thiết bị)</span></div>
              {c.description && <div className="text-xs text-slate-500">{c.description}</div>}
            </div>
            <IconBtn title="Sửa" onClick={() => setEditing({ id: c.id, name: c.name, description: c.description || '' })}><Pencil size={14} /></IconBtn>
            <IconBtn title="Xóa" danger onClick={() => setConfirmDel(c)}><Trash2 size={14} /></IconBtn>
          </div>
        ))}
        {!categories.length && <p className="text-sm text-slate-400 text-center py-4">Chưa có danh mục.</p>}
      </div>

      {confirmDel && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm">
          <p className="text-red-700 font-semibold">Xóa danh mục “{confirmDel.name}”? Không xóa được nếu còn thiết bị thuộc danh mục này.</p>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setConfirmDel(null)} className="px-3 py-1.5 text-xs font-bold border border-slate-200 bg-white rounded-lg">Hủy</button>
            <button disabled={busy} onClick={() => run(() => fetchApi(`/equipment/categories/${confirmDel.id}`, { method: 'DELETE' }), 'Đã xóa danh mục')} className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded-lg">Xóa</button>
          </div>
        </div>
      )}

      {editing ? (
        <form onSubmit={(e) => {
          e.preventDefault();
          const body = JSON.stringify({ name: editing.name, description: editing.description });
          run(() => editing.id ? fetchApi(`/equipment/categories/${editing.id}`, { method: 'PATCH', body }) : fetchApi('/equipment/categories', { method: 'POST', body }), editing.id ? 'Đã lưu danh mục' : 'Đã thêm danh mục');
        }} className="mt-4 p-3 bg-slate-50 rounded-xl space-y-2">
          <Field label="Tên danh mục *"><input required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={inputCls} /></Field>
          <Field label="Mô tả"><input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={inputCls} /></Field>
          <SubmitRow busy={busy} label={editing.id ? 'Lưu' : 'Thêm'} onClose={() => setEditing(null)} />
        </form>
      ) : (
        <button onClick={() => setEditing({ name: '', description: '' })} className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:border-[#005691] hover:text-[#005691]">
          <Plus size={15} /> Thêm danh mục
        </button>
      )}
    </ModalShell>
  );
}

function ConfirmDialog({ title, message, run, onClose }: { title: string; message: string; run: () => Promise<void>; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <ModalShell title={<><AlertTriangle size={18} className="text-red-500" /> {title}</>} onClose={onClose}>
      <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); try { await run(); } catch { /* toast đã báo */ } finally { setBusy(false); } }} className="space-y-4">
        <p className="text-sm text-slate-600">{message}</p>
        <SubmitRow busy={busy} label="Xác nhận xóa" onClose={onClose} danger />
      </form>
    </ModalShell>
  );
}
