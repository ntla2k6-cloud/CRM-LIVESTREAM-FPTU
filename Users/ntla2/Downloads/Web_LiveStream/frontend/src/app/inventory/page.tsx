"use client"
import React, { useState, useMemo } from 'react';
import { 
  Package, Search, Filter, Plus, ArrowUpRight, ArrowDownRight, PackageOpen, Gift, History, Truck, ListChecks, MapPin, CheckCircle2, Clock, Phone, X, Edit3, Save, Trash2, ChevronDown, Download, Calendar
} from "lucide-react";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'FULFILLMENT'>('STOCK');
  const [search, setSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("Tất cả");
  const [monthFilter, setMonthFilter] = useState("Tất cả");
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  
  const initialGifts = [
    { id: 1, sku: 'Q-BALO-01', name: 'Balo FPT University', stock: 45, sent: 320, price: '350,000đ', status: 'Sẵn sàng', value: "Balo" },
    { id: 2, sku: 'Q-AOT-03', name: 'Áo thun Cam FPT', stock: 210, sent: 1200, price: '150,000đ', status: 'Sẵn sàng', value: "Ao" },
    { id: 3, sku: 'Q-BGN-02', name: 'Bình giữ nhiệt', stock: 15, sent: 890, price: '120,000đ', status: 'Sắp hết', value: "Binh" },
    { id: 4, sku: 'Q-MOK-04', name: 'Móc khóa Ếch xanh Pepe', stock: 850, sent: 150, price: '50,000đ', status: 'Sẵn sàng', value: "MocKhoa" },
    { id: 5, sku: 'Q-SOT-05', name: 'Sổ tay sinh viên', stock: 0, sent: 120, price: '50,000đ', status: 'Hết hàng', value: "SoTay" },
  ];

  const initialOrders = [
    { id: 'DON-001', recipient: 'Thành Đô', phone: '090xxxx123', address: 'Quận 1, TP.HCM', gift: 'Balo FPT University', status: 'Đã đóng gói', date: '10/09/2026 10:15', trackingInfo: '' },
    { id: 'DON-002', recipient: 'Khánh Vũ', phone: '091xxxx789', address: 'Đồng Nai', gift: 'Bình giữ nhiệt', status: 'Đã chuyển tới đơn vị vận chuyển', date: '10/09/2026 10:20', trackingInfo: '' },
    { id: 'DON-003', recipient: 'Vũ Yến', phone: '097xxxx333', address: 'Bình Dương', gift: 'Áo thun Cam FPT', status: 'Chưa đóng gói', date: '10/09/2026 10:35', trackingInfo: '' },
    { id: 'DON-004', recipient: 'Hoài Anh', phone: '098xxxx456', address: 'Hà Nội', gift: 'Balo FPT University', status: 'Đơn vị đang vận chuyển', trackingInfo: 'GHTK - 123456789', date: '12/09/2026 19:10' },
  ];

  const [gifts, setGifts] = useState<any[]>(initialGifts);
  const [orders, setOrders] = useState<any[]>(initialOrders);

  React.useEffect(() => {
    const syncData = () => {
      const savedGifts = localStorage.getItem('inventory_gifts');
      if (savedGifts) try { setGifts(JSON.parse(savedGifts)); } catch(e){}
      
      const savedOrders = localStorage.getItem('inventory_orders');
      if (savedOrders) try { setOrders(JSON.parse(savedOrders)); } catch(e){}
    };
    syncData();
    window.addEventListener('storage', syncData);
    return () => window.removeEventListener('storage', syncData);
  }, []);

  const [selectedGift, setSelectedGift] = useState<any | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [drawerGiftOpen, setDrawerGiftOpen] = useState(false);
  const [drawerStatusOpen, setDrawerStatusOpen] = useState(false);

  const handleSaveOrder = () => {
    if (!selectedOrder) return;
    if (selectedOrder.status === 'Đơn vị đang vận chuyển' && !selectedOrder.trackingInfo?.trim()) {
      alert("Vui lòng điền Mã vận đơn / Link tra cứu trước khi lưu!");
      return;
    }
    const updated = orders.map(o => o.id === selectedOrder.id ? selectedOrder : o);
    setOrders(updated);
    localStorage.setItem('inventory_orders', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    setSelectedOrder(null);
  };

  const handleSaveGift = () => {
    if (!selectedGift) return;
    let updated;
    if (gifts.find(g => g.id === selectedGift.id)) {
      updated = gifts.map(g => g.id === selectedGift.id ? selectedGift : g);
    } else {
      updated = [{ ...selectedGift, id: Date.now(), sent: 0 }, ...gifts];
    }
    setGifts(updated);
    localStorage.setItem('inventory_gifts', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    setSelectedGift(null);
  };

  const handleDeleteGift = () => {
    if (confirm("Bạn có chắc chắn muốn xóa phần quà này khỏi Kho?")) {
      const updated = gifts.filter(g => g.id !== selectedGift.id);
      setGifts(updated);
      localStorage.setItem('inventory_gifts', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      setSelectedGift(null);
    }
  };

  // Lấy tháng từ chuỗi ngày "dd/mm/yyyy hh:mm"
  const getMonth = (dateStr: string) => {
    const parts = dateStr.split('/');
    if (parts.length >= 2) return `Tháng ${parseInt(parts[1])}/${parts[2]?.split(' ')[0]}`;
    return '';
  };

  // Danh sách tháng có trong dữ liệu
  const availableMonths = useMemo(() => {
    const months = new Set(orders.map(o => getMonth(o.date)));
    return ['Tất cả', ...Array.from(months).sort((a, b) => {
      const [ma, ya] = a.replace('Tháng ', '').split('/').map(Number);
      const [mb, yb] = b.replace('Tháng ', '').split('/').map(Number);
      return (yb * 12 + mb) - (ya * 12 + ma); // Mới nhất trước
    })];
  }, [orders]);

  // Filtered orders (theo tháng + trạng thái + search)
  const filteredOrders = useMemo(() => {
    return orders
      .filter(o => monthFilter === 'Tất cả' || getMonth(o.date) === monthFilter)
      .filter(o => orderFilter === 'Tất cả' || o.status === orderFilter)
      .filter(o => o.recipient.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase()) || o.phone.includes(search));
  }, [orders, monthFilter, orderFilter, search]);

  // Xuất Excel (CSV)
  const handleExportExcel = () => {
    const label = monthFilter === 'Tất cả' ? 'Tất cả tháng' : monthFilter;
    const statusLabel = orderFilter === 'Tất cả' ? '' : ` - ${orderFilter}`;
    const rows = [
      ['Mã Đơn', 'Ngày', 'Học sinh', 'SĐT', 'Địa chỉ', 'Quà tặng', 'Trạng thái', 'Mã vận đơn'],
      ...filteredOrders.map(o => [
        o.id, o.date, o.recipient, o.phone, o.address, o.gift, o.status, (o as any).trackingInfo || ''
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const bom = '\uFEFF'; // UTF-8 BOM cho Excel
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DonHang_${label.replace(' ', '_')}${statusLabel.replace(' - ', '_')}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "Sẵn sàng": return <span className="bg-green-50 text-green-600 px-2 py-1 rounded text-xs font-bold border border-green-200">Sẵn sàng</span>;
      case "Sắp hết": return <span className="bg-yellow-50 text-yellow-600 px-2 py-1 rounded text-xs font-bold border border-yellow-200 animate-pulse">Sắp hết</span>;
      case "Hết hàng": return <span className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs font-bold border border-red-200">Hết hàng</span>;
      default: return <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">{status}</span>;
    }
  };

  const getOrderStatus = (status: string, editable: boolean = false) => {
    const chevron = editable ? <ChevronDown size={14} className="ml-1 opacity-50" /> : null;
    switch(status) {
      case "Chưa đóng gói": return <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 flex items-center gap-1.5 w-fit"><Package size={12}/> Chưa đóng gói {chevron}</span>;
      case "Đã đóng gói": return <span className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-orange-200 flex items-center gap-1.5 w-fit"><PackageOpen size={12}/> Đã đóng gói {chevron}</span>;
      case "Đã chuyển tới đơn vị vận chuyển": return <span className="bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-purple-200 flex items-center gap-1.5 w-fit"><Truck size={12}/> Đã chuyển ĐVVC {chevron}</span>;
      case "Đơn vị đang vận chuyển": return <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-200 flex items-center gap-1.5 w-fit"><MapPin size={12}/> Đơn vị đang vận chuyển {chevron}</span>;
      case "Hoàn tất": return <span className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-200 flex items-center gap-1.5 w-fit"><CheckCircle2 size={12}/> Hoàn tất {chevron}</span>;
      case "Hoàn hàng": return <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-200 flex items-center gap-1.5 w-fit"><Trash2 size={12}/> Hoàn hàng {chevron}</span>;
      default: return null;
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-50 font-sans relative overflow-hidden">
      
      {/* HEADER */}
      <div className="h-auto py-4 px-4 md:h-[88px] md:py-0 md:px-8 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between shrink-0 shadow-sm z-10 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="text-[#005691]" /> Quản trị Kho Quà tặng
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Kiểm soát tồn kho & tiến độ giao quà cho Minigame</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={activeTab === 'STOCK' ? "Tìm mã quà, tên quà..." : "Tìm mã đơn, SĐT..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#005691]/20 outline-none w-full md:w-64 transition-all"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm transition-all">
            <Filter size={18} />
          </button>
          {activeTab === 'STOCK' && (
            <button 
              onClick={() => setSelectedGift({ id: Date.now(), name: '', sku: '', stock: 0, price: '', status: 'Sẵn sàng' })}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#F58220] hover:bg-[#e07010] rounded-xl text-sm font-bold text-white shadow-md shadow-orange-900/20 transition-all hover:-translate-y-0.5"
            >
              <Plus size={16} /> Nhập kho quà mới
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* TABS */}
        <div className="px-4 md:px-8 pt-6 pb-2 shrink-0">
          <div className="flex bg-white border border-slate-200 p-1 rounded-xl w-fit shadow-sm">
            <button 
              onClick={() => setActiveTab('STOCK')} 
              className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'STOCK' ? 'bg-[#005691] text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              <PackageOpen size={16} /> <span className="hidden md:inline">Kho Tồn & Lịch sử</span><span className="md:hidden">Kho Tồn</span>
            </button>
            <button 
              onClick={() => setActiveTab('FULFILLMENT')} 
              className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'FULFILLMENT' ? 'bg-[#00A859] text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              <Truck size={16} /> <span className="hidden md:inline">Tiến độ Giao quà</span><span className="md:hidden">Giao quà</span>
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 flex flex-col gap-6">
          
          {activeTab === 'STOCK' ? (
            /* STOCK VIEW */
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 shrink-0">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-[#005691] transition-colors">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng Tồn Kho</p>
                    <h3 className="text-3xl font-black text-slate-900">{gifts.reduce((sum, g) => sum + g.stock, 0)}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PackageOpen size={24} />
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-[#00A859] transition-colors">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Đã Gửi (Tháng này)</p>
                    <h3 className="text-3xl font-black text-slate-900">{gifts.reduce((sum, g) => sum + g.sent, 0)}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Gift size={24} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-red-500 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cảnh báo Sắp Hết</p>
                    <h3 className="text-3xl font-black text-red-500">{gifts.filter(g => g.status === 'Sắp hết' || g.status === 'Hết hàng').length}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowDownRight size={24} />
                  </div>
                </div>
              </div>

              {/* TABLE */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 bg-slate-50/80 text-xs font-black text-slate-500 uppercase tracking-wider">
                  <div className="col-span-1 text-center">SKU</div>
                  <div className="col-span-4">Tên Quà Tặng</div>
                  <div className="col-span-2 text-center">Tồn Kho Hiện Tại</div>
                  <div className="col-span-2 text-center">Lượt Đã Gửi</div>
                  <div className="col-span-2">Đơn Giá / Món</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {gifts.filter(g => g.name.toLowerCase().includes(search.toLowerCase()) || g.sku.toLowerCase().includes(search.toLowerCase())).map((gift) => (
                    <div key={gift.id} className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 hover:bg-slate-50 items-center transition-colors">
                      <div className="col-span-1 text-center font-bold text-slate-400 text-xs">{gift.sku}</div>
                      <div className="col-span-4 flex flex-col">
                        <span className="font-bold text-sm text-slate-900 truncate">{gift.name}</span>
                        <span className="mt-1">{getStatusBadge(gift.status)}</span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className={`text-lg font-black ${gift.stock === 0 ? 'text-red-500' : 'text-[#005691]'}`}>{gift.stock}</span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="text-lg font-black text-[#00A859]">{gift.sent}</span>
                      </div>
                      <div className="col-span-2 font-bold text-slate-600 text-sm">
                        {gift.price}
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button 
                          onClick={() => setSelectedGift(gift)}
                          className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-[#F58220] hover:text-white flex items-center justify-center transition-colors shadow-sm"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* FULFILLMENT VIEW */
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex flex-wrap gap-2">
                  {["Tất cả", "Chưa đóng gói", "Đã đóng gói", "Đã chuyển tới đơn vị vận chuyển", "Đơn vị đang vận chuyển", "Hoàn tất", "Hoàn hàng"].map((filter) => (
                    <button 
                      key={filter} 
                      onClick={() => setOrderFilter(filter)}
                      className={`px-4 py-2 rounded-xl text-[11px] font-bold border transition-colors ${orderFilter === filter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button 
                      onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Calendar size={14} className="text-[#005691]" /> 
                      {monthFilter} 
                      <ChevronDown size={14} className="text-slate-400" />
                    </button>
                    {showMonthDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowMonthDropdown(false)} />
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden py-1">
                          {availableMonths.map(m => (
                            <div 
                              key={m}
                              onClick={() => { setMonthFilter(m); setShowMonthDropdown(false); }}
                              className={`px-4 py-2 text-sm cursor-pointer transition-colors ${monthFilter === m ? 'bg-[#005691] text-white font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                              {m}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <button 
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-[#00A859] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-green-600 transition-colors"
                  >
                    <Download size={14} /> Xuất Excel
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 bg-slate-50/80 text-xs font-black text-slate-500 uppercase tracking-wider">
                <div className="col-span-2">Mã Đơn / Ngày</div>
                <div className="col-span-3">Học sinh</div>
                <div className="col-span-3">Địa chỉ giao</div>
                <div className="col-span-2">Quà tặng</div>
                <div className="col-span-2">Tiến độ</div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 hover:bg-slate-50 items-center transition-colors group">
                    <div className="col-span-2">
                      <span className="font-black text-sm text-[#005691] block">{order.id}</span>
                      <span className="text-xs font-bold text-slate-400">{order.date}</span>
                    </div>
                    <div className="col-span-3">
                      <span className="font-bold text-sm text-slate-900 block">{order.recipient}</span>
                      <span className="text-xs font-bold text-[#F58220]">{order.phone}</span>
                    </div>
                    <div className="col-span-3">
                      <span className="font-semibold text-sm text-slate-600 line-clamp-2">{order.address}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-bold text-sm text-slate-800 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">{order.gift}</span>
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      <div className="flex flex-col gap-1.5">
                        <div className="relative inline-block w-fit cursor-pointer group/status">
                          <div onClick={() => setOpenDropdownId(openDropdownId === order.id ? null : order.id)} className="hover:opacity-80 transition-opacity">
                            {getOrderStatus(order.status, true)}
                          </div>
                          
                          {openDropdownId === order.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />
                              <div className="absolute top-full left-0 mt-1 w-[220px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2">
                                {["Chưa đóng gói", "Đã đóng gói", "Đã chuyển tới đơn vị vận chuyển", "Đơn vị đang vận chuyển", "Hoàn tất", "Hoàn hàng"].map(s => (
                                  <div 
                                    key={s}
                                    onClick={() => {
                                      setOrders(orders.map(o => o.id === order.id ? { ...o, status: s } : o));
                                      setOpenDropdownId(null);
                                      if (s === 'Đơn vị đang vận chuyển' || s === 'Hoàn hàng') {
                                        setSelectedOrder({ ...order, status: s });
                                      }
                                    }}
                                    className={`px-4 py-2.5 text-xs font-bold hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between ${order.status === s ? 'text-[#005691] bg-blue-50/50' : 'text-slate-700'}`}
                                  >
                                    {s === 'Đơn vị đang vận chuyển' ? 'Đơn vị đang VC (+ Mã)' : s}
                                    {order.status === s && <CheckCircle2 size={14} className="text-[#005691]" />}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                        {order.trackingInfo && (
                          <span className="text-[9px] font-bold text-blue-500 truncate max-w-[150px] cursor-pointer hover:underline" title={order.trackingInfo}>
                            {order.trackingInfo}
                          </span>
                        )}
                      </div>
                      <button onClick={() => setSelectedOrder(order)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:bg-[#005691] hover:text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 shadow-sm">
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* GIFT EDIT DRAWER (SLIDE-OUT) */}
      <div className={`absolute top-0 right-0 w-[450px] h-full bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.1)] border-l border-slate-200 transition-transform duration-500 z-50 flex flex-col ${selectedGift ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedGift && (
          <>
            <div className="h-[88px] flex items-center justify-between px-6 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#005691] to-[#F58220] flex items-center justify-center text-white shadow-md">
                  <PackageOpen size={20} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 tracking-tight">Hồ sơ Quà tặng</h3>
                  <p className="text-xs font-bold text-slate-500">Cập nhật thông tin và số lượng</p>
                </div>
              </div>
              <button onClick={() => setSelectedGift(null)} className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6">
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Tên Quà Tặng</label>
                  <input 
                    type="text" 
                    value={selectedGift.name}
                    onChange={(e) => setSelectedGift({...selectedGift, name: e.target.value})}
                    placeholder="VD: Áo Thun Chuyên Ngành..." 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220] outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Mã SKU</label>
                    <input 
                      type="text" 
                      value={selectedGift.sku}
                      onChange={(e) => setSelectedGift({...selectedGift, sku: e.target.value})}
                      placeholder="VD: Q-AO-01" 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 focus:border-[#005691] focus:ring-1 focus:ring-[#005691] outline-none transition-all uppercase"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Đơn Giá</label>
                    <input 
                      type="text" 
                      value={selectedGift.price}
                      onChange={(e) => setSelectedGift({...selectedGift, price: e.target.value})}
                      placeholder="VD: 150,000đ" 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 focus:border-[#005691] focus:ring-1 focus:ring-[#005691] outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Tồn kho hiện tại</label>
                    <input 
                      type="number" 
                      value={selectedGift.stock}
                      onChange={(e) => setSelectedGift({...selectedGift, stock: parseInt(e.target.value) || 0})}
                      className="w-full bg-blue-50 border border-blue-200 text-[#005691] text-lg font-black rounded-xl px-4 py-2.5 focus:border-[#005691] outline-none transition-all text-center"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Trạng thái kho</label>
                    <select 
                      value={selectedGift.status}
                      onChange={(e) => setSelectedGift({...selectedGift, status: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 focus:border-[#005691] focus:ring-1 focus:ring-[#005691] outline-none transition-all"
                    >
                      <option value="Sẵn sàng">Sẵn sàng (Còn hàng)</option>
                      <option value="Sắp hết">Cảnh báo: Sắp hết</option>
                      <option value="Hết hàng">Đã Hết hàng</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3">
                <History className="text-[#F58220] mt-0.5 shrink-0" size={18} />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Lịch sử xuất kho</h4>
                  <p className="text-xs text-slate-600 mt-1 font-semibold leading-relaxed">
                    Đã có <b className="text-[#00A859]">{selectedGift.sent || 0} lượt</b> quà tặng này được chuyển đi cho các học sinh trúng thưởng Minigame trong tháng.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
              <button 
                onClick={handleDeleteGift}
                className="px-4 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center shrink-0"
              >
                <Trash2 size={18} />
              </button>
              <button 
                onClick={handleSaveGift}
                className="flex-1 px-4 py-3 bg-[#F58220] text-white font-black rounded-xl hover:bg-[#e07010] shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} /> Lưu thông tin Quà tặng
              </button>
            </div>
          </>
        )}
      </div>

      {/* ORDER EDIT DRAWER (SLIDE-OUT) */}
      <div className={`absolute top-0 right-0 w-[450px] h-full bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.1)] border-l border-slate-200 transition-transform duration-500 z-50 flex flex-col ${selectedOrder ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedOrder && (
          <>
            <div className="h-[88px] flex items-center justify-between px-6 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-md">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 tracking-tight">Cập nhật Giao Quà</h3>
                  <p className="text-xs font-bold text-slate-500">Mã đơn: {selectedOrder.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6">
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold">Học sinh:</label>
                    <input 
                      type="text" 
                      value={selectedOrder.recipient}
                      onChange={e => setSelectedOrder({...selectedOrder, recipient: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-black rounded-lg px-3 py-2 outline-none focus:border-[#005691]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold">Điện thoại:</label>
                    <input 
                      type="text" 
                      value={selectedOrder.phone}
                      onChange={e => setSelectedOrder({...selectedOrder, phone: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-black rounded-lg px-3 py-2 outline-none focus:border-[#005691]"
                    />
                  </div>
                  <div className="space-y-1 relative">
                    <label className="text-xs text-slate-500 font-bold">Quà tặng:</label>
                    <div 
                      onClick={() => setDrawerGiftOpen(!drawerGiftOpen)}
                      className="w-full bg-blue-50 border border-blue-200 text-[#005691] text-sm font-black rounded-lg px-3 py-2 outline-none cursor-pointer flex justify-between items-center"
                    >
                      {selectedOrder.gift}
                      <ChevronDown size={14} className="opacity-50" />
                    </div>
                    {drawerGiftOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setDrawerGiftOpen(false)} />
                        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2">
                          {gifts.map(g => (
                            <div 
                              key={g.id}
                              onClick={() => {
                                setSelectedOrder({...selectedOrder, gift: g.name});
                                setDrawerGiftOpen(false);
                              }}
                              className={`px-3 py-2 text-sm font-bold hover:bg-slate-50 cursor-pointer flex items-center justify-between ${selectedOrder.gift === g.name ? 'text-[#005691] bg-blue-50/50' : 'text-slate-700'}`}
                            >
                              {g.name}
                              {selectedOrder.gift === g.name && <CheckCircle2 size={14} className="text-[#005691]" />}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="space-y-1 pt-2 border-t border-slate-200">
                    <label className="text-xs text-slate-500 font-bold flex items-center gap-1">
                      <MapPin size={12} /> Địa chỉ giao hàng:
                    </label>
                    <textarea 
                      value={selectedOrder.address}
                      onChange={e => setSelectedOrder({...selectedOrder, address: e.target.value})}
                      rows={2}
                      className="w-full bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg px-3 py-2 outline-none focus:border-[#005691] resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Trạng thái giao hàng</label>
                  <div 
                    onClick={() => setDrawerStatusOpen(!drawerStatusOpen)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 cursor-pointer flex justify-between items-center"
                  >
                    {selectedOrder.status}
                    <ChevronDown size={16} className="opacity-50" />
                  </div>
                  {drawerStatusOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setDrawerStatusOpen(false)} />
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2">
                        {["Chưa đóng gói", "Đã đóng gói", "Đã chuyển tới đơn vị vận chuyển", "Đơn vị đang vận chuyển", "Hoàn tất", "Hoàn hàng"].map(s => (
                          <div 
                            key={s}
                            onClick={() => {
                              setSelectedOrder({...selectedOrder, status: s});
                              setDrawerStatusOpen(false);
                            }}
                            className={`px-4 py-2.5 text-sm font-bold hover:bg-slate-50 cursor-pointer flex items-center justify-between ${selectedOrder.status === s ? 'text-[#F58220] bg-orange-50/50' : 'text-slate-700'}`}
                          >
                            {s}
                            {selectedOrder.status === s && <CheckCircle2 size={16} className="text-[#F58220]" />}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {selectedOrder.status === 'Đơn vị đang vận chuyển' && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Mã vận đơn / Link tra cứu</label>
                    <textarea 
                      value={selectedOrder.trackingInfo || ''}
                      onChange={(e) => setSelectedOrder({...selectedOrder, trackingInfo: e.target.value})}
                      placeholder="VD: GHTK - 123456 (Link: https://ghtk.vn)" 
                      rows={3}
                      className="w-full bg-blue-50/50 border border-blue-200 text-slate-900 text-sm font-semibold rounded-xl px-4 py-3 focus:border-[#005691] focus:ring-1 focus:ring-[#005691] outline-none transition-all resize-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
              <button 
                onClick={handleSaveOrder}
                className="w-full px-4 py-3 bg-[#F58220] text-white font-black rounded-xl hover:bg-[#e07010] shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} /> Cập nhật Tiến độ
              </button>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
