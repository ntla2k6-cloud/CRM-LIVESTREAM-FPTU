'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollText, Search, Loader2, ShieldAlert, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { describeAudit, ACTION_TYPES } from '@/lib/auditLabels';
import { toCsv } from '@/lib/trackingImport';

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#005691] bg-white';
const TONE: Record<string, string> = {
  login: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  warn: 'bg-amber-50 text-amber-700 border-amber-200',
  muted: 'bg-slate-100 text-slate-500 border-slate-200',
  default: 'bg-blue-50 text-blue-700 border-blue-200',
};
const fmt = (d: string) => new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'medium' });

type Filter = { q: string; userId: string; type: string; from: string; to: string; errors: boolean };
const EMPTY: Filter = { q: '', userId: '', type: '', from: '', to: '', errors: false };

// Nhật ký hệ thống — chỉ ADMIN (API /api/admin/audit cũng chặn ở server)
export default function AuditPage() {
  const [role, setRole] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState<Filter>(EMPTY);
  const [items, setItems] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' }).then((r) => r.json()).then((d) => setRole(d?.user?.role || '')).catch(() => setRole(''));
    fetch('/api/admin/users', { cache: 'no-store' }).then((r) => r.json()).then((d) => Array.isArray(d) && setUsers(d)).catch(() => {});
  }, []);

  const load = useCallback(async (f: Filter, after: string | null) => {
    setLoading(true);
    setError(null);
    const sp = new URLSearchParams();
    if (f.q.trim()) sp.set('q', f.q.trim());
    if (f.userId) sp.set('userId', f.userId);
    if (f.type) sp.set('type', f.type);
    if (f.from) sp.set('from', f.from);
    if (f.to) sp.set('to', f.to);
    if (f.errors) sp.set('errors', '1');
    if (after) sp.set('cursor', after);
    try {
      const res = await fetch(`/api/admin/audit?${sp}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Lỗi ${res.status}`);
      setItems((prev) => (after ? [...prev, ...data.items] : data.items));
      setCursor(data.nextCursor);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Tải lại khi đổi bộ lọc (gõ tìm kiếm chờ 400ms)
  useEffect(() => {
    if (role !== 'ADMIN') return;
    const t = setTimeout(() => load(filter, null), filter.q ? 400 : 0);
    return () => clearTimeout(t);
  }, [filter, role, load]);

  const setF = (p: Partial<Filter>) => setFilter((f) => ({ ...f, ...p }));

  const exportCsv = () => {
    const csv = toCsv([
      ['Thời gian', 'Người thao tác', 'Vai trò', 'Thao tác', 'Đường dẫn', 'Kết quả', 'IP', 'Chi tiết'],
      ...items.map((r) => [fmt(r.createdAt), r.userName || 'Không rõ', r.role || '', describeAudit(r).text, r.path || '', r.status ?? '', r.ip || '', r.detail ? JSON.stringify(r.detail) : '']),
    ]);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `nhat-ky-he-thong_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (role === null) return <div className="h-full flex items-center justify-center text-slate-400"><Loader2 className="animate-spin" /></div>;
  if (role !== 'ADMIN') {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center bg-white p-8 rounded-3xl shadow-xl border border-red-100 max-w-md">
          <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-black text-slate-800">Chỉ quản trị viên</h2>
          <p className="text-slate-500 mt-2 text-sm">Nhật ký hệ thống chỉ tài khoản Admin được xem.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 pb-24 md:pb-8">
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2"><ScrollText className="text-[#005691]" size={24} /> Nhật ký hệ thống</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Đăng nhập · Thao tác · Chỉ Admin xem</p>
        </div>
        <button onClick={exportCsv} disabled={!items.length} className="flex items-center gap-2 px-3 py-2 bg-[#005691] hover:bg-[#004270] disabled:opacity-40 rounded-xl text-sm font-bold text-white">
          <Download size={15} /> Xuất Excel ({items.length})
        </button>
      </div>

      <div className="px-4 md:px-8 py-5 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input value={filter.q} onChange={(e) => setF({ q: e.target.value })} placeholder="Tìm theo tên người, đường dẫn (vd equipment), IP…" className={`${inputCls} pl-9`} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <select value={filter.userId} onChange={(e) => setF({ userId: e.target.value })} className={inputCls} aria-label="Người thao tác">
              <option value="">Mọi người</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name || u.username || u.email}</option>)}
            </select>
            <select value={filter.type} onChange={(e) => setF({ type: e.target.value })} className={inputCls} aria-label="Loại thao tác">
              {Object.entries(ACTION_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input type="date" value={filter.from} onChange={(e) => setF({ from: e.target.value })} className={inputCls} aria-label="Từ ngày" title="Từ ngày" />
            <input type="date" value={filter.to} onChange={(e) => setF({ to: e.target.value })} className={inputCls} aria-label="Đến ngày" title="Đến ngày" />
            <label className="flex items-center gap-2 px-3 text-sm font-semibold text-slate-600">
              <input type="checkbox" checked={filter.errors} onChange={(e) => setF({ errors: e.target.checked })} /> Chỉ thao tác lỗi
            </label>
          </div>
          {JSON.stringify(filter) !== JSON.stringify(EMPTY) && <button onClick={() => setFilter(EMPTY)} className="text-xs font-bold text-[#005691] hover:underline">Xóa bộ lọc</button>}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {error ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-red-600">Không tải được nhật ký: {error}</p>
              <button onClick={() => load(filter, null)} className="mt-3 px-4 py-2 bg-[#005691] text-white text-sm font-bold rounded-xl">Thử lại</button>
            </div>
          ) : !loading && items.length === 0 ? (
            <p className="py-14 text-center text-sm text-slate-400">Chưa có dòng nhật ký nào khớp bộ lọc.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wide">
                  <tr>{['', 'Thời gian', 'Người thao tác', 'Thao tác', 'Kết quả', 'IP / thiết bị'].map((h) => <th key={h} className="px-3 py-3 text-left">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((r) => {
                    const d = describeAudit(r);
                    const failed = (r.status ?? 0) >= 400;
                    const isOpen = open === r.id;
                    return (
                      <React.Fragment key={r.id}>
                        <tr className={`hover:bg-slate-50/70 ${failed ? 'bg-red-50/40' : ''}`}>
                          <td className="pl-3">
                            {(r.detail || r.path) && (
                              <button onClick={() => setOpen(isOpen ? null : r.id)} aria-label="Xem chi tiết" className="text-slate-400 hover:text-[#005691]">
                                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">{fmt(r.createdAt)}</td>
                          <td className="px-3 py-2.5">
                            <div className="font-bold text-slate-800">{r.userName || <span className="text-slate-400">Không rõ</span>}</div>
                            {r.role && <div className="text-[11px] text-slate-400">{r.role}</div>}
                          </td>
                          <td className="px-3 py-2.5"><span className={`inline-block px-2 py-0.5 rounded-lg border text-xs font-bold ${TONE[d.tone]}`}>{d.text}</span></td>
                          <td className={`px-3 py-2.5 text-xs font-bold ${failed ? 'text-red-600' : 'text-emerald-600'}`}>{r.status ? (failed ? `Lỗi ${r.status}` : 'Thành công') : '—'}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-500 max-w-[220px] truncate" title={r.userAgent || ''}>{r.ip || '—'}</td>
                        </tr>
                        {isOpen && (
                          <tr className="bg-slate-50">
                            <td />
                            <td colSpan={5} className="px-3 py-3">
                              <p className="text-xs text-slate-500 mb-1"><b>Đường dẫn:</b> <code>{r.path}</code></p>
                              {r.userAgent && <p className="text-xs text-slate-500 mb-1 break-all"><b>Thiết bị:</b> {r.userAgent}</p>}
                              {r.detail && <pre className="text-xs bg-white border border-slate-200 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap break-all">{JSON.stringify(r.detail, null, 2)}</pre>}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {loading && <div className="py-6 flex justify-center text-slate-400"><Loader2 className="animate-spin" /></div>}
          {!loading && cursor && (
            <button onClick={() => load(filter, cursor)} className="w-full py-3 text-sm font-bold text-[#005691] border-t border-slate-100 hover:bg-slate-50">Tải thêm</button>
          )}
        </div>
      </div>
    </div>
  );
}
