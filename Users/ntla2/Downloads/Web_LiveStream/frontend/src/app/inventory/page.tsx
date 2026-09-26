"use client"
import React, { useState, useMemo, useEffect } from 'react';
import {
  Package, Search, Plus, PackageOpen, Gift, History, Truck, ListChecks,
  MapPin, CheckCircle2, X, Edit3, Save, Trash2, ChevronDown, Download,
  Calendar, Copy, ExternalLink, FileText, AlertTriangle, Mail, Link2
} from "lucide-react";
import { api } from '@/lib/api';

// ─── Status Config ──────────────────────────────────────────────────────────
const ORDER_STATUSES = [
  { key: 'UNPACKED',    label: 'Chưa đóng gói',                    color: 'bg-slate-50 text-slate-600 border-slate-200',     dot: 'bg-slate-400' },
  { key: 'PACKED',      label: 'Đã đóng gói',                      color: 'bg-orange-50 text-orange-600 border-orange-200',  dot: 'bg-orange-500' },
  { key: 'HANDED_OVER', label: 'Đã chuyển tới đơn vị vận chuyển', color: 'bg-purple-50 text-purple-600 border-purple-200',  dot: 'bg-purple-500' },
  { key: 'IN_TRANSIT',  label: 'Đơn vị vận chuyển đang xử lý',    color: 'bg-blue-50 text-blue-600 border-blue-200',        dot: 'bg-blue-500' },
  { key: 'COMPLETED',   label: 'Hoàn tất',                          color: 'bg-green-50 text-green-600 border-green-200',     dot: 'bg-green-500' },
  { key: 'RETURNED',    label: 'Hoàn hàng',                         color: 'bg-red-50 text-red-600 border-red-200',           dot: 'bg-red-500' },
] as const;

type StatusKey = 'UNPACKED' | 'PACKED' | 'HANDED_OVER' | 'IN_TRANSIT' | 'COMPLETED' | 'RETURNED';

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {};
ORDER_STATUSES.forEach(s => { STATUS_MAP[s.key] = s; });

