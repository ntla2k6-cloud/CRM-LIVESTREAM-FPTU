"use client"
import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Plus, Users, Clock, CheckCircle2, X, ChevronDown, Save,
  Edit3, Trash2, Lock, Video, Package, BarChart3, CalendarDays, UserCheck
} from 'lucide-react';

// ============================================================
// CẤU HÌNH VAI TRÒ MẶC ĐỊNH
// ============================================================
const DEFAULT_ROLES = [
  {
    id: 'ADMIN', label: 'Admin (Master)', color: 'bg-red-500',
    desc: 'Toàn quyền truy cập tất cả hệ thống',
    permissions: ['*']
  },
  {
    id: 'MANAGER', label: 'Quản lý (Manager)', color: 'bg-indigo-500',
    desc: 'Xem toàn bộ dữ liệu, báo cáo, xuất Excel, phân ca',
    permissions: ['crm.view', 'crm.edit', 'live.view', 'live.control', 'report.view', 'report.export', 'staff.view', 'schedule.manage']
  },
  {
    id: 'VJ_HOST', label: 'VJ / Host Livestream', color: 'bg-orange-500',
    desc: 'Dẫn chương trình, điều khiển Live, chạy Minigame',
    permissions: ['live.view', 'live.control', 'live.minigame']
  },
  {
    id: 'CSKH', label: 'CSKH (Telesale)', color: 'bg-blue-500',
    desc: 'Xem màn hình CRM và Học sinh, gọi điện tư vấn',
    permissions: ['crm.view', 'crm.edit', 'live.view']
  },
  {
    id: 'BIEN_TAP', label: 'Biên Tập Viên', color: 'bg-yellow-500',
    desc: 'Soạn kịch bản LIVE, thiết kế câu hỏi Minigame',
    permissions: ['live.view', 'live.script', 'live.minigame_edit']
  },
  {
    id: 'KY_THUAT', label: 'Kỹ Thuật', color: 'bg-teal-500',
    desc: 'Vận hành thiết bị, OBS, kết nối luồng Live, kỹ thuật phát sóng',
    permissions: ['live.view', 'live.control']
  },
  {
    id: 'SAN_XUAT', label: 'Tổ Chức Sản Xuất', color: 'bg-purple-500',
    desc: 'Lên kế hoạch nội dung, điều phối ekip, quản lý lịch phân công',
    permissions: ['live.view', 'live.script', 'schedule.view', 'schedule.manage', 'staff.view']
  },
  {
    id: 'THU_KHO', label: 'Thủ Kho', color: 'bg-emerald-500',
    desc: 'Chỉ xem màn hình Kho quà tặng, cập nhật trạng thái giao quà',
    permissions: ['inventory.view', 'inventory.update']
  },
  {
    id: 'MARKETING', label: 'Marketing / Content', color: 'bg-pink-500',
    desc: 'Xem báo cáo Live, phân tích Keyword và Lead',
    permissions: ['report.view', 'report.export', 'live.view']
  },
];

