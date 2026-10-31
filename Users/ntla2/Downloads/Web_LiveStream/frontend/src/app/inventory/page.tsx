"use client"
import React, { useState, useMemo, useEffect } from 'react';
import {
  Package, Search, Plus, PackageOpen, Gift, History, Truck, ListChecks,
  MapPin, CheckCircle2, X, Edit3, Save, Trash2, ChevronDown, Download,
  Calendar, Copy, ExternalLink, FileText, AlertTriangle, Mail, Link2
} from "lucide-react";
import { api } from '@/lib/api';
import { parseTrackingFile, toCsv, ADMIN_FILE_HEADER, type TrackingRow } from '@/lib/trackingImport';
import { printLabels, esc, trackingLink, LABEL_LAYOUTS, type LabelLayout } from '@/lib/labels';

// ─── Status Config ──────────────────────────────────────────────────────────
const ORDER_STATUSES = [
  { key: 'UNPACKED',    label: 'Chưa đóng gói',                    color: 'bg-slate-50 text-slate-600 border-slate-200',     dot: 'bg-slate-400' },
  { key: 'PACKED',      label: 'Đã đóng gói',                      color: 'bg-orange-50 text-orange-600 border-orange-200',  dot: 'bg-orange-500' },
  { key: 'SENT_TO_ADMIN', label: 'Đã chuyển Hành chính',          color: 'bg-amber-50 text-amber-700 border-amber-200',     dot: 'bg-amber-500' },
  { key: 'HANDED_OVER', label: 'Đã chuyển tới đơn vị vận chuyển', color: 'bg-purple-50 text-purple-600 border-purple-200',  dot: 'bg-purple-500' },
  { key: 'IN_TRANSIT',  label: 'Đơn vị vận chuyển đang xử lý',    color: 'bg-blue-50 text-blue-600 border-blue-200',        dot: 'bg-blue-500' },
  { key: 'COMPLETED',   label: 'Hoàn tất',                          color: 'bg-green-50 text-green-600 border-green-200',     dot: 'bg-green-500' },
  { key: 'RETURNED',    label: 'Hoàn hàng',                         color: 'bg-red-50 text-red-600 border-red-200',           dot: 'bg-red-500' },
] as const;

type StatusKey = 'UNPACKED' | 'PACKED' | 'SENT_TO_ADMIN' | 'HANDED_OVER' | 'IN_TRANSIT' | 'COMPLETED' | 'RETURNED';

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {};
ORDER_STATUSES.forEach(s => { STATUS_MAP[s.key] = s; });

// ─── Word Document Export (Fix Font) ────────────────────────────────────────────
const exportLabelWord = (ordersToExport: any[]) => {
  if (!ordersToExport.length) return;

  let tableRows = '';
  for (let i = 0; i < ordersToExport.length; i += 2) {
    const o1 = ordersToExport[i];
    const o2 = ordersToExport[i + 1];

    const cellStyle = "width: 50%; border: 1px dashed #999; padding: 20px; vertical-align: top;";
    const nameStyle = "font-size: 16pt; font-weight: bold; color: #1a1a2e; margin-bottom: 5px; font-family: 'Times New Roman', serif;";
    const headStyle = "font-size: 10pt; font-weight: bold; color: #666; margin-bottom: 5px; font-family: 'Times New Roman', serif;";
    const textStyle = "font-size: 12pt; color: #333; margin-bottom: 3px; font-family: 'Times New Roman', serif;";
    const divStyle = "border-bottom: 1px dashed #ccc; margin: 15px 0;";

    const buildCell = (o: any) => {
      if (!o) return `<td style="${cellStyle} border: none;"></td>`;
      return `
        <td style="${cellStyle}">
          <div style="${headStyle}">NGƯỜI GỬI / FROM</div>
          <div style="${nameStyle}">${o.senderName || 'Uống Gì Chưa'}</div>
          <div style="${textStyle}">${o.senderAddress || 'FPT University HCM, Lô E2a-7, D1, Long Thạnh Mỹ, Q9, TP.HCM'}</div>
          <div style="${divStyle}"></div>
          <div style="${headStyle}">NGƯỜI NHẬN / TO</div>
          <div style="${nameStyle}">${esc(o.recipientName || o.recipient)}</div>
          <div style="${textStyle}">ĐT: ${esc(o.phone)}</div>
          <div style="${textStyle}">Địa chỉ: ${esc(o.address)}</div>
          <div style="${divStyle}"></div>
          <div style="${textStyle} font-weight: bold; color: #005691;">Mã vận đơn: ${esc(o.id)}</div>
          ${o.gift ? `<div style="${textStyle} color: #F58220; font-weight: bold;">Quà: ${esc(o.gift)}</div>` : ''}
          <div style="font-size: 9pt; color: #666; font-family: 'Times New Roman', serif;">Tra cứu: ${esc(trackingLink(window.location.origin, o.id))}</div>
        </td>
      `;
    };

    tableRows += `<tr>${buildCell(o1)}${buildCell(o2)}</tr>`;
  }

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>Tem Giao Hang</title>
      <style>
        body { font-family: 'Times New Roman', serif; }
        table { width: 100%; border-collapse: separate; border-spacing: 15px; }
      </style>
    </head>
    <body>
      <table>
        ${tableRows}
      </table>
    </body>
    </html>
  `;

  // \uFEFF for BOM UTF-8
  const blob = new Blob(['\uFEFF' + html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Tem_Don_${new Date().toLocaleDateString('vi-VN').replace(/\//g,'-')}.doc`;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status, editable }: { status: string; editable?: boolean }) => {
  const cfg = STATUS_MAP[status] ?? { label: status, color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${cfg.color} ${editable ? 'cursor-pointer hover:opacity-80' : ''}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
      {editable && <ChevronDown size={12} className="opacity-50 ml-0.5" />}
    </span>
  );
};

