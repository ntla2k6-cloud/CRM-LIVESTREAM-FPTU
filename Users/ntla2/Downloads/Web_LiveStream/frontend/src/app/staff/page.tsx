"use client"
import React, { useState, useEffect } from 'react';
import {
  Users, Search, ShieldCheck, Headphones, Video, MessageCircle,
  CheckCircle2, Phone, Mail, Edit3, Save, X, RefreshCw, UserCheck,
  MonitorPlay, Settings2, Clapperboard, Lock, Plus, Clock, ChevronDown, Link2
} from "lucide-react";
import Link from 'next/link';

// ============================================================
// DỮ LIỆU VAI TRÒ (ROLES)
// ============================================================
const DEFAULT_ROLES = [
  { value: "GUEST",      label: "Chờ duyệt",              icon: Lock,           color: "bg-slate-100 text-slate-500 border-slate-300",     desc: "Mới đăng nhập, chưa được phân vị trí" },
  { value: "VJ_HOST",    label: "VJ / Host Livestream",    icon: Video,          color: "bg-orange-50 text-orange-700 border-orange-200",   desc: "Dẫn chương trình, điều khiển Live" },
  { value: "CSKH",       label: "CSKH (Trực Comment)",     icon: Headphones,     color: "bg-blue-50 text-blue-700 border-blue-200",         desc: "Xử lý comment, chốt Lead, gọi điện tư vấn" },
  { value: "BIEN_TAP",   label: "Biên Tập",                icon: Clapperboard,   color: "bg-yellow-50 text-yellow-700 border-yellow-200",   desc: "Soạn kịch bản, nội dung & câu hỏi Minigame" },
  { value: "KY_THUAT",   label: "Kỹ Thuật",               icon: Settings2,      color: "bg-teal-50 text-teal-700 border-teal-200",         desc: "Vận hành thiết bị, OBS, kết nối luồng Live" },
  { value: "SAN_XUAT",   label: "Tổ Chức Sản Xuất",       icon: MonitorPlay,    color: "bg-purple-50 text-purple-700 border-purple-200",   desc: "Lên kế hoạch, phân ca, điều phối ekip" },
  { value: "THU_KHO",    label: "Thủ Kho",                icon: CheckCircle2,   color: "bg-emerald-50 text-emerald-700 border-emerald-200",desc: "Quản lý kho quà, xuất/nhập kho" },
  { value: "MANAGER",    label: "Quản lý (Manager)",       icon: UserCheck,      color: "bg-indigo-50 text-indigo-700 border-indigo-200",   desc: "Xem toàn bộ dữ liệu, báo cáo, xuất Excel" },
  { value: "ADMIN",      label: "Admin Hệ thống",          icon: ShieldCheck,    color: "bg-red-50 text-red-700 border-red-200",            desc: "Toàn quyền: phân quyền, xóa, cấu hình" },
];

const PERMISSION_GROUPS = [
  {
    group: 'CRM / Học sinh', color: 'text-orange-500 bg-orange-50',
    items: [
      { id: 'crm.view',   label: 'Xem danh sách học sinh' },
      { id: 'crm.edit',   label: 'Thêm/Sửa/Xóa Lead học sinh' },
    ]
  },
  {
    group: 'Kho Quà Tặng', color: 'text-emerald-600 bg-emerald-50',
    items: [
      { id: 'inventory.view',   label: 'Xem số lượng tồn kho' },
      { id: 'inventory.update', label: 'Cập nhật trạng thái giao quà' },
    ]
  },
  {
    group: 'LIVE & Biên Tập', color: 'text-red-500 bg-red-50',
    items: [
      { id: 'live.view',          label: 'Xem màn hình điều khiển LIVE' },
      { id: 'live.script',        label: 'Soạn kịch bản & Câu hỏi' },
    ]
  },
  {
    group: 'Nhân Sự & Phân Ca', color: 'text-purple-500 bg-purple-50',
    items: [
      { id: 'staff.view',       label: 'Xem lịch trực (Cá nhân)' },
      { id: 'schedule.manage',  label: 'Phân công ca trực (Quản lý)' },
    ]
  },
];

const getRoleIcon = (role: string, size = 14) => {
  const found = DEFAULT_ROLES.find(r => r.value === role);
  if (!found) return <MessageCircle size={size} className="text-slate-400" />;
  const Icon = found.icon;
  return <Icon size={size} />;
};