// ─── Word Document Export (Fix Font) ────────────────────────────────────────────
const exportLabelWord = (ordersToExport: any[]) => {
  if (!ordersToExport.length) { alert('Không có đơn nào để xuất!'); return; }

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
          <div style="${nameStyle}">${o.recipientName || o.recipient}</div>
          <div style="${textStyle}">📞 ${o.phone}</div>
          <div style="${textStyle}">📍 ${o.address}</div>
          <div style="${divStyle}"></div>
          <div style="${textStyle} font-weight: bold; color: #005691;">Mã đơn: ${o.id}</div>
          ${o.gift ? `<div style="${textStyle} color: #F58220; font-weight: bold;">🎁 ${o.gift}</div>` : ''}
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
      alert('Vui lòng nhập Tên đơn vị vận chuyển (NCC) khi chọn trạng thái "Đơn vị vận chuyển"!');
      return;
    }
    setIsSubmitting(true);
    try {
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
          gift:                 selectedOrder.gift,
        });
      } else {
        await api.post('/order', {
          id:            selectedOrder.id || `DON-${Date.now().toString().slice(-6)}`,
          recipientName: selectedOrder.recipient || selectedOrder.recipientName || '',
          phone:         selectedOrder.phone || '',
          address:       selectedOrder.address || '',
          recipientEmail:selectedOrder.recipientEmail || null,
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
      alert(err.response?.data?.message || 'Lỗi khi lưu đơn hàng!');
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
    if (!selectedGift.name?.trim() || !selectedGift.sku?.trim()) { alert('Vui lòng nhập Tên Quà và Mã SKU!'); return; }
    setIsSubmitting(true);
    try {
      if (gifts.find(g => g.id === selectedGift.id)) {
        await api.patch(`/gift/${selectedGift.id}`, selectedGift);
      } else { await api.post('/gift', selectedGift); }
      await refreshData(); setSelectedGift(null);
    } catch (err: any) {
      console.error(err); alert(err.response?.data?.message || 'Lỗi lưu quà tặng! Có thể SKU đã tồn tại.');
      await refreshData();
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteGift = async () => {
    if (!selectedGift || !confirm('Xóa quà tặng này khỏi kho?')) return;
    setIsSubmitting(true);
    try {
      if (selectedGift.id) await api.delete(`/gift/${selectedGift.id}`);
      await refreshData(); setSelectedGift(null);
    } catch (err) { console.error(err); alert('Lỗi khi xóa!'); }
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="text-[#005691]" /> Quản trị Kho & Giao vận
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Tồn kho · Giao hàng · Xuất tem in · Thông báo</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={activeTab === 'STOCK' ? 'Tìm quà, SKU...' : 'Tìm mã đơn, SĐT...'}
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none w-full md:w-56 focus:ring-2 focus:ring-[#005691]/20 transition-all"
            />
          </div>
          {activeTab === 'STOCK' && (
            <button onClick={() => setSelectedGift({ name: '', sku: '', stock: 0, price: '', status: 'Sẵn sàng' })}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#F58220] hover:bg-[#e07010] rounded-xl text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5">
              <Plus size={15} /> Nhập kho quà mới
            </button>
          )}
          {activeTab === 'FULFILLMENT' && (
            <>
              <button onClick={() => setSelectedOrder({ id: '', recipient: '', phone: '', address: '', recipientEmail: '', gift: gifts[0]?.name || '', status: 'UNPACKED', liveSessionId: '' })}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#00A859] hover:bg-[#008f4c] rounded-xl text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5">
                <Plus size={15} /> Tạo đơn hàng
              </button>
              <button onClick={() => exportLabelWord(filteredOrders)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#005691] hover:bg-[#004270] rounded-xl text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5">
                <FileText size={15} /> Xuất Tem Word
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
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 flex flex-col gap-5">

          {activeTab === 'STOCK' ? (
            /* ═══ STOCK TAB ═══ */
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 shrink-0">
                {[
                  { label: 'Tổng Tồn Kho', val: gifts.reduce((s, g) => s + (g.stock||0), 0), color: 'blue', icon: PackageOpen },
                  { label: 'Đã Gửi', val: gifts.reduce((s, g) => s + (g.sent||0), 0), color: 'green', icon: Gift },
                  { label: 'Cảnh báo', val: gifts.filter(g => g.status === 'Sắp hết' || g.status === 'Hết hàng').length, color: 'red', icon: AlertTriangle },
                ].map(k => (
                  <div key={k.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{k.label}</p>
                      <h3 className={`text-3xl font-black ${k.color === 'red' ? 'text-red-500' : k.color === 'green' ? 'text-green-600' : 'text-slate-900'}`}>{k.val}</h3>
                    </div>
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center bg-${k.color}-50 text-${k.color}-500`}><k.icon size={22} /></div>
                  </div>
                ))}
              </div>

              {/* Gift Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 bg-slate-50/80 text-xs font-black text-slate-500 uppercase tracking-wider">
                  <div className="col-span-1 text-center">SKU</div>
                  <div className="col-span-4">Tên Quà Tặng</div>
                  <div className="col-span-2 text-center">Tồn Kho</div>
                  <div className="col-span-2 text-center">Đã Gửi</div>
                  <div className="col-span-2">Đơn Giá</div>
                  <div className="col-span-1 text-center">Sửa</div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {gifts.filter(g => (g.name||'').toLowerCase().includes(search.toLowerCase()) || (g.sku||'').toLowerCase().includes(search.toLowerCase())).map(gift => (
                    <div key={gift.id} className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 hover:bg-slate-50 items-center transition-colors">
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
                                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${sessionFilter === s.id ? 'bg-[#005691] text-white font-bold' : 'text-slate-700 hover:bg-slate-50'}`}>
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
                    <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-colors">
                      <Download size={13} /> Excel
                    </button>
                    <button onClick={() => exportLabelWord(filteredOrders)} className="flex items-center gap-1.5 px-3 py-2 bg-[#005691] text-white rounded-xl text-xs font-bold hover:bg-[#004270] transition-colors">
                      <FileText size={13} /> Xuất Tem Word
                    </button>
                  </div>
                </div>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-12 gap-3 p-4 border-b border-slate-100 bg-slate-50/80 text-xs font-black text-slate-500 uppercase tracking-wider">
                <div className="col-span-2">Mã Đơn / Ngày</div>
                <div className="col-span-3">Người nhận</div>
                <div className="col-span-3">Địa chỉ giao</div>
                <div className="col-span-2">Quà tặng</div>
                <div className="col-span-2">Tiến độ</div>
              </div>

              {/* Table rows */}
              <div className="flex-1 overflow-y-auto">
                {filteredOrders.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Package size={40} className="mb-3 opacity-30" />
                    <p className="font-bold">Không có đơn hàng nào</p>
                  </div>
                )}
                {filteredOrders.map(order => (
                  <div key={order.id} className="grid grid-cols-12 gap-3 p-4 border-b border-slate-100 hover:bg-slate-50 items-start transition-colors group">
                    <div className="col-span-2">
                      <span className="font-black text-sm text-[#005691] block">{order.id}</span>
                      <span className="text-xs font-medium text-slate-400">{order.date}</span>
                      {order.liveSessionId && <span className="text-[10px] text-purple-500 font-bold block mt-0.5">📺 {sessions.find(s => s.id === order.liveSessionId)?.title || order.liveSessionId}</span>}
                    </div>
                    <div className="col-span-3">
                      <span className="font-bold text-sm text-slate-900 block">{order.recipient || order.recipientName}</span>
                      <span className="text-xs font-bold text-[#F58220]">{order.phone}</span>
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
                                    className={`px-4 py-2.5 text-xs font-bold hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors ${order.status === s.key ? 'text-[#005691] bg-blue-50/50' : 'text-slate-700'}`}>
                                    <span><span className={`inline-block w-2 h-2 rounded-full mr-2 ${s.dot}`} />{s.label}</span>
                                    {order.status === s.key && <CheckCircle2 size={13} className="text-[#005691]" />}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        {/* NCC info when IN_TRANSIT */}
                        {order.status === 'IN_TRANSIT' && order.lastMileCarrier && (
                          <div className="mt-2 space-y-1 text-[10px]">
                            <div className="font-bold text-slate-600">🚚 {order.lastMileCarrier}</div>
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
      <div className={`absolute top-0 right-0 w-[420px] h-full bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.1)] border-l border-slate-200 transition-transform duration-400 z-50 flex flex-col ${selectedGift ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedGift && (
          <>
            <div className="h-[72px] flex items-center justify-between px-5 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#005691] to-[#F58220] flex items-center justify-center text-white"><PackageOpen size={18} /></div>
                <div><h3 className="font-black text-base text-slate-900">Hồ sơ Quà tặng</h3><p className="text-xs text-slate-400">Cập nhật thông tin & số lượng</p></div>
              </div>
              <button onClick={() => setSelectedGift(null)} className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors"><X size={15} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {[
                { label: 'Tên Quà Tặng', key: 'name', type: 'text', placeholder: 'VD: Áo Thun...' },
                { label: 'Mã SKU', key: 'sku', type: 'text', placeholder: 'VD: Q-AO-01' },
                { label: 'Đơn Giá', key: 'price', type: 'text', placeholder: 'VD: 150,000đ' },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{f.label}</label>
                  <input type={f.type} value={selectedGift[f.key] || ''} placeholder={f.placeholder}
                    onChange={e => setSelectedGift({...selectedGift, [f.key]: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:border-[#F58220] transition-all" />
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
                className="px-4 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center disabled:opacity-50"><Trash2 size={16} /></button>
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
      <div className={`absolute top-0 right-0 w-[460px] h-full bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.1)] border-l border-slate-200 transition-transform duration-400 z-50 flex flex-col ${selectedOrder ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedOrder && (
          <>
            <div className="h-[72px] flex items-center justify-between px-5 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white"><Truck size={18} /></div>
                <div><h3 className="font-black text-base text-slate-900">{selectedOrder.id ? `Đơn ${selectedOrder.id}` : 'Tạo đơn mới'}</h3><p className="text-xs text-slate-400">Thông tin giao hàng & trạng thái</p></div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors"><X size={15} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Recipient Info */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">👤 Người nhận</h4>
                {[
                  { label: 'Họ tên', key: 'recipientName', placeholder: 'Nguyễn Văn A', type: 'text' },
                  { label: 'Số điện thoại', key: 'phone', placeholder: '0901234567', type: 'tel' },
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
                  className="w-full bg-blue-50 border border-blue-200 text-[#005691] text-sm font-bold rounded-xl px-4 py-2.5 cursor-pointer flex justify-between items-center">
                  {selectedOrder.gift || 'Chọn quà tặng...'}<ChevronDown size={14} className="opacity-50" />
                </div>
                {drawerGiftOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDrawerGiftOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                      {gifts.map(g => (
                        <div key={g.id} onClick={() => { setSelectedOrder({...selectedOrder, gift: g.name}); setDrawerGiftOpen(false); }}
                          className={`px-4 py-2.5 text-sm font-bold cursor-pointer hover:bg-slate-50 flex justify-between ${selectedOrder.gift === g.name ? 'text-[#005691] bg-blue-50/50' : 'text-slate-700'}`}>
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
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-2.5 cursor-pointer flex justify-between items-center">
                  <StatusBadge status={selectedOrder.status} />
                  <ChevronDown size={14} className="opacity-50 ml-2" />
                </div>
                {drawerStatusOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDrawerStatusOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                      {ORDER_STATUSES.map(s => (
                        <div key={s.key} onClick={() => { setSelectedOrder({...selectedOrder, status: s.key}); setDrawerStatusOpen(false); }}
                          className={`px-4 py-2.5 text-xs font-bold cursor-pointer hover:bg-slate-50 flex justify-between transition-colors ${selectedOrder.status === s.key ? 'text-[#005691] bg-blue-50/50' : 'text-slate-700'}`}>
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
              {selectedOrder.status === 'IN_TRANSIT' && (
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

    </div>
  );
}
