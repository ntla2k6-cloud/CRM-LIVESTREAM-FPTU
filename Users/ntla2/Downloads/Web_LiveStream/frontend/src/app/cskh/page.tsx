"use client"
import React, { useState } from 'react';
import { 
  Phone, MessageSquare, MoreHorizontal, CalendarClock, Search, Filter, 
  ChevronRight, Users, Flame, UserCheck, PhoneCall, CheckCircle2, X, Save, Edit3, Tag, Package, Download, List, LayoutGrid, Plus, Trash2
} from "lucide-react";
import { api } from '@/lib/api';

export default function CSKHBoardPage() {
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [activeDropdown, setActiveDropdown] = useState<'status' | 'staff' | 'gift' | null>(null);
  const [filterProject, setFilterProject] = useState('Tất cả');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  React.useEffect(() => {
    const handleErr = (e: ErrorEvent) => setRenderError(e.message);
    window.addEventListener('error', handleErr);
    return () => window.removeEventListener('error', handleErr);
  }, []);

  if (renderError) {
    return <div className="p-10 text-red-500 font-bold">CRASH: {renderError}</div>;
  }


  const columns = [
    { id: 0, title: "LEAD MỚI", icon: Users, color: "#005691", bg: "bg-blue-50/50", border: "border-blue-200" },
    { id: 1, title: "ĐANG TƯ VẤN", icon: PhoneCall, color: "#F58220", bg: "bg-orange-50/50", border: "border-orange-200" },
    { id: 2, title: "ĐANG CÂN NHẮC", icon: CalendarClock, color: "#EAB308", bg: "bg-yellow-50/50", border: "border-yellow-200" },
    { id: 3, title: "CHỐT ĐĂNG KÝ", icon: CheckCircle2, color: "#00A859", bg: "bg-green-50/50", border: "border-green-200" },
  ];

  const initialLeads = [
    { id: 1, name: "Thành Đô", phone: "090xxxx123", tiktok: "@thanhdo.2k6", intent: "Ngành Kỹ thuật phần mềm", source: "Uống Gì CHƯA Tập 1", project: "Uống Gì CHƯA", score: 95, isHot: true, col: 0, avatar: "TĐ", highSchool: "THPT Chuyên Lê Hồng Phong", grade: "Lớp 12", province: "TP. Hồ Chí Minh", cskhStaff: "Bảo My", note: "Quan tâm AI, AI-IoT", history: [{ text: "Trường mình có xét tuyển học bạ ngành CNTT không ạ?", time: "10:05", type: "Hỏi Tuyển sinh" }, { text: "1.C", time: "10:20", type: "Minigame (Đúng)" }] },
    { id: 2, name: "Hoài Anh", phone: "098xxxx456", tiktok: "@hoaianh_05", intent: "Học phí & Học bổng 50%", source: "Hành Trang IT", project: "Học Thuật", score: 65, isHot: false, col: 0, avatar: "HA", highSchool: "THPT Nguyễn Trãi", grade: "Lớp 12", province: "Hà Nội", cskhStaff: "Quang Lâm", note: "Muốn xin học bổng", history: [{ text: "Làm sao để lấy học bổng 100% của trường ạ?", time: "Hôm qua", type: "Inbox" }] },
    { id: 3, name: "Khánh Vũ", phone: "091xxxx789", tiktok: "@khanhvu.media", intent: "Ngành Truyền thông đa phương tiện", source: "Uống Gì CHƯA Tập 1", project: "Uống Gì CHƯA", score: 88, isHot: true, col: 0, avatar: "KV", highSchool: "THPT Marie Curie", grade: "Lớp 11", province: "Đồng Nai", cskhStaff: "Bảo My", note: "Đang phân vân giữa Đa phương tiện và Báo chí", history: [] },
    
    { id: 4, name: "Tuấn Phạm", phone: "093xxxx222", tiktok: "@tuan.pham.design", intent: "Ngành Thiết kế đồ họa", source: "Hành Trang IT", project: "Học Thuật", score: 90, isHot: true, col: 1, avatar: "TP", highSchool: "THPT Lý Tự Trọng", grade: "Lớp 12", province: "Cần Thơ", cskhStaff: "Ví dụ 1", note: "Đã tư vấn xong học phí, chờ gia đình quyết định", history: [] },
    { id: 5, name: "Vũ Yến", phone: "097xxxx333", tiktok: "@yen.vu.biz", intent: "Ngành Quản trị kinh doanh", source: "Uống Gì CHƯA Tập 1", project: "Uống Gì CHƯA", score: 50, isHot: false, col: 1, avatar: "VY", highSchool: "", grade: "", province: "Bình Dương", cskhStaff: "Ví dụ 2", note: "Đang cân nhắc", history: [] },

    { id: 6, name: "Đình Phúc", phone: "094xxxx555", tiktok: "@phuc.dinh99", intent: "Ký túc xá Campus Q9", source: "Hành Trang IT", project: "Học Thuật", score: 80, isHot: false, col: 2, avatar: "ĐP", province: "Bà Rịa - Vũng Tàu", cskhStaff: "Ví dụ 1", note: "Cần check lại slot KTX", history: [] },
    { id: 7, name: "Minh Thư", phone: "092xxxx888", tiktok: "@minhthu.2k6", intent: "Thiết kế đồ họa", source: "Uống Gì CHƯA Tập 1", project: "Uống Gì CHƯA", score: 85, isHot: false, col: 2, avatar: "MT", province: "Đà Lạt", cskhStaff: "Quang Lâm", note: "Quan tâm Portfolio", history: [] },
    { id: 8, name: "Gia Bảo", phone: "090xxxx999", tiktok: "@bao.gia", intent: "OJT Thực tập doanh nghiệp", source: "Hành Trang IT", project: "Học Thuật", score: 100, isHot: true, col: 3, avatar: "GB", province: "TP. Hồ Chí Minh", cskhStaff: "Ví dụ 2", note: "Đã nộp đủ hồ sơ", history: [] },
    
    { id: 9, name: "Thanh Trúc", phone: "093xxxx777", tiktok: "@truc.thanh", intent: "Học bổng", source: "Hành Trang IT", project: "Học Thuật", score: 95, isHot: true, col: 3, avatar: "TT", province: "Hà Nội", cskhStaff: "Bảo My", note: "Đã giữ chỗ", history: [] },
    { id: 10, name: "Hải Đăng", phone: "098xxxx111", tiktok: "@hai.dang.2k5", intent: "Công nghệ Ô tô", source: "Uống Gì CHƯA Tập 1", project: "Uống Gì CHƯA", score: 40, isHot: false, col: 1, avatar: "HĐ", province: "Hải Phòng", cskhStaff: "Quang Lâm", note: "Chờ điểm thi", history: [] },
    { id: 11, name: "Ngọc Diệp", phone: "091xxxx222", tiktok: "@ngoc.diep", intent: "Digital Marketing", source: "Hành Trang IT", project: "Học Thuật", score: 70, isHot: false, col: 0, avatar: "ND", province: "Đà Nẵng", cskhStaff: "Ví dụ 1", note: "Hẹn 8h tối mai gọi lại", history: [] },
    { id: 12, name: "Quốc Hưng", phone: "096xxxx888", tiktok: "@hung.quoc", intent: "Trí tuệ nhân tạo", source: "Hành Trang IT", project: "Học Thuật", score: 90, isHot: true, col: 2, avatar: "QH", province: "Bình Định", cskhStaff: "Ví dụ 2", note: "Muốn học thêm Tiếng Nhật", history: [] },
  ];

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

  const [leads, setLeads] = useState<any[]>([]);
  const [gifts, setGifts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<any | null>(null);

  const [showAddLead, setShowAddLead] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({ name: '', phone: '', tiktok: '', intent: '', project: 'Khác', note: '', province: '', highSchool: '', grade: '' });
  const [toastMsg, setToastMsg] = useState<{title: string, desc: string, type?: 'success' | 'error' | 'warning'} | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsRes, giftsRes, ordersRes] = await Promise.all([
          api.get('/lead'),
          api.get('/gift'),
          api.get('/order')
        ]);
        
        // Trích xuất dữ liệu từ object { data: [...] }
        const rawLeads = Array.isArray(leadsRes) ? leadsRes : (leadsRes?.data || []);
        const rawGifts = Array.isArray(giftsRes) ? giftsRes : (giftsRes?.data || []);
        const rawOrders = Array.isArray(ordersRes) ? ordersRes : (ordersRes?.data || []);
        
        const apiLeads = rawLeads.map((l: any) => {
          try {
            return {
              id: String(l.id || Math.random()),
              name: String(l.customer?.fullName || ('Khách ' + String(l.id).substring(0,4))),
              phone: String(l.customer?.phone || ''),
              tiktok: String(l.customer?.tiktokAccount || ''),
              intent: String(l.intent || ''),
              source: String(l.campaignId || ''),
              project: String(l.campaign?.name || 'Chưa phân loại'),
              score: Number(l.leadScore) || 0,
              isHot: (Number(l.leadScore) || 0) >= 80,
              col: l.status === 'NEW' ? 0 : l.status === 'CONTACTED' ? 1 : l.status === 'CONSULTING' ? 2 : 3,
              avatar: String(l.customer?.fullName || 'K H').trim().split(' ').map((w: string) => w[0] || '').join('').substring(0, 2).toUpperCase(),
              highSchool: String(l.customer?.highSchool || ''),
              grade: String(l.customer?.classGrade || ''),
              province: String(l.customer?.location || ''),
              cskhStaff: String(l.assignedCskh?.name || ''),
              note: String(l.note || ''),
              history: Array.isArray(l.history) ? l.history : []
            };
          } catch(e) {
            console.error("Lỗi khi parse lead:", l, e);
            return null;
          }
        }).filter(Boolean);
        
        setLeads(apiLeads);
        setGifts(rawGifts);
        setOrders(rawOrders);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu CSKH:", err);
      }
    };
    fetchData();
  }, []);

  const handleAddLead = async () => {
    if (!newLeadForm.name || !newLeadForm.phone || !newLeadForm.province) {
      setToastMsg({ title: '⚠️ Thiếu thông tin!', desc: 'Vui lòng điền đầy đủ Họ Tên, Số điện thoại và Tỉnh/Thành!', type: 'error' });
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }
    
    try {
      const payload = {
        fullName: newLeadForm.name,
        phone: newLeadForm.phone,
        tiktokAccount: newLeadForm.tiktok,
        intent: newLeadForm.intent,
        note: newLeadForm.note,
        location: newLeadForm.province,
        highSchool: newLeadForm.highSchool,
        classGrade: newLeadForm.grade,
        status: 'NEW',
        leadScore: 50
      };
      const res = await api.post('/lead', payload);
      // api.post wraps result in { data }, so extract correctly
      const created = res?.data || res;
      
      const newLead = {
        id: created?.id || String(Math.random()),
        name: newLeadForm.name,
        phone: newLeadForm.phone,
        tiktok: newLeadForm.tiktok,
        intent: newLeadForm.intent,
        note: newLeadForm.note,
        province: newLeadForm.province,
        highSchool: newLeadForm.highSchool,
        grade: newLeadForm.grade,
        project: newLeadForm.project,
        avatar: newLeadForm.name.trim().split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase() || 'LD',
        score: 50,
        isHot: false,
        col: 0,
        source: 'Thêm thủ công',
        history: []
      };
      
      setLeads([newLead, ...leads]);
      setShowAddLead(false);
      setNewLeadForm({ name: '', phone: '', tiktok: '', intent: '', project: 'Khác', note: '', province: '', highSchool: '', grade: '' });
      setToastMsg({ title: '🎉 Thêm Lead thành công!', desc: `Đã thêm ${newLeadForm.name} vào danh sách. Chúc chốt deal ngon! 💪`, type: 'success' });
      setTimeout(() => setToastMsg(null), 4000);
    } catch (e) {
      console.error(e);
      setToastMsg({ title: '❌ Lỗi khi thêm Lead!', desc: 'Không thể kết nối tới máy chủ. Vui lòng thử lại!', type: 'error' });
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const filteredLeads = React.useMemo(() => {
    return leads.filter(l => {
      if (filterProject !== 'Tất cả' && l.project !== filterProject) return false;
      const term = search.toLowerCase();
      if (!term) return true;
      return l.name.toLowerCase().includes(term) || 
             l.phone.includes(term) || 
             (l.tiktok && l.tiktok.toLowerCase().includes(term)) ||
             (l.intent && l.intent.toLowerCase().includes(term)) ||
             (l.note && l.note.toLowerCase().includes(term)) ||
             (l.province && l.province.toLowerCase().includes(term)) ||
             (l.project && l.project.toLowerCase().includes(term));
    });
  }, [leads, search, filterProject]);

  return (
    <div className="flex h-full flex-col bg-slate-50 font-sans relative overflow-hidden">
      
      {/* TOP HEADER */}
      <div className="h-auto py-4 px-4 md:h-[88px] md:py-0 md:px-8 bg-white border-b border-slate-200 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 sticky top-0 shadow-sm">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="text-[#F58220]" /> DATA LIVESTREAM
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Quản lý và cập nhật hồ sơ học sinh tiềm năng</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-orange-50 border border-orange-100 rounded-xl mr-2">
            <span className="text-xs font-black text-[#F58220] uppercase tracking-wider">TỔNG LEADS:</span>
            <span className="text-lg font-black text-[#F58220]">
              {filteredLeads.length}
            </span>
          </div>
          <div className="relative group w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#005691] transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Tìm SĐT, tên học sinh..." 
              className="pl-9 pr-4 py-2.5 w-full md:w-[300px] bg-slate-100 border border-transparent rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#005691]/20 focus:bg-white transition-all shadow-sm placeholder:text-slate-400 text-slate-800"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
            <div className="relative">
              <button 
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all"
              >
                <Filter size={16} /> Lọc {filterProject !== 'Tất cả' && `: ${filterProject}`}
              </button>
              {showFilterDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowFilterDropdown(false)} />
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 font-bold text-sm">
                    <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Lọc theo Dự án</div>
                    {['Tất cả', 'Học Thuật', 'Uống Gì CHƯA', 'Khác'].map(proj => (
                      <div 
                        key={proj}
                        onClick={() => { setFilterProject(proj); setShowFilterDropdown(false); }}
                        className={`px-4 py-2.5 cursor-pointer hover:bg-slate-50 flex items-center justify-between ${filterProject === proj ? 'text-[#005691]' : 'text-slate-700'}`}
                      >
                        {proj} {filterProject === proj && <CheckCircle2 size={16} />}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button 
              onClick={() => setShowAddLead(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#F58220] rounded-xl text-sm font-bold text-white shadow-sm transition-all hover:bg-[#d9731c]"
            >
              <Plus size={16} /> Thêm Lead
            </button>
            <button 
              onClick={() => {
                const csv = [
                  ['Tên', 'SĐT', 'TikTok', 'Dự án', 'Nhu cầu', 'Nguồn', 'Khu vực', 'Ghi chú', 'Trạng thái'],
                  ...filteredLeads.map(l => [
                    l.name, l.phone, l.tiktok || '', l.project || 'Khác', l.intent, l.source, 
                    l.province || '', l.note || '', columns.find(c => c.id === l.col)?.title || ''
                  ])
                ].map(r => r.join(',')).join('\n');
                const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Leads_Export_${new Date().getTime()}.csv`;
                a.click();
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#00A859] rounded-xl text-sm font-bold text-white shadow-sm transition-all hover:bg-[#00904d]"
            >
              <Download size={16} /> Xuất Excel
            </button>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm text-[#005691]' : 'text-slate-400 hover:text-slate-600'}`}>
                <LayoutGrid size={18} />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-[#005691]' : 'text-slate-400 hover:text-slate-600'}`}>
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

      {/* VIEW CONTENT */}
      {viewMode === 'kanban' ? (
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-8">
        <div className="flex h-full gap-6 min-w-max">
          
          <div className="flex-1 flex gap-6 overflow-x-auto p-8 custom-scrollbar">
            {columns.map(col => {
              const columnLeads = filteredLeads.filter(l => l.col === col.id);
              
              return (
                <div key={col.id} className="flex flex-col w-[340px] h-full shrink-0 bg-slate-100/50 rounded-2xl border border-slate-200 overflow-hidden">
                  {/* Column Header */}
                  <div className="flex items-center justify-between p-4 bg-white border-b-2 shadow-sm shrink-0" style={{ borderBottomColor: col.color }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-inner" style={{ backgroundColor: `${col.color}15`, color: col.color }}>
                        <col.icon size={16} strokeWidth={2.5} />
                      </div>
                      <h3 className="font-black text-sm text-slate-800 tracking-tight">{col.title}</h3>
                    </div>
                    <div className="bg-slate-100 px-2.5 py-1 rounded-full text-xs font-black text-slate-500 shadow-inner">
                      {columnLeads.length}
                    </div>
                  </div>
                  
                  {/* Column Body */}
                  <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-4 scrollbar-hide">
                    
                    {columnLeads.length === 0 && (
                      <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-xs font-bold">
                        Trống
                      </div>
                    )}

                    {columnLeads.map((lead, idx) => (
                      <div 
                        key={lead.id} 
                        onClick={() => setSelectedLead(lead)}
                        className={`group bg-white p-4 rounded-xl border-l-4 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 border-slate-200`}
                        style={{ borderLeftColor: col.color }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 shadow-inner">
                              {lead.avatar}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 group-hover:text-[#005691] transition-colors">
                                {lead.name} {lead.isHot && <Flame size={14} className="text-red-500 animate-pulse" />}
                              </h4>
                              <p className="text-xs font-bold text-slate-500 mt-0.5">{lead.phone}</p>
                            </div>
                          </div>
                          <button className="text-slate-300 hover:text-slate-600 transition-colors p-1">
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded max-w-[140px] truncate">
                            {lead.intent}
                          </span>
                          <span className="bg-orange-50 text-[#F58220] text-[10px] font-bold px-2 py-1 rounded border border-orange-100 truncate">
                            {lead.source}
                          </span>
                          {lead.project && lead.project !== 'Khác' && (
                            <span className={`text-[9px] font-black uppercase px-1.5 py-1 rounded-sm border truncate max-w-[100px] ${lead.project === 'Học Thuật' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-pink-50 text-pink-600 border-pink-200'}`}>
                              {lead.project}
                            </span>
                          )}
                        </div>

                        {lead.note && (
                          <p className="mt-3 text-xs font-medium text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2">
                            {lead.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      ) : (
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-4 px-6 font-bold">Học sinh</th>
                <th className="py-4 px-6 font-bold">Liên hệ</th>
                <th className="py-4 px-6 font-bold">Trạng thái</th>
                <th className="py-4 px-6 font-bold">Khu vực</th>
                <th className="py-4 px-6 font-bold">Dự án</th>
                <th className="py-4 px-6 font-bold">Nguồn</th>
                <th className="py-4 px-6 font-bold">Sale Phụ Trách</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, idx) => {
                const colInfo = columns.find(c => c.id === lead.col) || columns[0];
                return (
                  <tr 
                    key={lead.id} 
                    onClick={() => setSelectedLead(lead)}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-black text-slate-600">
                          {lead.avatar}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            {lead.name} {lead.isHot && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1"><Flame size={10}/> HOT</span>}
                          </div>
                          <div className="text-[11px] font-bold text-slate-400 mt-0.5">{lead.intent}</div>
                          {lead.note && (
                            <div className="text-[10px] font-semibold text-yellow-600 mt-1 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block"></span>
                              <span className="truncate max-w-[200px]">{lead.note}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-bold text-[#005691]">{lead.phone}</div>
                      <div className="text-[11px] font-semibold text-slate-400">{lead.tiktok}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold" style={{ backgroundColor: `${colInfo.color}15`, color: colInfo.color }}>
                        <colInfo.icon size={14} strokeWidth={2.5}/>
                        {colInfo.title}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm font-semibold text-slate-600">
                      {lead.province || 'Chưa cập nhật'}
                    </td>
                    <td className="py-4 px-6">
                      {lead.project && lead.project !== 'Khác' ? (
                        <span className={`text-[10px] font-black uppercase px-2 py-1.5 rounded-sm border ${lead.project === 'Học Thuật' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-pink-50 text-pink-600 border-pink-200'}`}>
                          {lead.project}
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase px-2 py-1.5 rounded-sm border bg-slate-50 text-slate-500 border-slate-200">
                          Khác
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="bg-orange-50 text-[#F58220] text-[10px] font-bold px-2 py-1 rounded border border-orange-100">
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {lead.cskhStaff ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#005691] flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                            {lead.cskhStaff[0]?.toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-slate-700">{lead.cskhStaff}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-slate-400 italic">Chưa phân công</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* LEAD DETAIL DRAWER (SLIDE-OUT) */}
      <div className={`absolute top-0 right-0 w-[500px] h-full bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.1)] border-l border-slate-200 transition-transform duration-500 z-50 flex flex-col ${selectedLead ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedLead && (
          <>
            <div className="h-[88px] flex items-center justify-between px-6 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black text-white shadow-md ${selectedLead.isHot ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-slate-300'}`}>
                  {selectedLead.avatar}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">{selectedLead.name}</h2>
                  <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-2">
                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px]">{selectedLead.tiktok}</span>
                    {selectedLead.phone}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedLead(null)} className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-red-100 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Form Cập nhật Phân loại & Thông tin */}
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                  <Edit3 size={16} className="text-[#005691]" /> THÔNG TIN LIÊN HỆ & HỒ SƠ
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Nhóm Thông tin liên hệ cơ bản */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Tên thật (Full Name)</label>
                    <input type="text" value={selectedLead.name || ""} onChange={e => setSelectedLead({...selectedLead, name: e.target.value})} placeholder="VD: Nguyễn Văn A" className="w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220] outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Số Điện Thoại</label>
                    <input type="text" value={selectedLead.phone || ""} onChange={e => setSelectedLead({...selectedLead, phone: e.target.value})} placeholder="09xxxx..." className="w-full text-sm font-bold text-[#F58220] bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220] outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Tài khoản TikTok</label>
                    <input type="text" value={selectedLead.tiktok || ""} readOnly className="w-full text-sm font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 outline-none cursor-not-allowed" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Email / Gmail</label>
                    <input type="email" placeholder="email@example.com" className="w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220] outline-none" />
                  </div>

                  {/* Vạch kẻ phân cách */}
                  <div className="col-span-2 my-1 border-b border-slate-100 border-dashed"></div>

                  {/* Nhóm Thông tin Trường học & Nhu cầu */}
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Tỉnh / Thành phố</label>
                    <select value={selectedLead.province || ""} onChange={e => setSelectedLead({...selectedLead, province: e.target.value})} className="w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:border-[#F58220] outline-none appearance-none cursor-pointer">
                      <option value="">Chọn khu vực...</option>
                      {[
                        "Tuyên Quang (sáp nhập Hà Giang – Tuyên Quang)",
                        "Lào Cai (sáp nhập Yên Bái – Lào Cai)",
                        "Thái Nguyên (sáp nhập Bắc Kạn – Thái Nguyên)",
                        "Phú Thọ (sáp nhập Vĩnh Phúc – Hòa Bình – Phú Thọ)",
                        "Bắc Ninh (sáp nhập Bắc Giang – Bắc Ninh)",
                        "Hưng Yên (sáp nhập Thái Bình – Hưng Yên)",
                        "Hải Phòng (sáp nhập Hải Dương – Hải Phòng)",
                        "Ninh Bình (sáp nhập Hà Nam – Nam Định – Ninh Bình)",
                        "Quảng Trị (sáp nhập Quảng Bình – Quảng Trị)",
                        "Đà Nẵng (sáp nhập Quảng Nam – Đà Nẵng)",
                        "Quảng Ngãi (sáp nhập Kon Tum – Quảng Ngãi)",
                        "Gia Lai (sáp nhập Bình Định – Gia Lai)",
                        "Khánh Hòa (sáp nhập Ninh Thuận – Khánh Hòa)",
                        "Điện Biên",
                        "TP. Hà Nội",
                        "Hà Tĩnh",
                        "Lạng Sơn",
                        "Lai Châu",
                        "Nghệ An",
                        "Quảng Ninh",
                        "Sơn La",
                        "Thanh Hóa",
                        "Cao Bằng",
                        "TP. Huế",
                        "Lâm Đồng (sáp nhập Đắk Nông – Bình Thuận – Lâm Đồng)",
                        "Đắk Lắk (sáp nhập Phú Yên – Đắk Lắk)",
                        "TP.HCM (sáp nhập Bà Rịa – Vũng Tàu – Bình Dương – TP.HCM)",
                        "Đồng Nai (sáp nhập Bình Phước – Đồng Nai)",
                        "Tây Ninh (sáp nhập Long An – Tây Ninh)",
                        "Cần Thơ (sáp nhập Sóc Trăng – Hậu Giang – Cần Thơ)",
                        "Vĩnh Long (sáp nhập Bến Tre – Trà Vinh – Vĩnh Long)",
                        "Đồng Tháp (sáp nhập Tiền Giang – Đồng Tháp)",
                        "Cà Mau (sáp nhập Bạc Liêu – Cà Mau)",
                        "An Giang (sáp nhập Kiên Giang – An Giang)"
                      ].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Trường THPT</label>
                    <input type="text" value={selectedLead.highSchool || ""} onChange={e => setSelectedLead({...selectedLead, highSchool: e.target.value})} placeholder="Nhập tên trường..." className="w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:border-[#F58220] outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Lớp / Năm sinh</label>
                    <input type="text" value={selectedLead.grade || ""} onChange={e => setSelectedLead({...selectedLead, grade: e.target.value})} placeholder="Lớp 12..." className="w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:border-[#F58220] outline-none" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                      Ngành quan tâm nhất <span className="bg-blue-100 text-[#005691] px-1.5 py-0.5 rounded text-[9px]">AI Gợi ý</span>
                    </label>
                    <div className="relative">
                      <select 
                        value={selectedLead.intent || ""} 
                        onChange={e => setSelectedLead({...selectedLead, intent: e.target.value})}
                        className="w-full text-sm font-bold text-[#005691] bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 outline-none cursor-pointer appearance-none pr-8"
                      >
                        <option value="">-- Chọn ngành quan tâm --</option>
                        
                        <optgroup label="Ngành Công nghệ thông tin">
                          <option value="Công nghệ thông tin">Công nghệ thông tin</option>
                          <option value="Ngành Kỹ thuật phần mềm">Kỹ thuật phần mềm</option>
                          <option value="Trí tuệ nhân tạo">Trí tuệ nhân tạo</option>
                          <option value="Khoa học dữ liệu ứng dụng">Khoa học dữ liệu ứng dụng</option>
                          <option value="An toàn thông tin">An toàn thông tin</option>
                          <option value="Thiết kế vi mạch bán dẫn">Thiết kế vi mạch bán dẫn</option>
                          <option value="Công nghệ ô tô số">Công nghệ ô tô số</option>
                          <option value="Hệ thống thông tin">Hệ thống thông tin</option>
                          <option value="Ngành Thiết kế đồ họa">Thiết kế đồ họa và mỹ thuật số</option>
                          <option value="Robot và Trí tuệ nhân tạo">Robot và Trí tuệ nhân tạo (UAV & Humanoid)</option>
                        </optgroup>

                        <optgroup label="Ngành Công nghệ truyền thông">
                          <option value="Ngành Truyền thông đa phương tiện">Truyền thông đa phương tiện</option>
                          <option value="Quan hệ công chúng">Quan hệ công chúng</option>
                          <option value="Truyền thông Marketing tích hợp">Truyền thông Marketing tích hợp</option>
                          <option value="Truyền thông thương hiệu">Truyền thông thương hiệu</option>
                        </optgroup>

                        <optgroup label="Khối Ngành Ngôn ngữ">
                          <option value="Ngôn ngữ Anh">Ngôn ngữ Anh</option>
                          <option value="Tiếng Anh thương mại">Tiếng Anh thương mại</option>
                          <option value="Ngôn ngữ Hàn Quốc">Ngôn ngữ Hàn Quốc</option>
                          <option value="Tiếng Hàn thương mại">Tiếng Hàn thương mại</option>
                          <option value="Ngôn ngữ Trung Quốc">Ngôn ngữ Trung Quốc</option>
                          <option value="Tiếng Trung thương mại">Tiếng Trung thương mại</option>
                        </optgroup>

                        <optgroup label="Ngành Quản trị kinh doanh">
                          <option value="Marketing">Marketing</option>
                          <option value="Kinh doanh quốc tế">Kinh doanh quốc tế</option>
                          <option value="Thương mại điện tử">Thương mại điện tử</option>
                          <option value="Ngành Quản trị kinh doanh">Quản trị kinh doanh</option>
                          <option value="Quản trị giải trí và sự kiện">Quản trị giải trí và sự kiện</option>
                          <option value="Quản trị khách sạn">Quản trị khách sạn</option>
                          <option value="Logistics và Quản lý chuỗi cung ứng toàn cầu">Logistics và Quản lý chuỗi cung ứng toàn cầu</option>
                          <option value="Công nghệ tài chính (Fintech)">Công nghệ tài chính (Fintech)</option>
                          <option value="Tài chính doanh nghiệp">Tài chính doanh nghiệp</option>
                        </optgroup>

                        <optgroup label="Ngành Khoa học máy tính & Luật">
                          <option value="Trí tuệ nhân tạo và Khoa học dữ liệu">Trí tuệ nhân tạo và Khoa học dữ liệu (KHMT)</option>
                          <option value="An ninh mạng và an toàn số">An ninh mạng và an toàn số (KHMT)</option>
                          <option value="Luật">Luật</option>
                          <option value="Luật kinh tế">Luật kinh tế</option>
                        </optgroup>
                        
                        <optgroup label="Nhu cầu khác">
                          <option value="Học phí & Học bổng 50%">Hỏi Học phí & Học bổng</option>
                          <option value="Ký túc xá Campus Q9">Hỏi Ký túc xá / Cơ sở vật chất</option>
                          <option value="OJT Thực tập doanh nghiệp">Hỏi Thực tập / Trải nghiệm</option>
                        </optgroup>

                      </select>
                      <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#005691] pointer-events-none rotate-90" />
                    </div>
                  </div>
                  <div className="space-y-1.5 col-span-2 relative">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Trạng thái Phễu (Kanban)</label>
                    <div 
                      onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
                      className="w-full flex items-center justify-between text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 cursor-pointer hover:border-[#005691] transition-colors"
                    >
                      {["LEAD MỚI", "ĐANG TƯ VẤN", "ĐANG CÂN NHẮC", "CHỐT ĐĂNG KÝ"][selectedLead.col] || "LEAD MỚI"}
                      <ChevronRight size={14} className={`text-slate-400 transition-transform ${activeDropdown === 'status' ? '-rotate-90' : 'rotate-90'}`} />
                    </div>
                    {activeDropdown === 'status' && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden py-1">
                          {["LEAD MỚI", "ĐANG TƯ VẤN", "ĐANG CÂN NHẮC", "CHỐT ĐĂNG KÝ"].map((status, idx) => (
                            <div 
                              key={status}
                              onClick={() => {
                                const statusMap = ['NEW', 'CONTACTED', 'CONSULTING', 'REGISTERED'];
                                setSelectedLead({ ...selectedLead, col: idx, status: statusMap[idx] }); 
                                setActiveDropdown(null); 
                              }}
                              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${selectedLead.col === idx ? 'bg-[#005691] text-white font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                              {status}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* CÁN BỘ CSKH */}
                  <div className="space-y-1.5 col-span-2 mt-2 relative">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Cán Bộ CSKH Phụ Trách</label>
                    <div 
                      onClick={() => setActiveDropdown(activeDropdown === 'staff' ? null : 'staff')}
                      className="w-full flex items-center justify-between text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 cursor-pointer hover:border-[#005691] transition-colors"
                    >
                      {selectedLead.cskhStaff || "-- Chưa phân công --"}
                      <ChevronRight size={14} className={`text-slate-400 transition-transform ${activeDropdown === 'staff' ? '-rotate-90' : 'rotate-90'}`} />
                    </div>
                    {activeDropdown === 'staff' && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden py-1">
                          {["-- Chưa phân công --", "Bảo My", "Quang Lâm", "Ví dụ 1", "Ví dụ 2"].map((staff) => {
                            const val = staff === "-- Chưa phân công --" ? "" : staff;
                            return (
                              <div 
                                key={staff}
                                onClick={() => { setSelectedLead({ ...selectedLead, cskhStaff: val }); setActiveDropdown(null); }}
                                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${selectedLead.cskhStaff === val ? 'bg-[#005691] text-white font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                              >
                                {staff}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* NOTE / GHI CHÚ */}
                  <div className="space-y-1.5 col-span-2 mt-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Ghi chú (Note)</label>
                    <textarea 
                      value={selectedLead.note || ""}
                      onChange={e => setSelectedLead({...selectedLead, note: e.target.value})}
                      rows={3}
                      placeholder="Ghi chú về học sinh (hẹn gọi lại, quan tâm đặc biệt...)"
                      className="w-full text-sm font-semibold text-slate-800 bg-yellow-50/50 border border-yellow-200 rounded-lg px-3 py-2 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none resize-none placeholder:text-slate-400"
                    />
                  </div>

                </div>
              </div>

              {/* Lịch sử Tương tác (Comment & Minigame) */}
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                  <MessageSquare size={16} className="text-[#F58220]" /> LỊCH SỬ TƯƠNG TÁC LIVESTREAM
                </h3>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-4">
                  {selectedLead.history?.length > 0 ? selectedLead.history.map((h: any, i: number) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center mt-1">
                        <div className={`w-2.5 h-2.5 rounded-full ${h.type.includes('Đúng') ? 'bg-green-500' : 'bg-[#F58220]'}`} />
                        {i !== selectedLead.history.length -1 && <div className="w-[1.5px] h-8 bg-slate-200 my-1" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-0.5">{h.time} <span className="ml-2 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] text-slate-500">{h.type}</span></p>
                        <p className="text-sm font-semibold text-slate-800 bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">{h.text}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-400 font-bold italic text-center py-4">Chưa có lịch sử comment.</p>
                  )}
                </div>
              </div>

              {/* Quản lý Quà Tặng (Xuất Kho) */}
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                  <Package size={16} className="text-[#00A859]" /> QUÀ TẶNG & XUẤT KHO
                </h3>
                
                {/* Lịch sử và Tiến độ gói quà */}
                {orders.filter(o => o.recipient === selectedLead.name && (o.phone === selectedLead.phone || o.phone === 'Chưa cập nhật')).length > 0 && (
                  <div className="mb-4 space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Tiến độ giao quà</label>
                    {orders.filter(o => o.recipient === selectedLead.name && (o.phone === selectedLead.phone || o.phone === 'Chưa cập nhật')).map((o, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#005691]">{o.gift}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${o.status === 'Đơn vị đang vận chuyển' ? 'bg-orange-100 text-orange-600' : o.status === 'Hoàn tất' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                            {o.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex justify-between">
                          <span>Mã đơn: <strong className="text-slate-700">{o.id}</strong></span>
                          <span>{o.date}</span>
                        </div>
                        {o.trackingInfo && (
                          <div className="text-xs text-slate-500 mt-1">Vận đơn: <strong className="text-[#F58220]">{o.trackingInfo}</strong></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-green-50/50 border border-green-100 rounded-xl p-4">
                  <div className="space-y-1.5 mb-3 relative">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Chọn phần quà phát cho khách</label>
                    <div 
                      onClick={() => setActiveDropdown(activeDropdown === 'gift' ? null : 'gift')}
                      className="w-full flex items-center justify-between text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 cursor-pointer hover:border-[#005691] transition-colors"
                    >
                      {selectedLead.selectedGiftLabel || "-- Chọn quà từ Kho --"}
                      <ChevronRight size={14} className={`text-slate-400 transition-transform ${activeDropdown === 'gift' ? '-rotate-90' : 'rotate-90'}`} />
                    </div>
                    {activeDropdown === 'gift' && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden py-1">
                          <div 
                            onClick={() => { setSelectedLead({ ...selectedLead, selectedGift: "", selectedGiftLabel: "" }); setActiveDropdown(null); }}
                            className={`px-3 py-2 text-sm transition-colors cursor-pointer ${!selectedLead.selectedGift ? 'bg-[#005691] text-white font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                          >
                            -- Chọn quà từ Kho --
                          </div>
                          {gifts.map((gift) => {
                            const disabled = gift.stock <= 0;
                            const label = `${gift.name} (${gift.stock > 0 ? `Tồn: ${gift.stock}` : 'Hết hàng'})`;
                            return (
                              <div 
                                key={gift.id}
                                onClick={() => {
                                  if (!disabled) {
                                    setSelectedLead({ ...selectedLead, selectedGift: gift.id, selectedGiftLabel: label, _rawGiftName: gift.name });
                                    setActiveDropdown(null);
                                  }
                                }}
                                className={`px-3 py-2 text-sm transition-colors ${disabled ? 'text-slate-400 bg-slate-50 cursor-not-allowed' : selectedLead.selectedGift === gift.id ? 'bg-[#005691] text-white font-bold cursor-pointer' : 'text-slate-700 hover:bg-slate-50 cursor-pointer'}`}
                              >
                                {label}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Địa chỉ nhận quà</label>
                    <textarea 
                      value={selectedLead.giftAddress || ""}
                      onChange={e => setSelectedLead({...selectedLead, giftAddress: e.target.value})}
                      rows={2} 
                      placeholder="Nhập địa chỉ nhà..." 
                      className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
                    />
                  </div>
                  <button 
                    disabled={isSubmitting}
                    onClick={async () => {
                      if (isSubmitting) return;
                      if (!selectedLead.selectedGift || !selectedLead.giftAddress) {
                        setToastMsg({
                          title: "Thiếu thông tin!",
                          desc: "Vui lòng chọn quà và nhập địa chỉ nhận quà trước khi chốt."
                        });
                        setTimeout(() => setToastMsg(null), 3000);
                        return;
                      }
                      setIsSubmitting(true);

                      try {
                        const nowTime = new Date();
                        const dateStr = `${nowTime.getDate() < 10 ? '0'+nowTime.getDate() : nowTime.getDate()}/${nowTime.getMonth()+1 < 10 ? '0'+(nowTime.getMonth()+1) : nowTime.getMonth()+1}/${nowTime.getFullYear()}`;
                        const timeString = `${nowTime.getHours() < 10 ? '0'+nowTime.getHours() : nowTime.getHours()}:${nowTime.getMinutes() < 10 ? '0'+nowTime.getMinutes() : nowTime.getMinutes()}`;
                        
                        try {
                          const newOrder = {
                          id: `DON-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                          recipientName: selectedLead.name,
                          phone: selectedLead.phone || 'Chưa cập nhật',
                          address: selectedLead.giftAddress,
                          gift: selectedLead._rawGiftName || 'Quà tặng',
                          status: 'UNPACKED',
                        };
                        
                        // Gọi API tạo đơn
                        const createdRes = await api.post('/order', newOrder);
                        
                        // Format dữ liệu local để hiển thị liền luôn trên UI (không cần reload)
                        const displayOrder = {
                          id: newOrder.id,
                          recipient: selectedLead.name,
                          phone: selectedLead.phone || 'Chưa cập nhật',
                          gift: newOrder.gift,
                          status: 'Chưa đóng gói',
                          date: `${timeString} - ${dateStr}`
                        };
                        setOrders((prev) => [displayOrder, ...prev]);

                        // Trừ kho quà
                        if (selectedLead.selectedGift) {
                          const giftToUpdate = gifts.find((g: any) => String(g.id) === String(selectedLead.selectedGift));
                          if (giftToUpdate && giftToUpdate.stock > 0) {
                            await api.patch(`/gift/${giftToUpdate.id}`, { stock: giftToUpdate.stock - 1 });
                            setGifts((prev: any[]) => prev.map((g: any) => g.id === giftToUpdate.id ? { ...g, stock: g.stock - 1 } : g));
                          }
                        }

                        // Ghi lịch sử vào LeadHistory
                        await api.post(`/lead/${selectedLead.id}/history`, { action: 'NOTE', note: `Đã lên đơn gói quà: ${selectedLead._rawGiftName}\nTới địa chỉ: ${selectedLead.giftAddress}` }).catch(() => {});

                        
                        const updatedLead = {
                          ...selectedLead, 
                          selectedGift: "", 
                          selectedGiftLabel: "", 
                          giftAddress: "",
                        };
                        
                        setLeads(leads.map(l => l.id === selectedLead.id ? updatedLead : l));
                        setSelectedLead(updatedLead);
                        
                        setToastMsg({
                          title: "🎉 Đã chốt đơn thành công!",
                          desc: `📦 Quà: ${selectedLead._rawGiftName}\n📍 Tới: ${selectedLead.name}`
                        });
                        setTimeout(() => setToastMsg(null), 4000);
                      } catch (e) {
                        console.error(e);
                        alert("Có lỗi xảy ra khi tạo đơn hàng!");
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-xs font-bold text-white transition-colors"
                  >
                    <CheckCircle2 size={14} /> Chốt gói quà & Trừ Kho
                  </button>
                </div>
              </div>

            </div>
            
            <div className="p-6 border-t border-slate-200 bg-white flex justify-between gap-3 shrink-0">
              <button 
                onClick={() => setLeadToDelete(selectedLead)}
                className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                Xóa Lead
              </button>
              
              <div className="flex gap-3">
                <button onClick={() => setSelectedLead(null)} className="px-5 py-2.5 bg-white text-slate-600 border border-slate-300 hover:bg-slate-100 font-bold rounded-xl transition-colors">
                  Hủy bỏ
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const payload = {
                        intent: selectedLead.intent,
                        status: selectedLead.status || 'NEW',
                        leadScore: selectedLead.score ?? 50,
                        source: selectedLead.source,
                        assignedCskhId: selectedLead.cskhStaffId || undefined,
                      };
                      await api.patch(`/lead/${selectedLead.id}`, payload);
                      const updatedLeads = leads.map(l => l.id === selectedLead.id ? selectedLead : l);
                      setLeads(updatedLeads);
                      setSelectedLead(null);
                    } catch(e) {
                      alert("Lỗi khi lưu!");
                    }
                  }}
                  className="px-5 py-2.5 bg-[#005691] text-white hover:bg-[#004a7c] font-bold rounded-xl flex items-center gap-2 shadow-md shadow-blue-900/20 transition-all hover:-translate-y-0.5"
                >
                  <Save size={18} /> Lưu thông tin
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Backdrop */}
      {selectedLead && (
        <div onClick={() => setSelectedLead(null)} className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-40 animate-in fade-in cursor-pointer"></div>
      )}

      {/* MODAL THÊM LEAD */}
      {showAddLead && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in">
          <div className="bg-white w-[500px] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-[#005691] text-white flex justify-between items-center shrink-0">
              <h2 className="font-black text-lg">Thêm Lead Mới</h2>
              <button onClick={() => setShowAddLead(false)} className="text-white/70 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Họ và tên *</label>
                <input type="text" value={newLeadForm.name} onChange={e => setNewLeadForm({...newLeadForm, name: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220] outline-none" placeholder="Nguyễn Văn A" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Số điện thoại</label>
                  <input type="text" value={newLeadForm.phone} onChange={e => setNewLeadForm({...newLeadForm, phone: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-[#F58220] outline-none" placeholder="0901234567" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">TikTok ID</label>
                  <input type="text" value={newLeadForm.tiktok} onChange={e => setNewLeadForm({...newLeadForm, tiktok: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-[#F58220] outline-none" placeholder="@tiktok_id" />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tỉnh/Thành</label>
                  <select value={newLeadForm.province} onChange={e => setNewLeadForm({...newLeadForm, province: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-[#F58220] outline-none bg-white">
                    <option value="">Chọn khu vực...</option>
                    {[
                      "Tuyên Quang (sáp nhập Hà Giang – Tuyên Quang)",
                      "Lào Cai (sáp nhập Yên Bái – Lào Cai)",
                      "Thái Nguyên (sáp nhập Bắc Kạn – Thái Nguyên)",
                      "Phú Thọ (sáp nhập Vĩnh Phúc – Hòa Bình – Phú Thọ)",
                      "Bắc Ninh (sáp nhập Bắc Giang – Bắc Ninh)",
                      "Hưng Yên (sáp nhập Thái Bình – Hưng Yên)",
                      "Hải Phòng (sáp nhập Hải Dương – Hải Phòng)",
                      "Ninh Bình (sáp nhập Hà Nam – Nam Định – Ninh Bình)",
                      "Quảng Trị (sáp nhập Quảng Bình – Quảng Trị)",
                      "Đà Nẵng (sáp nhập Quảng Nam – Đà Nẵng)",
                      "Quảng Ngãi (sáp nhập Kon Tum – Quảng Ngãi)",
                      "Gia Lai (sáp nhập Bình Định – Gia Lai)",
                      "Khánh Hòa (sáp nhập Ninh Thuận – Khánh Hòa)",
                      "Điện Biên",
                      "TP. Hà Nội",
                      "Hà Tĩnh",
                      "Lạng Sơn",
                      "Lai Châu",
                      "Nghệ An",
                      "Quảng Ninh",
                      "Sơn La",
                      "Thanh Hóa",
                      "Cao Bằng",
                      "TP. Huế",
                      "Lâm Đồng (sáp nhập Đắk Nông – Bình Thuận – Lâm Đồng)",
                      "Đắk Lắk (sáp nhập Phú Yên – Đắk Lắk)",
                      "TP.HCM (sáp nhập Bà Rịa – Vũng Tàu – Bình Dương – TP.HCM)",
                      "Đồng Nai (sáp nhập Bình Phước – Đồng Nai)",
                      "Tây Ninh (sáp nhập Long An – Tây Ninh)",
                      "Cần Thơ (sáp nhập Sóc Trăng – Hậu Giang – Cần Thơ)",
                      "Vĩnh Long (sáp nhập Bến Tre – Trà Vinh – Vĩnh Long)",
                      "Đồng Tháp (sáp nhập Tiền Giang – Đồng Tháp)",
                      "Cà Mau (sáp nhập Bạc Liêu – Cà Mau)",
                      "An Giang (sáp nhập Kiên Giang – An Giang)"
                    ].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Trường THPT</label>
                  <input type="text" value={newLeadForm.highSchool} onChange={e => setNewLeadForm({...newLeadForm, highSchool: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-[#F58220] outline-none" placeholder="THPT Trấn Biên..." />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Lớp / Năm sinh</label>
                  <input type="text" value={newLeadForm.grade} onChange={e => setNewLeadForm({...newLeadForm, grade: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-[#F58220] outline-none" placeholder="Lớp 12 (2k6)..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Dự án</label>
                  <select value={newLeadForm.project} onChange={e => setNewLeadForm({...newLeadForm, project: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-[#F58220] outline-none bg-white">
                    <option value="Khác">Khác</option>
                    <option value="Học Thuật">Học Thuật</option>
                    <option value="Uống Gì CHƯA">Uống Gì CHƯA</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Ngành học quan tâm (Nhu cầu)</label>
                <select 
                  value={newLeadForm.intent} 
                  onChange={e => setNewLeadForm({...newLeadForm, intent: e.target.value})} 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-[#F58220] outline-none bg-white"
                >
                  <option value="">-- Chọn ngành quan tâm --</option>
                  
                  <optgroup label="Ngành Công nghệ thông tin">
                    <option value="Công nghệ thông tin">Công nghệ thông tin</option>
                    <option value="Ngành Kỹ thuật phần mềm">Kỹ thuật phần mềm</option>
                    <option value="Trí tuệ nhân tạo">Trí tuệ nhân tạo</option>
                    <option value="Khoa học dữ liệu ứng dụng">Khoa học dữ liệu ứng dụng</option>
                    <option value="An toàn thông tin">An toàn thông tin</option>
                    <option value="Thiết kế vi mạch bán dẫn">Thiết kế vi mạch bán dẫn</option>
                    <option value="Công nghệ ô tô số">Công nghệ ô tô số</option>
                    <option value="Hệ thống thông tin">Hệ thống thông tin</option>
                    <option value="Ngành Thiết kế đồ họa">Thiết kế đồ họa và mỹ thuật số</option>
                    <option value="Robot và Trí tuệ nhân tạo">Robot và Trí tuệ nhân tạo (UAV & Humanoid)</option>
                  </optgroup>

                  <optgroup label="Ngành Công nghệ truyền thông">
                    <option value="Ngành Truyền thông đa phương tiện">Truyền thông đa phương tiện</option>
                    <option value="Quan hệ công chúng">Quan hệ công chúng</option>
                    <option value="Truyền thông Marketing tích hợp">Truyền thông Marketing tích hợp</option>
                    <option value="Truyền thông thương hiệu">Truyền thông thương hiệu</option>
                  </optgroup>

                  <optgroup label="Khối Ngành Ngôn ngữ">
                    <option value="Ngôn ngữ Anh">Ngôn ngữ Anh</option>
                    <option value="Tiếng Anh thương mại">Tiếng Anh thương mại</option>
                    <option value="Ngôn ngữ Hàn Quốc">Ngôn ngữ Hàn Quốc</option>
                    <option value="Tiếng Hàn thương mại">Tiếng Hàn thương mại</option>
                    <option value="Ngôn ngữ Trung Quốc">Ngôn ngữ Trung Quốc</option>
                    <option value="Tiếng Trung thương mại">Tiếng Trung thương mại</option>
                  </optgroup>

                  <optgroup label="Ngành Quản trị kinh doanh">
                    <option value="Marketing">Marketing</option>
                    <option value="Kinh doanh quốc tế">Kinh doanh quốc tế</option>
                    <option value="Thương mại điện tử">Thương mại điện tử</option>
                    <option value="Ngành Quản trị kinh doanh">Quản trị kinh doanh</option>
                    <option value="Quản trị giải trí và sự kiện">Quản trị giải trí và sự kiện</option>
                    <option value="Quản trị khách sạn">Quản trị khách sạn</option>
                    <option value="Logistics và Quản lý chuỗi cung ứng toàn cầu">Logistics và Quản lý chuỗi cung ứng toàn cầu</option>
                    <option value="Công nghệ tài chính (Fintech)">Công nghệ tài chính (Fintech)</option>
                    <option value="Tài chính doanh nghiệp">Tài chính doanh nghiệp</option>
                  </optgroup>

                  <optgroup label="Ngành Khoa học máy tính & Luật">
                    <option value="Trí tuệ nhân tạo và Khoa học dữ liệu">Trí tuệ nhân tạo và Khoa học dữ liệu (KHMT)</option>
                    <option value="An ninh mạng và an toàn số">An ninh mạng và an toàn số (KHMT)</option>
                    <option value="Luật">Luật</option>
                    <option value="Luật kinh tế">Luật kinh tế</option>
                  </optgroup>
                  
                  <optgroup label="Nhu cầu khác">
                    <option value="Học phí & Học bổng 50%">Hỏi Học phí & Học bổng</option>
                    <option value="Ký túc xá Campus Q9">Hỏi Ký túc xá / Cơ sở vật chất</option>
                    <option value="OJT Thực tập doanh nghiệp">Hỏi Thực tập / Trải nghiệm</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Ghi chú</label>
                <textarea rows={2} value={newLeadForm.note} onChange={e => setNewLeadForm({...newLeadForm, note: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-[#F58220] outline-none" placeholder="Nội dung ghi chú..." />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 shrink-0">
              <button onClick={() => setShowAddLead(false)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors">Hủy</button>
              <button onClick={handleAddLead} className="px-4 py-2 bg-[#F58220] text-white rounded-xl font-bold text-sm hover:bg-[#d9731c] transition-colors flex items-center gap-2">
                <Save size={16} /> Lưu Lead Mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {leadToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Xóa học sinh này?</h3>
              <p className="text-sm text-slate-500">
                Bạn có chắc chắn muốn xóa <b>{leadToDelete.name}</b> khỏi hệ thống? Dữ liệu đã xóa không thể khôi phục lại.
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex gap-3 border-t border-slate-200">
              <button 
                onClick={() => setLeadToDelete(null)}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={async () => {
                  try {
                    await api.delete(`/lead/${leadToDelete.id}`);
                    setLeads(leads.filter(l => l.id !== leadToDelete.id));
                    setSelectedLead(null);
                    setLeadToDelete(null);
                    setToastMsg({ title: '✅ Đã xóa thành công', desc: `Đã xóa học sinh ${leadToDelete.name}`, type: 'success' });
                    setTimeout(() => setToastMsg(null), 3500);
                  } catch (e) {
                    setLeadToDelete(null);
                    setToastMsg({ title: '❌ Lỗi khi xóa', desc: 'Không thể xóa học sinh này', type: 'error' });
                    setTimeout(() => setToastMsg(null), 3500);
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[300] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`relative flex items-start gap-4 p-5 rounded-2xl shadow-2xl min-w-[340px] max-w-[420px] border-l-4 bg-white
            ${toastMsg.type === 'error' ? 'border-l-red-500' : toastMsg.type === 'success' ? 'border-l-emerald-500' : 'border-l-orange-500'}
          `} style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            {/* Icon */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 font-black
              ${toastMsg.type === 'error' ? 'bg-red-50 text-red-600' : toastMsg.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}
            `}>
              {toastMsg.type === 'error' ? '✕' : toastMsg.type === 'success' ? '✓' : '!'}
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-[15px] text-slate-900 mb-1">{toastMsg.title}</h4>
              {toastMsg.desc && <p className="text-[13px] text-slate-500 leading-relaxed whitespace-pre-line">{toastMsg.desc}</p>}
            </div>
            {/* Close */}
            <button onClick={() => setToastMsg(null)} className="text-slate-300 hover:text-slate-600 transition-colors shrink-0 mt-0.5">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}