// ============================================================
// CÁC NHÓM QUYỀN (PERMISSIONS)
// ============================================================
const PERMISSION_GROUPS = [
  {
    group: 'CRM / Học sinh', color: 'text-orange-500 bg-orange-50',
    items: [
      { id: 'crm.view',   label: 'Xem danh sách học sinh' },
      { id: 'crm.edit',   label: 'Thêm/Sửa/Xóa Lead học sinh' },
      { id: 'crm.export', label: 'Xuất danh sách Lead ra Excel' },
    ]
  },
  {
    group: 'Kho Quà Tặng', color: 'text-emerald-600 bg-emerald-50',
    items: [
      { id: 'inventory.view',   label: 'Xem số lượng tồn kho' },
      { id: 'inventory.update', label: 'Cập nhật trạng thái giao quà' },
      { id: 'inventory.manage', label: 'Nhập/Xuất kho quà mới' },
    ]
  },
  {
    group: 'LIVE & Biên Tập', color: 'text-red-500 bg-red-50',
    items: [
      { id: 'live.view',          label: 'Xem màn hình điều khiển LIVE' },
      { id: 'live.control',       label: 'Điều khiển phiên Live (Start/Stop)' },
      { id: 'live.script',        label: 'Soạn kịch bản & Câu hỏi' },
      { id: 'live.minigame',      label: 'Chạy & kết thúc Minigame' },
      { id: 'live.minigame_edit', label: 'Chỉnh sửa câu hỏi Minigame' },
      { id: 'live.report',        label: 'Xem báo cáo sau phiên Live' },
    ]
  },
  {
    group: 'Báo Cáo & Thống Kê', color: 'text-blue-500 bg-blue-50',
    items: [
      { id: 'report.view',   label: 'Xem báo cáo & dashboard' },
      { id: 'report.export', label: 'Xuất báo cáo ra Excel/CSV' },
    ]
  },
  {
    group: 'Nhân Sự & Lịch Phân Công', color: 'text-purple-500 bg-purple-50',
    items: [
      { id: 'staff.view',       label: 'Xem lịch trực (Cá nhân)' },
      { id: 'schedule.view',    label: 'Xem toàn bộ lịch phân công' },
      { id: 'schedule.manage',  label: 'Phân công ca trực (Quản lý)' },
      { id: 'staff.manage',     label: 'Quản trị Bảng lương & Xuất Excel' },
    ]
  },
];