export default function UnifiedStaffPage() {
  const [activeTab, setActiveTab] = useState<'STAFF' | 'RBAC'>('STAFF');

  // --- STAFF STATE ---
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  
  // --- RBAC STATE ---
  const [roles, setRoles] = useState(DEFAULT_ROLES.map(r => ({ ...r, permissions: r.value === 'ADMIN' ? ['*'] : [] })));
  const [editingRole, setEditingRole] = useState<any | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('ADMIN');

  useEffect(() => { 
    fetchUsers();
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(s => { if (s?.user?.role) setCurrentUserRole(s.user.role); })
      .catch(() => {});
  }, []);

  const isAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'MANAGER';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
        if (data.length > 0 && !selectedUser) {
          setSelectedUser(data[0]);
          setEditForm(data[0]);
        }
      } else {
        console.error('API Error:', data);
        setUsers([]);
      }
    } catch (e) {
      console.error(e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setEditForm({ ...user });
    setEditMode(false);
  };

  const handleSaveUser = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: editForm.id, role: editForm.role, phone: editForm.phone, department: editForm.department })
      });
      if (!res.ok) throw new Error();
      showToast(`✅ Đã cập nhật nhân sự ${editForm.name} thành công!`);
      setEditMode(false);
      fetchUsers();
    } catch {
      showToast('❌ Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (form: any, setForm: any, perm: string) => {
    setForm((prev: any) => {
      const perms = prev.permissions.includes(perm)
        ? prev.permissions.filter((p: string) => p !== perm)
        : [...prev.permissions, perm];
      return { ...prev, permissions: perms };
    });
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = (u.name || '').toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const pendingCount = users.filter(u => u.role === 'GUEST').length;

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans overflow-hidden">
      
      {/* HEADER & TABS */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users size={24} className="text-[#005691]" /> Nhân Sự Ekip
          </h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý hồ sơ, duyệt tài khoản và cấu hình nhóm quyền (RBAC).</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.origin);
              showToast('🔗 Đã copy đường dẫn đăng nhập! Hãy gửi cho nhân sự.');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#005691] hover:bg-blue-100 rounded-lg text-sm font-bold transition-colors border border-blue-200"
          >
            <Link2 size={16} /> Copy Link Mời
          </button>
          
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('STAFF')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'STAFF' ? 'bg-white text-[#005691] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Users size={16} /> Hồ Sơ Nhân Sự
              {pendingCount > 0 && <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full ml-1">{pendingCount}</span>}
            </button>
            <button 
              onClick={() => setActiveTab('RBAC')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'RBAC' ? 'bg-white text-[#005691] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ShieldCheck size={16} /> Phân Quyền (RBAC)
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: NHÂN SỰ & DUYỆT TÀI KHOẢN */}
      {/* ========================================================================= */}
      {activeTab === 'STAFF' && (
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: Danh sách nhân sự */}
          <div className="w-[360px] shrink-0 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm">
            <div className="p-5 border-b border-slate-100">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc email..."
                  className="pl-9 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#005691] transition-colors"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => setFilterRole('ALL')} className={`text-[10px] font-black px-2.5 py-1 rounded-full border transition-all ${filterRole === 'ALL' ? 'bg-[#005691] text-white border-[#005691]' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>Tất cả</button>
                <button onClick={() => setFilterRole('GUEST')} className={`text-[10px] font-black px-2.5 py-1 rounded-full border transition-all ${filterRole === 'GUEST' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                  Chờ duyệt {pendingCount > 0 && `(${pendingCount})`}
                </button>
                {DEFAULT_ROLES.filter(r => r.value !== 'GUEST').map(r => (
                  <button key={r.value} onClick={() => setFilterRole(r.value)} className={`text-[10px] font-black px-2.5 py-1 rounded-full border transition-all ${filterRole === r.value ? 'bg-[#005691] text-white border-[#005691]' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading ? (
                <div className="text-center text-slate-400 text-sm py-10">Đang tải...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center text-slate-400 text-sm py-10">Không tìm thấy nhân sự</div>
              ) : (
                filteredUsers.map(user => {
                  const role = DEFAULT_ROLES.find(r => r.value === user.role) || DEFAULT_ROLES[0];
                  const isActive = selectedUser?.id === user.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isActive ? 'bg-blue-50 border-[#005691] shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                    >
                      {user.image ? (
                        <img src={user.image} className="w-10 h-10 rounded-full border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-black shrink-0">
                          {(user.name || 'U').charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">{user.name || 'Chưa cập nhật'}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        <div className="mt-1">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0 ${role.color}`}>
                            {role.label}
                          </span>
                        </div>
                      </div>
                      {user.role === 'GUEST' && <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Chi tiết & Duyệt/Phân quyền */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
            {selectedUser ? (
              <>
                <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {selectedUser.image ? (
                      <img src={selectedUser.image} className="w-14 h-14 rounded-2xl border-2 border-[#005691] shadow" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#005691] to-[#00A859] flex items-center justify-center text-white font-black text-2xl shadow">
                        {(selectedUser.name || 'U').charAt(0)}
                      </div>
                    )}
                    <div>
                      <h2 className="font-black text-xl text-slate-900">{selectedUser.name || 'Chưa cập nhật'}</h2>
                      <span className="text-sm text-slate-500">{selectedUser.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={fetchUsers} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                      <RefreshCw size={18} />
                    </button>
                    {isAdmin && (editMode ? (
                      <>
                        <button onClick={() => { setEditMode(false); setEditForm({ ...selectedUser }); }} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
                          <X size={16} /> Hủy
                        </button>
                        <button onClick={handleSaveUser} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#005691] text-white text-sm font-bold hover:bg-[#004a7c] transition-colors disabled:opacity-70">
                          <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setEditMode(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F58220] text-white text-sm font-bold hover:bg-[#e07010] transition-colors">
                        {selectedUser.role === 'GUEST' ? <CheckCircle2 size={16} /> : <Edit3 size={16} />}
                        {selectedUser.role === 'GUEST' ? 'Duyệt & Phân quyền' : 'Chỉnh sửa'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                  <div className="max-w-3xl mx-auto space-y-6">
                    
                    {/* GUEST WARNING */}
                    {selectedUser.role === 'GUEST' && (
                      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-5 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0">
                          <Clock size={20} className="text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-black text-yellow-800">Tài khoản đang chờ duyệt</p>
                          <p className="text-sm text-yellow-600 mt-1">Bấm <strong>"Duyệt & Phân quyền"</strong> ở góc phải trên để cấp vị trí cho nhân sự này.</p>
                        </div>
                      </div>
                    )}

                    {/* VỊ TRÍ & QUYỀN */}
                    <div className={`bg-white rounded-2xl border-2 shadow-sm p-6 ${isAdmin && editMode ? 'border-[#005691]/30' : 'border-slate-200'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-slate-900 flex items-center gap-2">
                          <ShieldCheck size={18} className="text-[#005691]" /> Vị Trí Công Việc
                        </h3>
                        {!isAdmin && (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                            <Lock size={12} /> Chỉ Admin mới được sửa
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {DEFAULT_ROLES.filter(r => r.value !== 'GUEST').map(r => {
                          const currentRole = editMode ? editForm.role : selectedUser.role;
                          const isSelected = currentRole === r.value;
                          const Icon = r.icon;
                          return (
                            <button
                              key={r.value}
                              onClick={() => { if (editMode && isAdmin) setEditForm((p: any) => ({ ...p, role: r.value })); }}
                              disabled={!editMode || !isAdmin}
                              title={r.desc}
                              className={`flex flex-col items-start gap-2 p-3 rounded-xl border-2 transition-all text-left
                                ${isSelected ? 'border-[#005691] bg-blue-50 shadow-md' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}
                                ${editMode && isAdmin ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default opacity-90'}
                              `}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#005691] text-white' : 'bg-slate-200 text-slate-500'}`}>
                                <Icon size={15} />
                              </div>
                              <div>
                                <p className={`text-[11px] font-black leading-tight ${isSelected ? 'text-[#005691]' : 'text-slate-600'}`}>{r.label}</p>
                                <p className="text-[9px] text-slate-400 leading-tight mt-1 line-clamp-2">{r.desc}</p>
                              </div>
                              {isSelected && <CheckCircle2 size={13} className="text-[#005691] ml-auto" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* THÔNG TIN HỒ SƠ */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                      <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                        <UserCheck size={18} className="text-[#F58220]" /> Thông Tin Cá Nhân
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-black text-slate-400 uppercase block mb-1.5">Tên hiển thị</label>
                          <div className="px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-700">{selectedUser.name || '—'}</div>
                        </div>
                        <div>
                          <label className="text-xs font-black text-slate-400 uppercase block mb-1.5">Email (Google)</label>
                          <div className="px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 flex items-center gap-2"><Mail size={14} className="text-slate-400" />{selectedUser.email || '—'}</div>
                        </div>
                        <div>
                          <label className="text-xs font-black text-slate-400 uppercase block mb-1.5">Số điện thoại</label>
                          {editMode ? (
                            <input type="text" value={editForm.phone || ''} onChange={e => setEditForm((p: any) => ({ ...p, phone: e.target.value }))} placeholder="Nhập SĐT..." className="px-4 py-2.5 w-full bg-white rounded-xl border-2 border-[#005691] text-sm font-medium outline-none" />
                          ) : (
                            <div className="px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 flex items-center gap-2"><Phone size={14} className="text-slate-400" />{selectedUser.phone || 'Chưa cập nhật'}</div>
                          )}
                        </div>
                        <div>
                          <label className="text-xs font-black text-slate-400 uppercase block mb-1.5">Phòng ban</label>
                          {editMode ? (
                            <input type="text" value={editForm.department || ''} onChange={e => setEditForm((p: any) => ({ ...p, department: e.target.value }))} placeholder="VD: Marketing..." className="px-4 py-2.5 w-full bg-white rounded-xl border-2 border-[#005691] text-sm font-medium outline-none" />
                          ) : (
                            <div className="px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-700">{selectedUser.department || 'Chưa phân bổ'}</div>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center flex-col gap-3 text-slate-300">
                <Users size={56} className="opacity-30" />
                <p className="font-bold text-lg">Chọn một nhân sự để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CẤU HÌNH VAI TRÒ (RBAC) */}
      {/* ========================================================================= */}
      {activeTab === 'RBAC' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Cột trái: Danh sách Vai trò */}
          <div className="w-[360px] shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-black text-slate-900">Nhóm Vai Trò</h2>
              <button className="text-xs font-bold text-[#005691] flex items-center gap-1 hover:text-[#F58220] transition-colors">
                <Plus size={14} /> Thêm mới
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {roles.map(role => {
                const count = users.filter(u => u.role === role.value).length;
                return (
                  <button key={role.value} onClick={() => setEditingRole({ ...role })}
                    className={`w-full flex flex-col p-4 rounded-2xl border-2 transition-all text-left ${editingRole?.value === role.value ? 'border-[#005691] bg-blue-50 shadow-md' : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <p className="font-black text-sm text-slate-900">{role.label}</p>
                      {count > 0 && <span className="text-[10px] font-black bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{count} TK</span>}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{role.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cột phải: Cấu hình Permissions */}
          <div className="flex-1 bg-slate-50 overflow-y-auto">
            {editingRole ? (
              <div className="p-8 max-w-3xl mx-auto">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">{editingRole.label}</h2>
                      <p className="text-sm text-slate-500 mt-1">Thiết lập các quyền truy cập hệ thống cho nhóm này.</p>
                    </div>
                    <button className="px-6 py-2.5 bg-[#F58220] text-white text-sm font-black rounded-xl hover:bg-[#e07010] transition-colors flex items-center gap-2">
                      <Save size={16} /> Lưu cấu hình
                    </button>
                  </div>

                  <div className="space-y-6">
                    {editingRole.value === 'ADMIN' ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 flex items-center gap-3">
                        <ShieldCheck size={24} />
                        <div>
                          <p className="font-black text-lg">Toàn quyền hệ thống</p>
                          <p className="text-sm">Nhóm Admin (Master) có tất cả các quyền, không thể giới hạn.</p>
                        </div>
                      </div>
                    ) : (
                      PERMISSION_GROUPS.map(g => (
                        <div key={g.group} className="border border-slate-200 rounded-2xl overflow-hidden">
                          <div className={`px-5 py-3 border-b border-slate-100 font-black text-sm uppercase tracking-wide ${g.color}`}>
                            {g.group}
                          </div>
                          <div className="divide-y divide-slate-100 bg-white">
                            {g.items.map(p => {
                              const checked = editingRole.permissions.includes(p.id);
                              return (
                                <label key={p.id} className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                                  <div onClick={() => togglePermission(editingRole, setEditingRole, p.id)}
                                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all shrink-0 ${checked ? 'bg-[#005691] border-[#005691]' : 'border-slate-300'}`}>
                                    {checked && <CheckCircle2 size={16} className="text-white" />}
                                  </div>
                                  <span className={`text-sm ${checked ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>{p.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center h-full flex-col gap-3 text-slate-300">
                <Settings2 size={56} className="opacity-30" />
                <p className="font-bold text-lg">Chọn một vai trò bên trái để cấu hình quyền</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50">
          <CheckCircle2 size={18} className="text-[#00A859]" />
          <span className="font-bold text-sm">{toast}</span>
        </div>
      )}
    </div>
  );
}
