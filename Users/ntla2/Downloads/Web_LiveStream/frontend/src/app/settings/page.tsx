"use client"
import React, { useState } from 'react';
import { 
  User, ShieldCheck, Link as LinkIcon, Key, Save, Bell, 
  Smartphone, Building2, Lock, Camera, CheckCircle2, 
  X, Plus, CheckSquare, Square, Download, Upload, Shield
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'ROLES' | 'INTEGRATION' | 'SUPPORT'>('PROFILE');
  const [saved, setSaved] = useState(false);
  const [toastMsg, setToastMsg] = useState<{title: string, desc?: string, type?: 'success'|'error'} | null>(null);

  const [roles, setRoles] = useState([
    { id: 1, name: 'Admin Hệ thống', desc: 'Toàn quyền truy cập và cài đặt hệ thống', users: 2, color: 'bg-red-50 text-red-600 border-red-200', permissions: ['all'] },
    { id: 2, name: 'Quản lý (Manager)', desc: 'Xem báo cáo, theo dõi tiến độ và phân ca trực', users: 3, color: 'bg-blue-50 text-blue-600 border-blue-200', permissions: ['dash_view', 'crm_view', 'inv_view', 'live_view', 'task_view', 'sch_view', 'sch_assign', 'staff_view', 'analytic_view', 'analytic_export'] },
    { id: 3, name: 'Tổ Chức Sản Xuất', desc: 'Lên kế hoạch kịch bản, chia việc và kiểm soát luồng LIVE', users: 2, color: 'bg-indigo-50 text-indigo-600 border-indigo-200', permissions: ['live_view', 'live_script', 'task_view', 'task_edit', 'sch_view'] },
    { id: 4, name: 'Biên Tập', desc: 'Biên soạn nội dung kịch bản và mini game', users: 4, color: 'bg-purple-50 text-purple-600 border-purple-200', permissions: ['live_view', 'live_script', 'task_view'] },
    { id: 5, name: 'Kỹ Thuật', desc: 'Vận hành phòng máy điều khiển LIVE', users: 3, color: 'bg-slate-100 text-slate-700 border-slate-300', permissions: ['live_view', 'live_control', 'task_view'] },
    { id: 6, name: 'VJ / Host Livestream', desc: 'Xem lịch trực và kịch bản cá nhân', users: 5, color: 'bg-pink-50 text-pink-600 border-pink-200', permissions: ['live_view', 'sch_view', 'task_view'] },
    { id: 7, name: 'CSKH (Trực Comment)', desc: 'Quản lý danh sách học sinh và gọi điện chốt đơn', users: 15, color: 'bg-green-50 text-green-600 border-green-200', permissions: ['crm_view', 'crm_edit', 'task_view'] },
    { id: 8, name: 'Thủ Kho', desc: 'Nhập xuất kho quà và đóng gói đơn gửi đi', users: 2, color: 'bg-orange-50 text-orange-600 border-orange-200', permissions: ['inv_view', 'inv_fulfill', 'inv_edit', 'task_view'] },
  ]);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [tiktokUsername, setTiktokUsername] = useState('fptu.hcm');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionLogs, setConnectionLogs] = useState<string[]>([
    "> System: Sẵn sàng kết nối TikTok LIVE API...",
    "> Nhập ID kênh TikTok đang phát LIVE và nhấn Test Kết Nối."
  ]);

  const handleTestConnection = async () => {
    if (!tiktokUsername.trim()) {
      setToastMsg({ title: "Thiếu thông tin", desc: "Vui lòng nhập ID kênh TikTok!", type: 'error' });
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }
    
    setIsConnecting(true);
    setConnectionStatus('idle');
    setConnectionLogs([
      `> Đang khởi tạo TikTokLiveConnector...`,
      `> Connecting to room @${tiktokUsername}...`,
      `> Gửi yêu cầu WebSocket tới API server...`
    ]);

    try {
      const res = await fetch('/api/tiktok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: tiktokUsername })
      });
      const data = await res.json();
      
      if (data.success) {
        setConnectionStatus('success');
        setConnectionLogs(prev => [
          ...prev,
          `> [SUCCESS] WebSocket Connected!`,
          `> Host: ${data.roomInfo.hostName}`,
          `> Room Title: ${data.roomInfo.roomTitle}`,
          `> Viewers: ${data.roomInfo.viewerCount.toLocaleString()}`,
          `> API Real-time events ready (Giai đoạn 3).`
        ]);
      } else {
        setConnectionStatus('error');
        setConnectionLogs(prev => [
          ...prev,
          `> [ERROR] Connection failed.`,
          `> ${data.message}`,
          `> Hướng dẫn: Đảm bảo kênh đang phát LIVE thật trên TikTok.`
        ]);
      }
    } catch (e: any) {
      setConnectionStatus('error');
      setConnectionLogs(prev => [
        ...prev,
        `> [ERROR] Network Error. Server không phản hồi.`,
        `> ${e.message}`
      ]);
    }
    setIsConnecting(false);
  };

  const handleExportBackup = () => {
    const data = {
      leads: localStorage.getItem('cskh_leads'),
      gifts: localStorage.getItem('inventory_gifts'),
      orders: localStorage.getItem('inventory_orders')
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const now = new Date();
    const dateStr = `${now.getDate()}-${now.getMonth()+1}-${now.getFullYear()}_${now.getHours()}h${now.getMinutes()}`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `FPTU_Live_Backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setToastMsg({ title: "Sao lưu thành công", desc: `Đã tải xuống file: FPTU_Live_Backup_${dateStr}.json`, type: 'success' });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        if (data.leads !== undefined && data.gifts !== undefined) {
          if (confirm('CẢNH BÁO: Hành động này sẽ ghi đè toàn bộ dữ liệu hiện tại bằng dữ liệu từ file backup. Bạn có chắc chắn muốn tiếp tục?')) {
            if (data.leads) localStorage.setItem('cskh_leads', data.leads);
            if (data.gifts) localStorage.setItem('inventory_gifts', data.gifts);
            if (data.orders) localStorage.setItem('inventory_orders', data.orders);
            
            // Dispatch event to sync other tabs
            window.dispatchEvent(new Event('storage'));
            setToastMsg({ title: "Phục hồi thành công", desc: "Dữ liệu đã được khôi phục. Đang tải lại trang...", type: 'success' });
            setTimeout(() => window.location.reload(), 1500);
          }
        } else {
          setToastMsg({ title: "Lỗi phục hồi", desc: "File backup không hợp lệ hoặc bị lỗi định dạng!", type: 'error' });
          setTimeout(() => setToastMsg(null), 3000);
        }
      } catch (error) {
        setToastMsg({ title: "Lỗi đọc file", desc: "Đã xảy ra lỗi khi đọc file JSON!", type: 'error' });
        setTimeout(() => setToastMsg(null), 3000);
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const permissionModules = [
    { key: 'dashboard', name: 'Trang chủ (Dashboard)', perms: [{ id: 'dash_view', label: 'Xem tổng quan chiến dịch' }] },
    { key: 'crm', name: 'DATA LIVESTREAM (CRM)', perms: [{ id: 'crm_view', label: 'Xem danh sách học sinh' }, { id: 'crm_edit', label: 'Thêm/Sửa/Xóa Lead' }] },
    { key: 'inventory', name: 'Kho Quà tặng', perms: [{ id: 'inv_view', label: 'Xem số lượng tồn kho' }, { id: 'inv_fulfill', label: 'Cập nhật trạng thái giao quà' }, { id: 'inv_edit', label: 'Nhập/Xuất kho quà mới' }] },
    { key: 'live', name: 'Phiên LIVE & Biên tập', perms: [{ id: 'live_view', label: 'Xem danh sách phiên LIVE' }, { id: 'live_script', label: 'Tạo phiên & Soạn kịch bản' }, { id: 'live_control', label: 'Vào phòng điều khiển LIVE' }] },
    { key: 'taskly', name: 'Quản lý Công việc (Taskly)', perms: [{ id: 'task_view', label: 'Xem công việc' }, { id: 'task_edit', label: 'Giao việc & Cập nhật tiến độ' }] },
    { key: 'schedule', name: 'Lịch trực & Chấm công', perms: [{ id: 'sch_view', label: 'Xem lịch trực cá nhân' }, { id: 'sch_assign', label: 'Phân công ca trực' }, { id: 'sch_payroll', label: 'Xem Bảng lương & Xuất Excel' }] },
    { key: 'staff', name: 'Quản lý Nhân sự', perms: [{ id: 'staff_view', label: 'Xem danh sách nhân sự' }, { id: 'staff_edit', label: 'Thêm/Sửa/Xóa tài khoản nhân sự' }] },
    { key: 'analytics', name: 'Phân tích & Báo cáo', perms: [{ id: 'analytic_view', label: 'Xem báo cáo nâng cao' }, { id: 'analytic_export', label: 'Xuất dữ liệu thống kê' }] },
    { key: 'settings', name: 'Cài đặt Hệ thống', perms: [{ id: 'set_profile', label: 'Cập nhật hồ sơ cá nhân' }, { id: 'set_rbac', label: 'Cấu hình Quyền (RBAC)' }, { id: 'set_api', label: 'Cấu hình API & Backup' }] },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const togglePermission = (permId: string) => {
    if (!editingRole) return;
    if (editingRole.permissions.includes('all')) return; // Admin can't be toggled

    const newPerms = editingRole.permissions.includes(permId) 
      ? editingRole.permissions.filter((p: string) => p !== permId)
      : [...editingRole.permissions, permId];
    
    setEditingRole({ ...editingRole, permissions: newPerms });
  };

  const handleSaveRole = () => {
    if (!editingRole) return;
    if (roles.find(r => r.id === editingRole.id)) {
      setRoles(roles.map(r => r.id === editingRole.id ? editingRole : r));
    } else {
      setRoles([...roles, { ...editingRole, id: Date.now(), users: 0, color: 'bg-slate-100 text-slate-600 border-slate-200' }]);
    }
    setEditingRole(null);
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-50 font-sans relative overflow-x-hidden">
      
      {/* LEFT SIDEBAR - SETTINGS NAV */}
      <div className="w-full md:w-[280px] bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col z-10 shadow-sm shrink-0">
        <div className="h-[72px] md:h-[88px] px-6 flex flex-col justify-center border-b border-slate-100 shrink-0">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cài đặt</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Hệ thống & Tài khoản</p>
        </div>

        <div className="p-4 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('PROFILE')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-left ${activeTab === 'PROFILE' ? 'bg-[#005691] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <User size={18} /> Hồ sơ Quản trị viên
          </button>
          
          <button 
            onClick={() => setActiveTab('ROLES')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-left ${activeTab === 'ROLES' ? 'bg-[#005691] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <ShieldCheck size={18} /> Phân quyền Nhân sự
          </button>

          <button 
            onClick={() => setActiveTab('INTEGRATION')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-left ${activeTab === 'INTEGRATION' ? 'bg-[#005691] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <LinkIcon size={18} /> Kết nối API (TikTok)
          </button>
          
          <button 
            onClick={() => setActiveTab('SUPPORT')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-left ${activeTab === 'SUPPORT' ? 'bg-[#005691] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Shield size={18} /> Hỗ trợ Kỹ thuật & Backup
          </button>
        </div>
      </div>

      {/* RIGHT SIDE - CONTENT */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8 relative">
        <div className="max-w-4xl mx-auto pb-12">
          
          {/* HEADER ACTION */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-slate-900">
              {activeTab === 'PROFILE' && 'Cập nhật Hồ sơ Cá nhân'}
              {activeTab === 'ROLES' && 'Cấu hình Quyền truy cập (RBAC)'}
              {activeTab === 'INTEGRATION' && 'Tích hợp Nền tảng bên thứ ba'}
              {activeTab === 'SUPPORT' && 'Hỗ trợ Kỹ thuật & Sao lưu'}
            </h2>
            
            {(activeTab === 'PROFILE' || activeTab === 'ROLES') && (
              <button 
                onClick={handleSave}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all ${saved ? 'bg-green-500' : 'bg-[#F58220] hover:bg-[#e07010] hover:-translate-y-0.5'}`}
              >
                {saved ? <><CheckCircle2 size={16} /> Đã lưu</> : <><Save size={16} /> Lưu thay đổi</>}
              </button>
            )}
          </div>

          {/* CONTENT: PROFILE */}
          {activeTab === 'PROFILE' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
                <div className="relative group cursor-pointer">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#005691] to-[#00A859] flex items-center justify-center text-white text-3xl font-black shadow-lg">
                    AD
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera size={24} />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Ảnh đại diện</h3>
                  <p className="text-sm font-semibold text-slate-500 mt-1">Định dạng PNG, JPG hoặc GIF. Tối đa 5MB.</p>
                  <div className="flex gap-3 mt-3">
                    <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">Tải ảnh lên</button>
                    <button className="px-4 py-2 text-red-500 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors">Xóa ảnh</button>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4">
                  <User size={18} className="text-[#005691]" /> Thông tin cơ bản
                </h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Họ và Tên</label>
                    <input type="text" defaultValue="Admin System" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-[#005691]/20 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Chức vụ / Phòng ban</label>
                    <input type="text" defaultValue="Quản lý Vận hành LIVE" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-[#005691]/20 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Email (Đăng nhập)</label>
                    <input type="email" defaultValue="admin@fpt.edu.vn" disabled className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-500 cursor-not-allowed" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Số điện thoại</label>
                    <input type="text" defaultValue="0987.654.321" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-[#005691]/20 outline-none transition-all" />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4">
                    <Lock size={18} className="text-red-500" /> Đổi mật khẩu
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Mật khẩu hiện tại</label>
                      <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-[#005691]/20 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Mật khẩu mới</label>
                      <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-[#005691]/20 outline-none transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONTENT: INTEGRATION */}
          {activeTab === 'INTEGRATION' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-lg text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-[#F58220] rounded-full blur-[80px] opacity-20"></div>
                <div className="relative z-10 flex gap-6 items-center">
                  <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F58220] w-8 h-8">
                      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-black">Kết nối TikTok LIVE API</h3>
                    <p className="text-sm font-semibold text-slate-300 mt-2 max-w-lg leading-relaxed">
                      Cấu hình để hệ thống tự động bắt Comment, Mắt xem và Quà tặng thời gian thực. API này sẽ được kích hoạt ở Giai đoạn 3.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">TikTok Username (ID Kênh)</label>
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                      <input 
                        type="text" 
                        value={tiktokUsername}
                        onChange={e => setTiktokUsername(e.target.value)}
                        placeholder="fptu.hcm" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-[#F58220]/20 outline-none transition-all" 
                      />
                    </div>
                    <button 
                      onClick={handleTestConnection}
                      disabled={isConnecting}
                      className="px-6 py-3 bg-[#F58220] hover:bg-[#e07010] text-white font-bold rounded-xl transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-orange-900/20"
                    >
                      {isConnecting ? (
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Đang kết nối...</>
                      ) : "Test Kết Nối (LIVE)"}
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-slate-400 mt-2">Nhập đúng định dạng ID kênh đang phát LIVE (Ví dụ: fptu.hcm hoặc tiktokvietnam)</p>
                </div>

                <div className="space-y-2 pt-4">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center justify-between">
                    <span>Trạng thái kết nối WebSocket API</span>
                    <span className={`${connectionStatus === 'success' ? 'text-green-500' : connectionStatus === 'error' ? 'text-red-500' : 'text-yellow-500'} flex items-center gap-1`}>
                      <span className={`w-2 h-2 rounded-full ${connectionStatus === 'success' ? 'bg-green-500' : connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'} ${isConnecting ? 'animate-pulse' : ''}`}></span> 
                      {connectionStatus === 'success' ? 'Đã kết nối LIVE API' : connectionStatus === 'error' ? 'Lỗi kết nối' : 'Chưa kết nối'}
                    </span>
                  </label>
                  <div className="bg-slate-900 rounded-xl p-4 font-mono text-[11px] leading-relaxed text-green-400 overflow-x-auto border border-slate-800 shadow-inner">
                    {connectionLogs.map((log, i) => (
                      <div key={i} className={log.includes('[ERROR]') || log.includes('[WARNING]') ? 'text-red-400' : log.includes('[SUCCESS]') ? 'text-green-400' : 'text-slate-300'}>
                        {log}
                      </div>
                    ))}
                    {connectionLogs.length === 0 && (
                      <div className="text-slate-500">&gt; Nhập ID kênh TikTok đang LIVE và nhấn Test Kết Nối...</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                <h3 className="text-sm font-black text-[#005691] flex items-center gap-2 mb-3">
                  <CheckCircle2 size={16} /> Các bước chuẩn bị kết nối API
                </h3>
                <ul className="space-y-2 text-[13px] font-semibold text-slate-600 leading-relaxed">
                  <li className="flex gap-2"><span className="text-[#005691] font-black">1.</span> Bắt đầu một phiên <strong>LIVE</strong> công khai trên ứng dụng TikTok.</li>
                  <li className="flex gap-2"><span className="text-[#005691] font-black">2.</span> Nhập chính xác <strong>Username (ID kênh)</strong> đang phát Live (bỏ dấu @) vào ô phía trên.</li>
                  <li className="flex gap-2"><span className="text-[#005691] font-black">3.</span> Nhấn <strong>Test Kết Nối</strong>. Hệ thống sẽ kết nối ngầm qua WebSocket để lắng nghe luồng sự kiện.</li>
                  <li className="flex gap-2"><span className="text-[#005691] font-black">4.</span> <strong>Lưu ý:</strong> API chỉ có thể bắt dữ liệu khi phiên LIVE đang diễn ra. Nếu LIVE kết thúc, kết nối sẽ tự động ngắt.</li>
                  <li className="flex gap-2"><span className="text-[#005691] font-black">5.</span> Khi hoàn thiện ở Giai đoạn 3, toàn bộ Comment chốt đơn và Quà tặng sẽ tự động nhảy số bên tab <strong>DATA LIVESTREAM</strong>.</li>
                </ul>
              </div>
            </div>
          )}

          {/* CONTENT: SUPPORT */}
          {activeTab === 'SUPPORT' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-1">
                      <Download size={18} className="text-[#00A859]" /> Sao lưu Dữ liệu (Backup Local)
                    </h3>
                    <p className="text-sm font-semibold text-slate-500 max-w-xl">
                      Tải về tệp sao lưu toàn bộ dữ liệu (Học sinh CRM, Kho quà, Tiến độ đơn hàng) để phòng sự cố mất mát.
                    </p>
                  </div>
                  <button 
                    onClick={handleExportBackup}
                    className="px-6 py-3 bg-[#00A859] hover:bg-green-600 text-white font-bold rounded-xl transition-colors shadow-md shadow-green-900/20 flex items-center gap-2 shrink-0"
                  >
                    <Download size={18} /> Tải File Backup (.json)
                  </button>
                </div>
                
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-1">
                      <Upload size={18} className="text-blue-500" /> Phục hồi Dữ liệu (Restore)
                    </h3>
                    <p className="text-sm font-semibold text-slate-500 max-w-xl">
                      Tải lên tệp backup để khôi phục lại dữ liệu cũ. <span className="text-red-500 font-bold">Lưu ý: Dữ liệu hiện tại sẽ bị ghi đè!</span>
                    </p>
                  </div>
                  <div className="relative overflow-hidden group shrink-0">
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={handleImportBackup}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <button className="px-6 py-3 bg-blue-50 text-blue-600 border border-blue-200 group-hover:bg-blue-100 font-bold rounded-xl transition-colors flex items-center gap-2 relative z-0">
                      <Upload size={18} /> Chọn File Phục Hồi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONTENT: ROLES */}
          {activeTab === 'ROLES' && (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-black text-slate-900">Danh sách Phân quyền Nhóm</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1">Quản lý giới hạn truy cập cho từng chức vụ</p>
                </div>
                <button 
                  onClick={() => setEditingRole({ id: Date.now(), name: '', desc: '', permissions: [], users: 0, color: 'bg-slate-100 text-slate-600 border-slate-200' })}
                  className="px-4 py-2 bg-[#005691] text-white font-bold text-xs rounded-lg hover:bg-[#004a7c] flex items-center gap-2"
                >
                  <Plus size={14} /> Thêm vai trò mới
                </button>
              </div>

              <div className="space-y-4">
                {roles.map((role) => (
                  <div 
                    key={role.id} 
                    onClick={() => setEditingRole(role)}
                    className={`flex items-center justify-between p-4 border rounded-2xl hover:border-[#F58220] transition-colors cursor-pointer group ${editingRole?.id === role.id ? 'border-[#F58220] bg-orange-50/30' : 'border-slate-200'}`}
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-sm text-slate-900">{role.name}</h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${role.color}`}>{role.users} Tài khoản</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 mt-1">{role.desc}</p>
                    </div>
                    <button className="text-xs font-bold text-[#005691] opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                      Thiết lập quyền
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ROLE EDIT DRAWER */}
      <div className={`absolute top-0 right-0 w-[550px] h-full bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.1)] border-l border-slate-200 transition-transform duration-500 z-50 flex flex-col ${editingRole ? 'translate-x-0' : 'translate-x-full'}`}>
        {editingRole && (
          <>
            <div className="h-[88px] flex items-center justify-between px-6 border-b border-slate-100 bg-slate-50 shrink-0">
              <div>
                <h3 className="font-black text-lg text-slate-900">Thiết lập Vai trò</h3>
                <p className="text-xs font-bold text-slate-400">Cấu hình quyền truy cập (Permissions)</p>
              </div>
              <button 
                onClick={() => setEditingRole(null)}
                className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tên Vai trò</label>
                  <input 
                    type="text" 
                    value={editingRole.name}
                    disabled={editingRole.permissions.includes('all')}
                    onChange={e => setEditingRole({...editingRole, name: e.target.value})}
                    placeholder="VD: Chuyên viên Marketing"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-[#005691]/20 outline-none disabled:opacity-50" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Mô tả nhiệm vụ</label>
                  <input 
                    type="text" 
                    value={editingRole.desc}
                    disabled={editingRole.permissions.includes('all')}
                    onChange={e => setEditingRole({...editingRole, desc: e.target.value})}
                    placeholder="Giới hạn chức năng..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-[#005691]/20 outline-none disabled:opacity-50" 
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-black text-slate-900 mb-4">Danh sách Quyền (Permissions)</h4>
                
                {editingRole.permissions.includes('all') ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 font-bold text-sm flex items-center gap-2">
                    <ShieldCheck size={18} /> Vai trò Admin có toàn quyền truy cập hệ thống và không thể thay đổi.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {permissionModules.map(module => (
                      <div key={module.key} className="space-y-3">
                        <h5 className="text-xs font-bold text-[#F58220] uppercase bg-orange-50 px-3 py-1.5 rounded w-fit border border-orange-100">
                          {module.name}
                        </h5>
                        <div className="space-y-2">
                          {module.perms.map(perm => {
                            const isChecked = editingRole.permissions.includes(perm.id);
                            return (
                              <div 
                                key={perm.id} 
                                onClick={() => togglePermission(perm.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isChecked ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                              >
                                {isChecked ? <CheckSquare size={18} className="text-[#005691]" /> : <Square size={18} className="text-slate-300" />}
                                <span className={`text-sm font-bold ${isChecked ? 'text-[#005691]' : 'text-slate-600'}`}>{perm.label}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
              <button 
                onClick={() => setEditingRole(null)}
                className="flex-1 px-4 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-all text-sm"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSaveRole}
                className="flex-1 px-4 py-3 bg-[#F58220] text-white font-bold rounded-xl hover:bg-[#e07010] shadow-md transition-all text-sm"
              >
                Lưu phân quyền
              </button>
            </div>
          </>
        )}
      </div>

      {/* TOAST UI */}
      {toastMsg && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`bg-white border-l-4 rounded-xl shadow-xl flex flex-col p-4 min-w-[300px] 
            ${toastMsg.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {toastMsg.type === 'error' ? (
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <X size={16} className="text-red-500" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} className="text-green-500" />
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{toastMsg.title}</h4>
                  {toastMsg.desc && <p className="text-xs text-slate-500 font-semibold mt-0.5">{toastMsg.desc}</p>}
                </div>
              </div>
              <button 
                onClick={() => setToastMsg(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