// ─── Gift Stock Badge ─────────────────────────────────────────────────────────
const GiftBadge = ({ status }: { status: string }) => {
  const map: Record<string,string> = {
    'Sẵn sàng': 'bg-green-50 text-green-600 border-green-200',
    'Sắp hết':  'bg-yellow-50 text-yellow-600 border-yellow-200',
    'Hết hàng': 'bg-red-50 text-red-600 border-red-200',
  };
  return <span className={`px-2 py-1 rounded text-xs font-bold border ${map[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>{status}</span>;
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'FULFILLMENT'>('STOCK');
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderFilter, setOrderFilter] = useState<string>('ALL');
  const [sessionFilter, setSessionFilter] = useState<string>('ALL');
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);

  const [gifts, setGifts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedGift, setSelectedGift] = useState<any | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [drawerGiftOpen, setDrawerGiftOpen] = useState(false);
  const [drawerStatusOpen, setDrawerStatusOpen] = useState(false);
  // Quy trình Hành chính: đóng gói xong → chuyển HC (xuất file) → HC gửi lại mã vận đơn → Thủ kho nhập
  const [confirmSendAdmin, setConfirmSendAdmin] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Mail chúc mừng: Thủ kho nhập email (người trúng nhắn qua TikTok) theo TikTok ID
  const [congratsOpen, setCongratsOpen] = useState(false);
  const [congratsSearch, setCongratsSearch] = useState('');
  const [congratsShowSent, setCongratsShowSent] = useState(false);
  const [congratsEmails, setCongratsEmails] = useState<Record<string, string>>({});
  const [congratsStatus, setCongratsStatus] = useState<Record<string, string>>({});
  // In tem: lọc + chọn đơn (mặc định đơn Chưa đóng gói), không in hết mọi lần
  const [printOpen, setPrintOpen] = useState(false);
  const [printStatuses, setPrintStatuses] = useState<string[]>(['UNPACKED']);
  const [printSession, setPrintSession] = useState('ALL');
  const [printSearch, setPrintSearch] = useState('');
  const [printSelected, setPrintSelected] = useState<Set<string>>(new Set());
  const [printLayout, setPrintLayout] = useState<LabelLayout>('A4_6');

  const refreshData = async () => {
    try {
      const [giftsRes, ordersRes, sessionsRes] = await Promise.all([
        api.get('/gift'),
        api.get('/order'),
        api.get('/live-session'),
      ]);
      setGifts(Array.isArray(giftsRes) ? giftsRes : (giftsRes?.data ?? []));
      setOrders(Array.isArray(ordersRes) ? ordersRes : (ordersRes?.data ?? []));
      setSessions(Array.isArray(sessionsRes) ? sessionsRes : (sessionsRes?.data ?? []));
    } catch (err) { console.error('Lỗi tải dữ liệu:', err); }
  };

  useEffect(() => { refreshData(); }, []);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleSaveOrder = async () => {
    if (!selectedOrder || isSubmitting) return;
    if (selectedOrder.status === 'IN_TRANSIT' && !selectedOrder.lastMileCarrier?.trim()) {
      showNotice('Vui lòng nhập tên đơn vị vận chuyển khi chọn trạng thái "Đơn vị vận chuyển đang xử lý"');
      return;
    }
    setIsSubmitting(true);
    try {
      if (selectedOrder.recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selectedOrder.recipientEmail.trim())) {
        showNotice('Email không hợp lệ');
        return;
      }
      if (selectedOrder.id && orders.find(o => o.id === selectedOrder.id)) {
        await api.patch(`/order/${selectedOrder.id}`, {
          status:               selectedOrder.status,
          currentLocation:      selectedOrder.currentLocation,
          lastMileCarrier:      selectedOrder.lastMileCarrier,
          lastMileTrackingCode: selectedOrder.lastMileTrackingCode,
          lastMileTrackingLink: selectedOrder.lastMileTrackingLink,
          note:                 selectedOrder.note,
          recipientName:        selectedOrder.recipientName || selectedOrder.recipient,
          phone:                selectedOrder.phone,
          address:              selectedOrder.address,
          recipientEmail:       selectedOrder.recipientEmail,
          tiktokAccount:        selectedOrder.tiktokAccount ?? undefined,
          gift:                 selectedOrder.gift,
        });
      } else {
        await api.post('/order', {
          id:            selectedOrder.id || `DON-${Date.now().toString().slice(-6)}`,
          recipientName: selectedOrder.recipient || selectedOrder.recipientName || '',
          phone:         selectedOrder.phone || '',
          address:       selectedOrder.address || '',
          recipientEmail:selectedOrder.recipientEmail || null,
          tiktokAccount: selectedOrder.tiktokAccount || null,
          gift:          selectedOrder.gift || '',
          status:        selectedOrder.status || 'UNPACKED',
          liveSessionId: selectedOrder.liveSessionId || null,
          currentLocation: 'Kho Uống Gì Chưa',
        });
      }
      await refreshData();
      setSelectedOrder(null);
    } catch (err: any) {
      console.error(err);
      showNotice(err.message || 'Lỗi khi lưu đơn hàng!');
    } finally { setIsSubmitting(false); }
  };

  const handleQuickStatus = async (orderId: string, newStatus: string) => {
    if (isSubmitting) return;
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, statusLabel: STATUS_MAP[newStatus]?.label ?? newStatus } : o));
    setOpenDropdownId(null);
    setIsSubmitting(true);
    try {
      await api.patch(`/order/${orderId}`, { status: newStatus });
      if (newStatus === 'IN_TRANSIT') {
        const o = orders.find(x => x.id === orderId);
        if (o) setSelectedOrder({ ...o, status: newStatus });
      }
    } catch (e) { console.error('Lỗi cập nhật status:', e); await refreshData(); }
    finally { setIsSubmitting(false); }
  };

  const handleSaveGift = async () => {
    if (!selectedGift || isSubmitting) return;
    if (!selectedGift.name?.trim() || !selectedGift.sku?.trim()) { showNotice('Vui lòng nhập Tên Quà và Mã SKU'); return; }
    setIsSubmitting(true);
    try {
      if (gifts.find(g => g.id === selectedGift.id)) {
        await api.patch(`/gift/${selectedGift.id}`, selectedGift);
      } else { await api.post('/gift', selectedGift); }
      await refreshData(); setSelectedGift(null);
    } catch (err: any) {
      console.error(err); showNotice(err.message || 'Lỗi lưu quà tặng! Có thể SKU đã tồn tại.');
      await refreshData();
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteGift = async () => {
    if (!selectedGift || !confirm('Xóa quà tặng này khỏi kho?')) return;
    setIsSubmitting(true);
    try {
      if (selectedGift.id) await api.delete(`/gift/${selectedGift.id}`);
      await refreshData(); setSelectedGift(null);
    } catch (err) { console.error(err); showNotice('Lỗi khi xóa quà tặng'); }
    finally { setIsSubmitting(false); }
  };

  // ─── Filtered Orders ────────────────────────────────────────────────────────
  const filteredOrders = useMemo(() =>
    orders
      .filter(o => orderFilter === 'ALL' || o.status === orderFilter)
      .filter(o => sessionFilter === 'ALL' || o.liveSessionId === sessionFilter)
      .filter(o => {
        const q = search.toLowerCase();
        return !q || (o.recipient || o.recipientName || '').toLowerCase().includes(q)
          || (o.id || '').toLowerCase().includes(q)
          || (o.phone || '').includes(q);
      }),
  [orders, orderFilter, sessionFilter, search]);

  // ─── Quy trình Hành chính ───────────────────────────────────────────────────
  const showNotice = (msg: string) => { setNotice(msg); setTimeout(() => setNotice(null), 5000); };
  const packedOrders = useMemo(() => filteredOrders.filter(o => o.status === 'PACKED'), [filteredOrders]);

  const downloadCsv = (rows: unknown[][], filename: string) => {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };

  // Xuất file gửi Hành chính (cột ĐVVC/mã vận đơn để trống cho HC điền) + chuyển trạng thái
  const handleSendToAdmin = async () => {
    if (!packedOrders.length || isSubmitting) return;
    if (!confirmSendAdmin) {
      setConfirmSendAdmin(true);
      setTimeout(() => setConfirmSendAdmin(false), 4000);
      return;
    }
    setConfirmSendAdmin(false);
    setIsSubmitting(true);
    try {
      downloadCsv(
        [ADMIN_FILE_HEADER, ...packedOrders.map(o => [o.id, o.recipient || o.recipientName, o.phone, o.address, o.gift, '', '', ''])],
        `GuiHanhChinh_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`,
      );
      const res = await api.post('/order/bulk-status', { ids: packedOrders.map(o => o.id), status: 'SENT_TO_ADMIN', note: 'Thủ kho chuyển Hành chính gửi vận chuyển' });
      showNotice(`Đã chuyển ${res.data.updated} đơn sang Hành chính. Gửi file vừa tải cho Hành chính điền đơn vị vận chuyển + mã vận đơn.`);
      await refreshData();
    } catch (err: any) {
      showNotice(`Lỗi chuyển Hành chính: ${err.message}`);
    } finally { setIsSubmitting(false); }
  };

  const importParsed = useMemo(() => importText.trim() ? parseTrackingFile(importText) : { rows: [] as TrackingRow[] }, [importText]);
  const orderIds = useMemo(() => new Set(orders.map(o => o.id)), [orders]);

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    setImportResult(null);
    setImportText(await file.text());
  };

  const handleApplyTracking = async () => {
    const rows = importParsed.rows.filter(r => r.id && r.trackingCode);
    if (!rows.length || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await api.post('/order/bulk-tracking', { rows });
      const { updated, notFound, invalid } = res.data;
      setImportResult(`Đã cập nhật ${updated} đơn.` + (notFound.length ? ` Không tìm thấy: ${notFound.join(', ')}.` : '') + (invalid.length ? ` Thiếu mã vận đơn: ${invalid.join(', ')}.` : ''));
      await refreshData();
    } catch (err: any) {
      setImportResult(`Lỗi: ${err.message}`);
    } finally { setIsSubmitting(false); }
  };

  // ─── Mail chúc mừng trúng quà ───────────────────────────────────────────────
  const congratsOrders = useMemo(() => {
    const q = congratsSearch.trim().replace(/^@/, '').toLowerCase();
    return orders
      .filter(o => congratsShowSent || !o.congratsSentAt)
      .filter(o => !q || (o.tiktokAccount || '').includes(q) || (o.recipient || o.recipientName || '').toLowerCase().includes(q) || (o.id || '').toLowerCase().includes(q));
  }, [orders, congratsSearch, congratsShowSent]);
  const congratsEmailOf = (o: any) => congratsEmails[o.id] ?? o.recipientEmail ?? '';

  const handleSendCongrats = async (targets: any[]) => {
    const items = targets.filter(o => congratsEmailOf(o).trim()).map(o => ({ id: o.id, email: congratsEmailOf(o).trim() }));
    if (!items.length || isSubmitting) return;
    setIsSubmitting(true);
    setCongratsStatus(prev => ({ ...prev, ...Object.fromEntries(items.map(i => [i.id, 'Đang gửi...'])) }));
    try {
      const res = await api.post('/order/congrats', { items, resend: congratsShowSent });
      setCongratsStatus(prev => ({ ...prev, ...Object.fromEntries(res.data.results.map((r: any) => [r.id, r.ok ? '✅ Đã gửi' : `❌ ${r.error}`])) }));
      showNotice(`Đã gửi ${res.data.sent}/${items.length} mail chúc mừng`);
      await refreshData();
    } catch (err: any) {
      setCongratsStatus(prev => ({ ...prev, ...Object.fromEntries(items.map(i => [i.id, `❌ ${err.message}`])) }));
    } finally { setIsSubmitting(false); }
  };

  const printCandidates = useMemo(() => {
    const q = printSearch.trim().replace(/^@/, '').toLowerCase();
    return orders
      .filter(o => printStatuses.length === 0 || printStatuses.includes(o.status))
      .filter(o => printSession === 'ALL' || o.liveSessionId === printSession)
      .filter(o => !q || (o.id || '').toLowerCase().includes(q) || (o.recipient || o.recipientName || '').toLowerCase().includes(q)
        || (o.phone || '').includes(q) || (o.tiktokAccount || '').includes(q));
  }, [orders, printStatuses, printSession, printSearch]);
  const printChosen = useMemo(() => printCandidates.filter(o => printSelected.has(o.id)), [printCandidates, printSelected]);

  // Đổi bộ lọc → chọn sẵn toàn bộ đơn khớp lọc (bỏ tích từng đơn nếu không muốn in)
  useEffect(() => {
    if (printOpen) setPrintSelected(new Set(printCandidates.map(o => o.id)));
  }, [printOpen, printStatuses, printSession, printSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const openPrint = (status?: string) => {
    setPrintStatuses(status ? [status] : ['UNPACKED']);
    setPrintSession(sessionFilter);
    setPrintSearch('');
    setPrintOpen(true);
  };
  const togglePrintStatus = (key: string) =>
    setPrintStatuses(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  const togglePrintOrder = (id: string) =>
    setPrintSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const handlePrintLabels = () => {
    const error = printLabels(printChosen, printLayout);
    if (error) showNotice(error);
  };

  // ─── Export Excel CSV ───────────────────────────────────────────────────────
  const handleExportExcel = () => {
    const rows = [
      ['Mã Đơn','Ngày','Người nhận','SĐT','Địa chỉ','Email','Quà tặng','Trạng thái','ĐVVC NCC','Mã VĐ NCC'],
      ...filteredOrders.map(o => [
        o.id, o.date, o.recipient||o.recipientName, o.phone, o.address, o.recipientEmail||'',
        o.gift, o.statusLabel||o.status, o.lastMileCarrier||'', o.lastMileTrackingCode||''
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `DonHang_${new Date().toLocaleDateString('vi-VN').replace(/\//g,'-')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col bg-slate-50 font-sans relative overflow-hidden">

      {/* HEADER */}
      <div className="h-auto py-4 px-4 md:h-[88px] md:py-0 md:px-8 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between shrink-0 shadow-sm z-10 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="text-[#005691]" /> Quản trị Kho & Giao vận
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Tồn kho · Giao hàng · Xuất tem</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={activeTab === 'STOCK' ? 'Tìm quà, SKU...' : 'Tìm mã đơn, SĐT...'}
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 md:py-2.5 text-xs md:text-sm bg-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none w-full md:w-56 focus:ring-2 focus:ring-[#005691]/20 transition-all"
            />
          </div>
          {activeTab === 'STOCK' && (
            <button onClick={() => setSelectedGift({ name: '', sku: '', stock: 0, price: '', status: 'Sẵn sàng' })}
              className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm bg-[#F58220] hover:bg-[#e07010] rounded-xl text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5">
              <Plus size={15} /> Nhập kho quà mới
            </button>
          )}
          {activeTab === 'FULFILLMENT' && (
            <>
              <button onClick={() => setSelectedOrder({ id: '', recipient: '', phone: '', address: '', recipientEmail: '', gift: gifts[0]?.name || '', status: 'UNPACKED', liveSessionId: '' })}
                className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm bg-[#00A859] hover:bg-[#008f4c] rounded-xl text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5">
                <Plus size={15} /> Tạo đơn hàng
              </button>
              <button onClick={() => { setCongratsOpen(true); setCongratsStatus({}); }}
                className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm bg-[#F58220] hover:bg-[#e07010] rounded-xl text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5">
                <Mail size={15} /> Gửi mail chúc mừng
              </button>
              <button onClick={() => openPrint()}
                className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm bg-[#005691] hover:bg-[#004270] rounded-xl text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5">
                <FileText size={15} /> In tem giao hàng
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TABS */}
        <div className="px-4 md:px-8 pt-5 pb-2 shrink-0">
          <div className="flex bg-white border border-slate-200 p-1 rounded-xl w-fit shadow-sm">
            {[
              { key: 'STOCK', label: 'Kho Tồn & Lịch sử', icon: PackageOpen, active: 'bg-[#005691]' },
              { key: 'FULFILLMENT', label: 'Tiến độ Giao quà', icon: Truck, active: 'bg-[#00A859]' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab.key ? tab.active + ' text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                <tab.icon size={15} /><span className="hidden md:inline">{tab.label}</span><span className="md:hidden">{tab.key === 'STOCK' ? 'Kho' : 'Giao'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-auto px-4 md:px-8 pb-8 flex flex-col gap-5">

          {activeTab === 'STOCK' ? (
            /* ═══ STOCK TAB ═══ */
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 shrink-0">
                {[
                  { label: 'Tổng Tồn Kho', val: gifts.reduce((s, g) => s + (g.stock||0), 0), color: 'blue', icon: PackageOpen },
                  { label: 'Đã Gửi', val: gifts.reduce((s, g) => s + (g.sent||0), 0), color: 'green', icon: Gift },
                  { label: 'Cảnh báo', val: gifts.filter(g => g.status === 'Sắp hết' || g.status === 'Hết hàng').length, color: 'red', icon: AlertTriangle },
                ].map(k => (
                  <div key={k.label} className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{k.label}</p>
                      <h3 className={`text-2xl md:text-3xl font-black ${k.color === 'red' ? 'text-red-500' : k.color === 'green' ? 'text-green-600' : 'text-slate-900'}`}>{k.val}</h3>
                    </div>
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center bg-${k.color}-50 text-${k.color}-500`}><k.icon size={22} /></div>
                  </div>
                ))}
              </div>

              {/* Gift Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="grid min-w-[900px] grid-cols-12 gap-4 p-4 border-b border-slate-100 bg-slate-50/80 text-xs font-black text-slate-500 uppercase tracking-wider">
                  <div className="col-span-1 text-center">SKU</div>
                  <div className="col-span-4">Tên Quà Tặng</div>
                  <div className="col-span-2 text-center">Tồn Kho</div>
                  <div className="col-span-2 text-center">Đã Gửi</div>
                  <div className="col-span-2">Đơn Giá</div>
                  <div className="col-span-1 text-center">Sửa</div>
                </div>
                <div className="flex-1 overflow-auto">
                  {gifts.filter(g => (g.name||'').toLowerCase().includes(search.toLowerCase()) || (g.sku||'').toLowerCase().includes(search.toLowerCase())).map(gift => (
                    <div key={gift.id} className="grid min-w-[900px] grid-cols-12 gap-4 p-4 border-b border-slate-100 hover:bg-slate-50 items-center transition-colors">
                      <div className="col-span-1 text-center font-bold text-slate-400 text-xs">{gift.sku}</div>
                      <div className="col-span-4 flex flex-col gap-1">
                        <span className="font-bold text-sm text-slate-900 truncate">{gift.name}</span>
                        <GiftBadge status={gift.status} />
                      </div>
                      <div className="col-span-2 text-center"><span className={`text-lg font-black ${gift.stock === 0 ? 'text-red-500' : 'text-[#005691]'}`}>{gift.stock}</span></div>
                      <div className="col-span-2 text-center"><span className="text-lg font-black text-[#00A859]">{gift.sent}</span></div>
                      <div className="col-span-2 font-bold text-slate-600 text-sm">{gift.price}</div>
                      <div className="col-span-1 flex justify-center">
                        <button onClick={() => setSelectedGift(gift)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-[#F58220] hover:text-white flex items-center justify-center transition-colors">
                          <Edit3 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* ═══ FULFILLMENT TAB ═══ */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
              {/* Filters bar */}
              <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
                {/* Status filters */}
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setOrderFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${orderFilter === 'ALL' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                    Tất cả ({orders.length})
                  </button>
                  {ORDER_STATUSES.map(s => {
                    const cnt = orders.filter(o => o.status === s.key).length;
                    return (
                      <button key={s.key} onClick={() => setOrderFilter(s.key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${orderFilter === s.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                        {s.label} {cnt > 0 && <span className="ml-1 opacity-70">({cnt})</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Session filter + actions */}
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    {/* Session filter */}
                    <div className="relative">
                      <button onClick={() => setShowSessionDropdown(!showSessionDropdown)}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                        <Calendar size={13} className="text-[#005691]" />
                        {sessionFilter === 'ALL' ? 'Tất cả phiên' : (sessions.find(s => s.id === sessionFilter)?.title || sessionFilter)}
                        <ChevronDown size={13} className="text-slate-400" />
                      </button>
                      {showSessionDropdown && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowSessionDropdown(false)} />
                          <div className="absolute left-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden py-1">
                            {[{ id: 'ALL', title: 'Tất cả phiên' }, ...sessions].map(s => (
                              <div key={s.id} onClick={() => { setSessionFilter(s.id); setShowSessionDropdown(false); }}
                                className={`px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm text-sm cursor-pointer transition-colors ${sessionFilter === s.id ? 'bg-[#005691] text-white font-bold' : 'text-slate-700 hover:bg-slate-50'}`}>
                                {s.title}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{filteredOrders.length} đơn</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSendToAdmin} disabled={!packedOrders.length || isSubmitting} title="Xuất file các đơn Đã đóng gói gửi Hành chính và chuyển trạng thái"
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-40 ${confirmSendAdmin ? 'bg-red-600 text-white' : 'bg-amber-500 text-white hover:bg-amber-600'}`}>
                      <Truck size={13} /> {confirmSendAdmin ? `Bấm lần nữa: chuyển ${packedOrders.length} đơn` : `Chuyển Hành chính (${packedOrders.length})`}
                    </button>
                    <button onClick={() => { setImportOpen(true); setImportResult(null); }} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:border-[#005691] hover:text-[#005691] transition-colors">
                      <ListChecks size={13} /> Nhập mã vận đơn
                    </button>
                    <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-colors">
                      <Download size={13} /> Excel
                    </button>
                    <button onClick={() => openPrint(orderFilter !== 'ALL' ? orderFilter : undefined)} className="flex items-center gap-1.5 px-3 py-2 bg-[#005691] text-white rounded-xl text-xs font-bold hover:bg-[#004270] transition-colors">
                      <FileText size={13} /> In tem
                    </button>
                  </div>
                </div>
              </div>

              {/* Table header */}
              <div className="grid min-w-[900px] grid-cols-12 gap-3 p-4 border-b border-slate-100 bg-slate-50/80 text-xs font-black text-slate-500 uppercase tracking-wider">
                <div className="col-span-2">Mã Đơn / Ngày</div>
                <div className="col-span-3">Người nhận</div>
                <div className="col-span-3">Địa chỉ giao</div>
                <div className="col-span-2">Quà tặng</div>
                <div className="col-span-2">Tiến độ</div>
              </div>

              {/* Table rows */}
              <div className="flex-1 overflow-auto">
                {filteredOrders.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Package size={40} className="mb-3 opacity-30" />
                    <p className="font-bold">Không có đơn hàng nào</p>
                  </div>
                )}
                {filteredOrders.map(order => (
                  <div key={order.id} className="grid min-w-[900px] grid-cols-12 gap-3 p-4 border-b border-slate-100 hover:bg-slate-50 items-start transition-colors group">
                    <div className="col-span-2">
                      <span className="font-black text-sm text-[#005691] block">{order.id}</span>
                      <span className="text-xs font-medium text-slate-400">{order.date}</span>
                      {order.liveSessionId && <span className="text-[10px] text-purple-500 font-bold block mt-0.5">📺 {sessions.find(s => s.id === order.liveSessionId)?.title || order.liveSessionId}</span>}
                    </div>
                    <div className="col-span-3">
                      <span className="font-bold text-sm text-slate-900 block">{order.recipient || order.recipientName}</span>
                      <span className="text-xs font-bold text-[#F58220]">{order.phone}</span>
                      {order.tiktokAccount && <span className="block text-[11px] font-semibold text-slate-500">@{order.tiktokAccount}</span>}
                      {order.congratsSentAt && <span className="inline-block mt-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">✉️ Đã gửi mail chúc mừng</span>}
                      {order.recipientEmail && <span className="text-[10px] text-slate-400 block truncate">{order.recipientEmail}</span>}
                    </div>
                    <div className="col-span-3">
                      <span className="text-sm text-slate-600 line-clamp-2">{order.address}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-bold text-sm text-slate-800 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 block w-fit">{order.gift}</span>
                    </div>
                    <div className="col-span-2 flex items-start gap-2">
                      <div className="flex-1">
                        {/* Quick status dropdown */}
                        <div className="relative">
                          <div onClick={() => setOpenDropdownId(openDropdownId === order.id ? null : order.id)}>
                            <StatusBadge status={order.status} editable />
                          </div>
                          {openDropdownId === order.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />
                              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                                {ORDER_STATUSES.map(s => (
                                  <div key={s.key} onClick={() => handleQuickStatus(order.id, s.key)}
                                    className={`px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm text-xs font-bold hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors ${order.status === s.key ? 'text-[#005691] bg-blue-50/50' : 'text-slate-700'}`}>
                                    <span><span className={`inline-block w-2 h-2 rounded-full mr-2 ${s.dot}`} />{s.label}</span>
                                    {order.status === s.key && <CheckCircle2 size={13} className="text-[#005691]" />}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        {/* NCC info when IN_TRANSIT */}
                        {['HANDED_OVER', 'IN_TRANSIT'].includes(order.status) && (order.lastMileCarrier || order.lastMileTrackingCode) && (
                          <div className="mt-2 space-y-1 text-[10px]">
                            {order.lastMileCarrier && <div className="font-bold text-slate-600">🚚 {order.lastMileCarrier}</div>}
                            {order.lastMileTrackingCode && (
                              <div className="flex items-center gap-1">
                                <code className="text-[#F58220] font-mono font-bold">{order.lastMileTrackingCode}</code>
                                <button onClick={() => navigator.clipboard.writeText(order.lastMileTrackingCode)} className="text-slate-400 hover:text-[#005691]"><Copy size={10} /></button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Copy tracking link */}
                        {(order.trackingCode || order.id) && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/tracking?code=${order.trackingCode || order.id}`)}
                              className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold hover:bg-[#005691] hover:text-white transition-colors" title="Copy link tracking">
                              <Copy size={9} /> Link
                            </button>
                            <a href={`/tracking?code=${order.trackingCode || order.id}`} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold hover:bg-[#F58220] hover:text-white transition-colors">
                              <ExternalLink size={9} /> Mở
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Edit button */}
                      <button onClick={() => setSelectedOrder({ ...order, recipientName: order.recipient || order.recipientName })}
                        className="w-7 h-7 rounded-lg bg-slate-100 text-slate-400 hover:bg-[#005691] hover:text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                        <Edit3 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          GIFT DRAWER
      ══════════════════════════════════════════════════════ */}
      <div className={`absolute top-0 right-0 w-full md:w-[420px] h-full bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.1)] border-l border-slate-200 transition-transform duration-400 z-50 flex flex-col ${selectedGift ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedGift && (
          <>
            <div className="h-[72px] flex items-center justify-between px-5 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#005691] to-[#F58220] flex items-center justify-center text-white"><PackageOpen size={18} /></div>
                <div><h3 className="font-black text-base text-slate-900">Hồ sơ Quà tặng</h3><p className="text-xs text-slate-400">Cập nhật thông tin & số lượng</p></div>
              </div>
              <button onClick={() => setSelectedGift(null)} className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors"><X size={15} /></button>
            </div>
            <div className="flex-1 overflow-auto p-5 space-y-4">
              {[
                { label: 'Tên Quà Tặng', key: 'name', type: 'text', placeholder: 'VD: Áo Thun...' },
                { label: 'Mã SKU', key: 'sku', type: 'text', placeholder: 'VD: Q-AO-01' },
                { label: 'Đơn Giá', key: 'price', type: 'text', placeholder: 'VD: 150,000đ' },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{f.label}</label>
                  <input type={f.type} value={selectedGift[f.key] || ''} placeholder={f.placeholder}
                    onChange={e => setSelectedGift({...selectedGift, [f.key]: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm outline-none focus:border-[#F58220] transition-all" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Tồn kho</label>
                  <input type="number" value={selectedGift.stock || 0}
                    onChange={e => setSelectedGift({...selectedGift, stock: parseInt(e.target.value)||0})}
                    className="w-full bg-blue-50 border border-blue-200 text-[#005691] text-lg font-black rounded-xl px-4 py-2 outline-none text-center" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Trạng thái kho</label>
                  <select value={selectedGift.status || 'Sẵn sàng'} onChange={e => setSelectedGift({...selectedGift, status: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-3 py-2.5 outline-none">
                    <option>Sẵn sàng</option><option>Sắp hết</option><option>Hết hàng</option>
                  </select>
                </div>
              </div>
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-3">
                <History className="text-[#F58220] mt-0.5 shrink-0" size={16} />
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Đã có <b className="text-[#00A859]">{selectedGift.sent || 0} lượt</b> quà tặng này được giao trong tháng.
                </p>
              </div>
            </div>
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
              <button onClick={handleDeleteGift} disabled={isSubmitting}
                className="px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center disabled:opacity-50"><Trash2 size={16} /></button>
              <button onClick={handleSaveGift} disabled={isSubmitting}
                className="flex-1 py-2.5 bg-[#F58220] text-white font-black rounded-xl hover:bg-[#e07010] shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                <Save size={16} /> {isSubmitting ? 'Đang lưu...' : 'Lưu Quà tặng'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          ORDER DRAWER — Full detail edit
      ══════════════════════════════════════════════════════ */}
      <div className={`absolute top-0 right-0 w-full md:w-[460px] h-full bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.1)] border-l border-slate-200 transition-transform duration-400 z-50 flex flex-col ${selectedOrder ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedOrder && (
          <>
            <div className="h-[72px] flex items-center justify-between px-5 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white"><Truck size={18} /></div>
                <div><h3 className="font-black text-base text-slate-900">{selectedOrder.id ? `Đơn ${selectedOrder.id}` : 'Tạo đơn mới'}</h3><p className="text-xs text-slate-400">Thông tin giao hàng & trạng thái</p></div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors"><X size={15} /></button>
            </div>

            <div className="flex-1 overflow-auto p-5 space-y-5">
              {/* Recipient Info */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">👤 Người nhận</h4>
                {[
                  { label: 'Họ tên', key: 'recipientName', placeholder: 'Nguyễn Văn A', type: 'text' },
                  { label: 'Số điện thoại', key: 'phone', placeholder: '0901234567', type: 'tel' },
                  { label: 'TikTok ID người trúng', key: 'tiktokAccount', placeholder: '@ten.tiktok', type: 'text' },
                  { label: 'Email (nhận thông báo)', key: 'recipientEmail', placeholder: 'email@example.com', type: 'email' },
                ].map(f => (
                  <div key={f.key} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">{f.label}</label>
                    <input type={f.type} value={selectedOrder[f.key] || ''} placeholder={f.placeholder}
                      onChange={e => setSelectedOrder({...selectedOrder, [f.key]: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:border-[#005691] transition-all" />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><MapPin size={10} /> Địa chỉ giao</label>
                  <textarea value={selectedOrder.address || ''} onChange={e => setSelectedOrder({...selectedOrder, address: e.target.value})}
                    rows={2} placeholder="Số nhà, đường, phường, quận, TP..."
                    className="w-full bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg px-3 py-2 outline-none focus:border-[#005691] resize-none transition-all" />
                </div>
              </div>

              {/* Gift selection */}
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase">🎁 Quà tặng</label>
                <div onClick={() => setDrawerGiftOpen(!drawerGiftOpen)}
                  className="w-full bg-blue-50 border border-blue-200 text-[#005691] text-sm font-bold rounded-xl px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm cursor-pointer flex justify-between items-center">
                  {selectedOrder.gift || 'Chọn quà tặng...'}<ChevronDown size={14} className="opacity-50" />
                </div>
                {drawerGiftOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDrawerGiftOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                      {gifts.map(g => (
                        <div key={g.id} onClick={() => { setSelectedOrder({...selectedOrder, gift: g.name}); setDrawerGiftOpen(false); }}
                          className={`px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm text-sm font-bold cursor-pointer hover:bg-slate-50 flex justify-between ${selectedOrder.gift === g.name ? 'text-[#005691] bg-blue-50/50' : 'text-slate-700'}`}>
                          {g.name}{selectedOrder.gift === g.name && <CheckCircle2 size={14} className="text-[#005691]" />}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Status selection */}
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase">📦 Trạng thái giao hàng</label>
                <div onClick={() => setDrawerStatusOpen(!drawerStatusOpen)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm cursor-pointer flex justify-between items-center">
                  <StatusBadge status={selectedOrder.status} />
                  <ChevronDown size={14} className="opacity-50 ml-2" />
                </div>
                {drawerStatusOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDrawerStatusOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                      {ORDER_STATUSES.map(s => (
                        <div key={s.key} onClick={() => { setSelectedOrder({...selectedOrder, status: s.key}); setDrawerStatusOpen(false); }}
                          className={`px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm text-xs font-bold cursor-pointer hover:bg-slate-50 flex justify-between transition-colors ${selectedOrder.status === s.key ? 'text-[#005691] bg-blue-50/50' : 'text-slate-700'}`}>
                          <span><span className={`inline-block w-2 h-2 rounded-full mr-2 ${s.dot}`} />{s.label}</span>
                          {selectedOrder.status === s.key && <CheckCircle2 size={13} className="text-[#005691]" />}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Location + Note */}
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">📍 Vị trí hiện tại</label>
                  <input type="text" value={selectedOrder.currentLocation || ''} placeholder="VD: Trung tâm phân loại Bình Dương"
                    onChange={e => setSelectedOrder({...selectedOrder, currentLocation: e.target.value})}
                    className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-lg px-3 py-2 outline-none focus:border-[#005691]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">📝 Ghi chú (hiển thị trong timeline)</label>
                  <input type="text" value={selectedOrder.note || ''} placeholder="VD: Shipper đã liên hệ..."
                    onChange={e => setSelectedOrder({...selectedOrder, note: e.target.value})}
                    className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-lg px-3 py-2 outline-none focus:border-[#005691]" />
                </div>
              </div>

              {/* IN_TRANSIT: NCC fields */}
              {['HANDED_OVER', 'IN_TRANSIT'].includes(selectedOrder.status) && (
                <div className="space-y-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                  <h4 className="text-xs font-black text-orange-700 uppercase tracking-wider flex items-center gap-1.5"><Truck size={13} /> Đơn vị vận chuyển chặng cuối (NCC)</h4>
                  {[
                    { label: 'Tên đơn vị vận chuyển', key: 'lastMileCarrier', placeholder: 'VD: Viettel Post, GHTK...' },
                    { label: 'Mã vận đơn NCC', key: 'lastMileTrackingCode', placeholder: 'VD: VTP1234567890' },
                    { label: 'Link tra cứu NCC', key: 'lastMileTrackingLink', placeholder: 'https://viettelpost.com.vn/tra-cuu...' },
                  ].map(f => (
                    <div key={f.key} className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{f.label}</label>
                      <input type="text" value={selectedOrder[f.key] || ''} placeholder={f.placeholder}
                        onChange={e => setSelectedOrder({...selectedOrder, [f.key]: e.target.value})}
                        className="w-full bg-white border border-orange-200 text-slate-900 text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:border-orange-400 transition-all" />
                    </div>
                  ))}
                </div>
              )}

              {/* Session link */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">📺 Liên kết phiên Livestream</label>
                <select value={selectedOrder.liveSessionId || ''} onChange={e => setSelectedOrder({...selectedOrder, liveSessionId: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-lg px-3 py-2.5 outline-none">
                  <option value="">-- Không gán phiên --</option>
                  {sessions.map(s => <option key={s.id} value={s.id}>{s.title || s.id}</option>)}
                </select>
              </div>

              {/* Email notice */}
              {selectedOrder.recipientEmail && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 font-medium">
                  <Mail size={13} /> Email thông báo sẽ được gửi đến <b>{selectedOrder.recipientEmail}</b> khi lưu thay đổi trạng thái.
                </div>
              )}
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 shrink-0">
              <button onClick={handleSaveOrder} disabled={isSubmitting}
                className="w-full py-3 bg-[#F58220] text-white font-black rounded-xl hover:bg-[#e07010] shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                <Save size={17} /> {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </>
        )}
      </div>

      {notice && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-32px)] max-w-lg bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl">{notice}</div>
      )}

      {/* In tem giao hàng: lọc + chọn đơn */}
      {printOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4" onClick={() => setPrintOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90dvh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-slate-900 flex items-center gap-2"><FileText size={18} className="text-[#005691]" /> In tem giao hàng</h3>
                <p className="text-xs text-slate-500 mt-1">Lọc rồi tích chọn đơn cần in. Mặc định: đơn <b>Chưa đóng gói</b>.</p>
              </div>
              <button onClick={() => setPrintOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>
            <div className="px-5 pt-4 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {ORDER_STATUSES.map(st => {
                  const on = printStatuses.includes(st.key);
                  const cnt = orders.filter(o => o.status === st.key).length;
                  return (
                    <button key={st.key} onClick={() => togglePrintStatus(st.key)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-colors ${on ? 'bg-[#005691] text-white border-[#005691]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#005691]'}`}>
                      {st.label} <span className={on ? 'text-white/80' : 'text-slate-400'}>({cnt})</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input value={printSearch} onChange={e => setPrintSearch(e.target.value)} placeholder="Tìm mã đơn, tên, SĐT, TikTok..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#005691]" />
                </div>
                <select value={printSession} onChange={e => setPrintSession(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white max-w-[240px]">
                  <option value="ALL">Tất cả phiên live</option>
                  {sessions.map(se => <option key={se.id} value={se.id}>{se.title || se.id}</option>)}
                </select>
              </div>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {printCandidates.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Không có đơn nào khớp bộ lọc.</p>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <label className="flex items-center gap-3 px-3 py-2 bg-slate-50 text-[11px] font-black text-slate-500 uppercase cursor-pointer">
                    <input type="checkbox" checked={printChosen.length === printCandidates.length}
                      onChange={e => setPrintSelected(new Set(e.target.checked ? printCandidates.map(o => o.id) : []))} />
                    Chọn tất cả ({printChosen.length}/{printCandidates.length})
                  </label>
                  <div className="divide-y divide-slate-100 max-h-[40dvh] overflow-y-auto">
                    {printCandidates.map(o => (
                      <label key={o.id} className={`grid grid-cols-12 gap-2 px-3 py-2 items-center text-xs cursor-pointer ${printSelected.has(o.id) ? 'bg-blue-50/40' : ''}`}>
                        <div className="col-span-1"><input type="checkbox" checked={printSelected.has(o.id)} onChange={() => togglePrintOrder(o.id)} /></div>
                        <div className="col-span-2 font-mono font-bold text-[#005691]">{o.id}</div>
                        <div className="col-span-3"><div className="font-bold truncate">{o.recipient || o.recipientName}</div><div className="text-slate-500">{o.phone}</div></div>
                        <div className="col-span-4 text-slate-600 line-clamp-2">{o.address || <span className="text-red-500 font-bold">Thiếu địa chỉ</span>}</div>
                        <div className="col-span-2"><StatusBadge status={o.status} /></div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(LABEL_LAYOUTS) as LabelLayout[]).map(k => (
                  <label key={k} title={LABEL_LAYOUTS[k].hint}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer ${printLayout === k ? 'border-[#005691] bg-blue-50 text-[#005691]' : 'border-slate-200 text-slate-600'}`}>
                    <input type="radio" name="printLayout" checked={printLayout === k} onChange={() => setPrintLayout(k)} /> {LABEL_LAYOUTS[k].name}
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => exportLabelWord(printChosen)} disabled={!printChosen.length}
                  className="px-3 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl disabled:opacity-40">Tải file Word</button>
                <button onClick={handlePrintLabels} disabled={!printChosen.length}
                  className="px-4 py-2 bg-[#005691] text-white text-sm font-black rounded-xl disabled:opacity-40">In {printChosen.length} tem</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gửi mail chúc mừng trúng quà */}
      {congratsOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4" onClick={() => setCongratsOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90dvh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-slate-900 flex items-center gap-2"><Mail size={18} className="text-[#F58220]" /> Gửi mail chúc mừng trúng quà</h3>
                <p className="text-xs text-slate-500 mt-1">Người trúng nhắn email qua TikTok → tìm theo TikTok ID, nhập email, bấm Gửi. Mail gồm tên quà, <b>mã vận đơn của dự án</b> và link tracking.</p>
              </div>
              <button onClick={() => setCongratsOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>
            <div className="px-5 pt-4 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input value={congratsSearch} onChange={e => setCongratsSearch(e.target.value)} placeholder="Tìm TikTok ID, tên, mã đơn..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#005691]" />
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <input type="checkbox" checked={congratsShowSent} onChange={e => setCongratsShowSent(e.target.checked)} /> Hiện cả đơn đã gửi (gửi lại)
              </label>
            </div>
            <div className="p-5 overflow-y-auto">
              {congratsOrders.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Không có đơn nào cần gửi mail.</p>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden min-w-[720px]">
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-50 text-[10px] font-black text-slate-500 uppercase">
                    <div className="col-span-2">TikTok ID</div><div className="col-span-2">Người nhận</div><div className="col-span-2">Quà / Mã đơn</div><div className="col-span-3">Email</div><div className="col-span-3">Gửi</div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {congratsOrders.map(o => (
                      <div key={o.id} className="grid grid-cols-12 gap-2 px-3 py-2 items-center text-xs">
                        <div className="col-span-2 font-bold text-slate-700 truncate">{o.tiktokAccount ? `@${o.tiktokAccount}` : <span className="text-slate-400 font-normal">(chưa có)</span>}</div>
                        <div className="col-span-2 truncate">{o.recipient || o.recipientName}</div>
                        <div className="col-span-2"><div className="truncate text-[#F58220] font-bold">{o.gift}</div><code className="text-[10px] text-slate-500">{o.id}</code></div>
                        <div className="col-span-3">
                          <input type="email" value={congratsEmailOf(o)} onChange={e => setCongratsEmails(prev => ({ ...prev, [o.id]: e.target.value }))} placeholder="email@gmail.com"
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-[#005691]" />
                        </div>
                        <div className="col-span-3 flex items-center gap-2">
                          <button onClick={() => handleSendCongrats([o])} disabled={isSubmitting || !congratsEmailOf(o).trim()}
                            className="px-3 py-1.5 bg-[#F58220] text-white font-bold rounded-lg disabled:opacity-40">Gửi</button>
                          <span className="text-[11px] font-semibold text-slate-600 truncate" title={congratsStatus[o.id]}>{congratsStatus[o.id] || (o.congratsSentAt ? '✉️ Đã gửi trước đó' : '')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setCongratsOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl">Đóng</button>
              <button onClick={() => handleSendCongrats(congratsOrders)} disabled={isSubmitting || !congratsOrders.some(o => congratsEmailOf(o).trim())}
                className="px-4 py-2 bg-[#F58220] text-white text-sm font-black rounded-xl disabled:opacity-40">
                {isSubmitting ? 'Đang gửi...' : `Gửi tất cả (${congratsOrders.filter(o => congratsEmailOf(o).trim()).length} có email)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nhập mã vận đơn Hành chính gửi lại */}
      {importOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4" onClick={() => setImportOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90dvh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 flex items-center gap-2"><ListChecks size={18} className="text-[#005691]" /> Nhập mã vận đơn từ Hành chính</h3>
                <p className="text-xs text-slate-500 mt-1">Cần cột <b>Mã Đơn</b> và <b>Mã vận đơn</b> (thêm <b>Đơn vị vận chuyển</b>, <b>Link tra cứu</b> nếu có). Đơn chưa giao sẽ chuyển sang &quot;Đơn vị vận chuyển đang xử lý&quot; (khách thấy mã của đơn vị vận chuyển từ bước này) và gửi email cho khách.</p>
              </div>
              <button onClick={() => setImportOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto">
              <div className="flex flex-wrap items-center gap-3">
                <label className="px-3 py-2 bg-[#005691] text-white rounded-xl text-xs font-bold cursor-pointer">
                  Chọn file CSV
                  <input type="file" accept=".csv,.txt,text/csv" className="hidden" onChange={e => handleImportFile(e.target.files?.[0])} />
                </label>
                <span className="text-xs text-slate-500">hoặc mở file Excel → chọn cả bảng (Ctrl+A) → Copy → dán vào ô dưới</span>
              </div>
              <textarea value={importText} onChange={e => { setImportText(e.target.value); setImportResult(null); }} rows={5}
                placeholder={ADMIN_FILE_HEADER.join('\t')}
                className="w-full text-xs font-mono border border-slate-200 rounded-xl p-3 outline-none focus:border-[#005691]" />
              {importParsed.error && <p className="text-xs font-bold text-red-600">{importParsed.error}</p>}
              {importParsed.rows.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-50 text-[10px] font-black text-slate-500 uppercase">
                    <div className="col-span-3">Mã đơn</div><div className="col-span-3">Đơn vị vận chuyển</div><div className="col-span-3">Mã vận đơn</div><div className="col-span-3">Kiểm tra</div>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {importParsed.rows.map((r, i) => {
                      const problem = !r.id ? 'Thiếu mã đơn' : !orderIds.has(r.id) ? 'Không có đơn này' : !r.trackingCode ? 'Thiếu mã vận đơn' : null;
                      return (
                        <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2 text-xs">
                          <div className="col-span-3 font-mono font-bold">{r.id}</div>
                          <div className="col-span-3">{r.carrier}</div>
                          <div className="col-span-3 font-mono">{r.trackingCode}</div>
                          <div className={`col-span-3 font-bold ${problem ? 'text-red-600' : 'text-green-600'}`}>{problem || 'OK'}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {importResult && <p className="text-sm font-bold text-[#005691]">{importResult}</p>}
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setImportOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl">Đóng</button>
              <button onClick={handleApplyTracking} disabled={isSubmitting || !importParsed.rows.some(r => r.id && r.trackingCode && orderIds.has(r.id))}
                className="px-4 py-2 bg-[#F58220] text-white text-sm font-black rounded-xl disabled:opacity-40">
                {isSubmitting ? 'Đang cập nhật...' : `Cập nhật ${importParsed.rows.filter(r => r.id && r.trackingCode && orderIds.has(r.id)).length} đơn`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