// ============================================================
// COMPONENT CHÍNH
// ============================================================
export default function RoleManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [pendingSelections, setPendingSelections] = useState<Record<string, string>>({});
  const [approving, setApproving] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRole, setNewRole] = useState({ label: '', desc: '', color: 'bg-slate-500', permissions: [] as string[] });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleApprove = async (userId: string, name: string) => {
    const role = pendingSelections[userId];
    if (!role) { showToast('⚠️ Vui lòng chọn vị trí trước khi duyệt!'); return; }
    setApproving(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role })
      });
      if (!res.ok) throw new Error();
      showToast(`✅ Đã phê duyệt ${name} → ${roles.find(r => r.id === role)?.label}`);
      fetchUsers();
    } catch { showToast('❌ Lỗi, thử lại!'); }
    finally { setApproving(null); }
  };

  const handleUpdateRole = async (userId: string, role: string, name: string) => {
    setSaving(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role })
      });
      if (!res.ok) throw new Error();
      showToast(`✅ Đã đổi quyền ${name} → ${roles.find(r => r.id === role)?.label}`);
      fetchUsers();
    } catch { showToast('❌ Lỗi!'); }
    finally { setSaving(null); }
  };

  const togglePermission = (form: any, setForm: any, perm: string) => {
    setForm((prev: any) => {
      const perms = prev.permissions.includes(perm)
        ? prev.permissions.filter((p: string) => p !== perm)
        : [...prev.permissions, perm];
      return { ...prev, permissions: perms };
    });
  };

  const getUsersWithRole = (roleId: string) => users.filter(u => u.role === roleId);
  const pending = users.filter(u => u.role === 'GUEST');
  const approved = users.filter(u => u.role !== 'GUEST');

  const COLORS = ['bg-red-500','bg-orange-500','bg-yellow-500','bg-green-500','bg-teal-500','bg-blue-500','bg-indigo-500','bg-purple-500','bg-pink-500','bg-emerald-500','bg-slate-500'];

  return (
    <div className="flex h-full bg-slate-100 font-sans overflow-hidden">

      {/* ===== LEFT: DANH SÁCH VAI TRÒ ===== */}
      <div className="w-[340px] shrink-0 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h1 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-1">
            <ShieldCheck size={20} className="text-[#005691]" /> Cấu Hình Quyền Truy Cập (RBAC)
          </h1>
          <p className="text-xs text-slate-400 font-medium">Quản lý giới hạn truy cập cho từng chức vụ</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Danh sách Phân quyền Nhóm</p>

          {/* Hàng chờ duyệt */}
          {pending.length > 0 && (
            <button
              onClick={() => setSelectedRole({ id: '__PENDING__' })}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${selectedRole?.id === '__PENDING__' ? 'border-yellow-400 bg-yellow-50 shadow-md' : 'border-yellow-200 bg-yellow-50/50 hover:border-yellow-300'}`}
            >
              <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center shrink-0">
                <Clock size={16} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-black text-sm text-slate-900">Chờ Phê Duyệt</p>
                <p className="text-xs text-yellow-600 font-medium">Cần Admin xét duyệt vị trí</p>
              </div>
              <span className="bg-yellow-400 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">{pending.length}</span>
            </button>
          )}

          {/* Danh sách vai trò */}
          {roles.map(role => {
            const count = getUsersWithRole(role.id).length;
            const isActive = selectedRole?.id === role.id;
            return (
              <button key={role.id}
                onClick={() => { setSelectedRole(role); setEditingRole(null); }}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${isActive ? 'border-[#005691] bg-blue-50 shadow-md' : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${role.color}`}>
                  <ShieldCheck size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-slate-900">{role.label}</p>
                  <p className="text-xs text-slate-400 truncate">{role.desc}</p>
                </div>
                {count > 0 && (
                  <span className="text-[10px] font-black bg-[#005691] text-white px-2 py-0.5 rounded-full shrink-0">{count} tài khoản</span>
                )}
              </button>
            );
          })}

          {/* Thêm vai trò */}
          <button onClick={() => setShowAddRole(true)}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-[#005691] hover:text-[#005691] hover:bg-blue-50/50 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <Plus size={16} />
            </div>
            <span className="font-bold text-sm">Thêm vai trò mới</span>
          </button>
        </div>
      </div>

      {/* ===== RIGHT PANEL ===== */}
      <div className="flex-1 overflow-y-auto">
        {/* Không chọn gì */}
        {!selectedRole && (
          <div className="flex-1 flex items-center justify-center h-full flex-col gap-3 text-slate-300">
            <ShieldCheck size={56} className="opacity-30" />
            <p className="font-bold text-lg">Chọn một vai trò để xem chi tiết</p>
          </div>
        )}

        {/* Panel Chờ duyệt */}
        {selectedRole?.id === '__PENDING__' && (
          <div className="p-8 max-w-4xl mx-auto">
            <h2 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
              <Clock size={22} className="text-yellow-500" /> Hàng Chờ Phê Duyệt
            </h2>
            <p className="text-sm text-slate-500 mb-6">Các tài khoản đã đăng nhập nhưng chưa được phân vị trí</p>

            {pending.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center">
                <CheckCircle2 size={48} className="mx-auto text-green-400 mb-3" />
                <p className="font-bold text-green-600 text-lg">Không có tài khoản nào đang chờ ✅</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map(u => (
                  <div key={u.id} className="bg-white rounded-2xl border-2 border-yellow-200 p-5 flex items-center gap-4">
                    {u.image ? <img src={u.image} className="w-12 h-12 rounded-full border-2 border-yellow-200 shrink-0" /> :
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-white font-black text-xl shrink-0">{(u.name||'U').charAt(0)}</div>}
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{u.name || 'Chưa đặt tên'}</p>
                      <p className="text-sm text-slate-400">{u.email}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Đăng ký: {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}</p>
                    </div>
                    <div className="relative">
                      <select
                        value={pendingSelections[u.id] || ''}
                        onChange={e => setPendingSelections(p => ({ ...p, [u.id]: e.target.value }))}
                        className="appearance-none w-56 pl-4 pr-9 py-2.5 bg-white border-2 border-yellow-300 rounded-xl text-sm font-bold outline-none focus:border-[#F58220]"
                      >
                        <option value="" disabled>-- Chọn vị trí --</option>
                        {roles.filter(r => r.id !== 'GUEST').map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                    </div>
                    <button onClick={() => handleApprove(u.id, u.name || 'Nhân sự')}
                      disabled={approving === u.id || !pendingSelections[u.id]}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#F58220] to-[#e07010] text-white text-sm font-black rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 active:scale-95"
                    >
                      {approving === u.id ? '...' : <><CheckCircle2 size={16} /> Duyệt & Phân quyền</>}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Bảng đã phân quyền */}
            {approved.length > 0 && (
              <div className="mt-8">
                <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2">
                  <Users size={16} /> Nhân sự đã phân quyền ({approved.length} người)
                </h3>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-3 text-xs font-black text-slate-400 uppercase">Nhân sự</th>
                        <th className="px-5 py-3 text-xs font-black text-slate-400 uppercase">Email</th>
                        <th className="px-5 py-3 text-xs font-black text-slate-400 uppercase">Vị trí</th>
                        <th className="px-5 py-3 text-xs font-black text-slate-400 uppercase">Đổi quyền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {approved.map(u => {
                        const roleInfo = roles.find(r => r.id === u.role);
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/50">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                {u.image ? <img src={u.image} className="w-8 h-8 rounded-full shrink-0" /> :
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0 ${roleInfo?.color || 'bg-slate-400'}`}>{(u.name||'U').charAt(0)}</div>}
                                <span className="font-bold text-sm text-slate-900">{u.name || '—'}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-sm text-slate-400">{u.email}</td>
                            <td className="px-5 py-3">
                              <span className={`text-[10px] font-black px-2 py-1 rounded-full text-white ${roleInfo?.color || 'bg-slate-400'}`}>{roleInfo?.label || u.role}</span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <select defaultValue={u.role}
                                  onChange={e => handleUpdateRole(u.id, e.target.value, u.name)}
                                  disabled={saving === u.id}
                                  className="text-xs pl-2 pr-6 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#005691]"
                                >
                                  {roles.filter(r => r.id !== 'GUEST').map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                </select>
                                {saving === u.id && <span className="text-xs text-slate-400">...</span>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Panel Chi tiết Vai trò */}
        {selectedRole && selectedRole.id !== '__PENDING__' && (
          <div className="p-8 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedRole.color} shadow-lg`}>
                  <ShieldCheck size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">{selectedRole.label}</h2>
                  <p className="text-sm text-slate-400">{getUsersWithRole(selectedRole.id).length} tài khoản đang dùng vai trò này</p>
                </div>
              </div>
              <button
                onClick={() => setEditingRole({ ...selectedRole })}
                className="flex items-center gap-2 px-4 py-2 bg-[#F58220] text-white text-sm font-bold rounded-xl hover:bg-[#e07010] transition-colors"
              >
                <Edit3 size={15} /> Thiết lập quyền
              </button>
            </div>

            {/* Tài khoản đang dùng vai trò */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5 shadow-sm">
              <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-sm">
                <Users size={16} className="text-[#005691]" /> Tài khoản với vai trò này
              </h3>
              {getUsersWithRole(selectedRole.id).length === 0 ? (
                <p className="text-sm text-slate-400 italic">Chưa có tài khoản nào được gán vai trò này.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {getUsersWithRole(selectedRole.id).map(u => (
                    <div key={u.id} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
                      {u.image ? <img src={u.image} className="w-7 h-7 rounded-full" /> :
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs ${selectedRole.color}`}>{(u.name||'U').charAt(0)}</div>}
                      <span className="text-sm font-bold text-slate-700">{u.name || u.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Danh sách quyền hiện tại */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-black text-slate-800 mb-4 text-sm">Quyền truy cập hiện tại</h3>
              {selectedRole.permissions.includes('*') ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <ShieldCheck size={20} className="text-red-500" />
                  <p className="font-bold text-red-700">Toàn quyền truy cập tất cả hệ thống (*)</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {PERMISSION_GROUPS.map(g => {
                    const active = g.items.filter(p => selectedRole.permissions.includes(p.id));
                    if (active.length === 0) return null;
                    return (
                      <div key={g.group}>
                        <p className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded inline-block mb-2 ${g.color}`}>{g.group}</p>
                        <div className="space-y-1">
                          {active.map(p => (
                            <div key={p.id} className="flex items-center gap-2 text-sm text-slate-700">
                              <CheckCircle2 size={14} className="text-[#00A859] shrink-0" />
                              {p.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== SLIDE-IN PANEL: THIẾT LẬP QUYỀN ===== */}
      {editingRole && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/20" onClick={() => setEditingRole(null)} />
          <div className="w-[420px] bg-white border-l border-slate-200 flex flex-col h-full shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-black text-slate-900">Thiết lập Vai trò</h2>
                <p className="text-xs text-slate-400">Cấu hình quyền truy cập (Permissions)</p>
              </div>
              <button onClick={() => setEditingRole(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Tên vai trò */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Tên vai trò</label>
                <input value={editingRole.label} onChange={e => setEditingRole((p: any) => ({ ...p, label: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#005691]" />
              </div>
              {/* Mô tả */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Mô tả nhiệm vụ</label>
                <input value={editingRole.desc} onChange={e => setEditingRole((p: any) => ({ ...p, desc: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#005691]" />
              </div>
              {/* Màu */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Màu đại diện</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setEditingRole((p: any) => ({ ...p, color: c }))}
                      className={`w-7 h-7 rounded-full ${c} transition-all ${editingRole.color === c ? 'ring-2 ring-offset-2 ring-slate-600 scale-110' : 'hover:scale-105'}`} />
                  ))}
                </div>
              </div>

              {/* Danh sách Quyền */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-3">Danh sách Quyền (Permissions)</label>
                {editingRole.permissions.includes('*') ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm font-bold text-red-700 flex items-center gap-2 mb-3">
                    <ShieldCheck size={16} /> Toàn quyền — không thể giới hạn
                  </div>
                ) : (
                  <div className="space-y-4">
                    {PERMISSION_GROUPS.map(g => (
                      <div key={g.group}>
                        <p className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded mb-2 ${g.color}`}>{g.group}</p>
                        <div className="space-y-2 pl-1">
                          {g.items.map(p => {
                            const checked = editingRole.permissions.includes(p.id);
                            return (
                              <label key={p.id} className="flex items-center gap-3 cursor-pointer group">
                                <div onClick={() => togglePermission(editingRole, setEditingRole, p.id)}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${checked ? 'bg-[#005691] border-[#005691]' : 'border-slate-300 group-hover:border-slate-400'}`}>
                                  {checked && <CheckCircle2 size={12} className="text-white" />}
                                </div>
                                <span className={`text-sm ${checked ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>{p.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 flex gap-3">
              <button onClick={() => setEditingRole(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
                Hủy bỏ
              </button>
              <button
                disabled={savingRole}
                onClick={() => {
                  setSavingRole(true);
                  setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, ...editingRole } : r));
                  setSelectedRole({ ...editingRole });
                  setTimeout(() => {
                    setSavingRole(false);
                    setEditingRole(null);
                    showToast(`✅ Đã lưu cấu hình quyền cho vai trò "${editingRole.label}"`);
                  }, 600);
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#F58220] to-[#e07010] text-white text-sm font-black rounded-xl hover:shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {savingRole ? '...' : <><Save size={16} /> Lưu phân quyền</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL THÊM VAI TRÒ MỚI ===== */}
      {showAddRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-3xl shadow-2xl p-7 w-[480px] border border-slate-200">
            <h2 className="font-black text-slate-900 text-lg mb-5 flex items-center gap-2">
              <Plus size={20} className="text-[#005691]" /> Thêm Vai Trò Mới
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1.5">Tên vai trò *</label>
                <input value={newRole.label} onChange={e => setNewRole(p => ({ ...p, label: e.target.value }))} placeholder="VD: Thiết kế Đồ Hoạ..." className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#005691]" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1.5">Mô tả nhiệm vụ</label>
                <input value={newRole.desc} onChange={e => setNewRole(p => ({ ...p, desc: e.target.value }))} placeholder="Mô tả ngắn về vai trò này..." className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#005691]" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2">Màu đại diện</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setNewRole(p => ({ ...p, color: c }))}
                      className={`w-7 h-7 rounded-full ${c} ${newRole.color === c ? 'ring-2 ring-offset-2 ring-slate-600 scale-110' : 'hover:scale-105'} transition-all`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddRole(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Hủy</button>
              <button
                disabled={!newRole.label.trim()}
                onClick={() => {
                  const id = newRole.label.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
                  setRoles(prev => [...prev, { id, ...newRole }]);
                  setNewRole({ label: '', desc: '', color: 'bg-slate-500', permissions: [] });
                  setShowAddRole(false);
                  showToast(`✅ Đã thêm vai trò "${newRole.label}"`);
                }}
                className="flex-1 py-2.5 bg-[#005691] text-white text-sm font-black rounded-xl hover:bg-[#004a7c] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Thêm vai trò
              </button>
            </div>
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
