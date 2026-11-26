"use client";
import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, Users, Settings, Briefcase, Video, Activity, Calendar, Package, ShieldCheck, LogOut, Wrench, ScrollText, Menu, X, User
} from 'lucide-react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

import { usePathname } from 'next/navigation';
import { useRbac, permsFor, hasAny } from '@/lib/rbac';





// Mục menu chính (dùng chung menu máy tính + menu điện thoại)
const NAV_ITEMS: Array<{ name: string; icon: any; href: string; perm: string | string[]; badge?: string }> = [
            { name: 'Tổng quan', icon: LayoutDashboard, href: '/', perm: '*' },
            { name: 'Thống kê', icon: Activity, href: '/analytics', perm: ['admin.analytics', 'live.view'] },
            { name: 'CRM / CSKH', icon: Users, href: '/cskh', perm: ['crm.view', 'crm.edit', 'crm.export', 'cskh.view', 'cskh.process', 'cskh.manage_orders'] },
            { name: 'Kho Quà tặng', icon: Package, href: '/inventory', perm: ['inventory.view', 'inventory.manage', 'inventory.export'] },
            { name: 'Kho Thiết bị', icon: Wrench, href: '/equipment', perm: '*' },
            { name: 'Nhân Sự Ekip', icon: Briefcase, href: '/staff', perm: ['admin.users', 'admin.approve', 'admin.rbac'] },
            { name: 'Lịch phân công', icon: Calendar, href: '/schedule', perm: ['schedule.view', 'schedule.register', 'schedule.approve', 'schedule.manage', 'payroll.view', 'payroll.manage', 'payroll.export'] },
            { name: 'Điều khiển LIVE', icon: Video, badge: 'LIVE', href: '/live', perm: ['live.view', 'live.manage', 'live.control', 'live.script'] },
            { name: 'Tra cứu vận đơn', icon: Package, href: '/tracking', perm: '*' },
          ];

export function Sidebar({ sidebarOpen = true }: { sidebarOpen?: boolean }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const user = session?.user as any;

  const [menuOpen, setMenuOpen] = useState(false);
  // Quyền theo vai trò: cấu hình Admin lưu DB (/api/rbac), thiếu thì quyền mặc định — xem lib/rbac.ts
  const { config: rbac } = useRbac(status === 'authenticated');
  const perms = permsFor(user?.role, rbac);
  const canSee = (item: { perm: string | string[] }) => status === 'loading' || hasAny(perms, item.perm);

  // Đổi trang thì đóng menu điện thoại
  useEffect(() => setMenuOpen(false), [pathname]);

  if (pathname === '/login' || pathname.startsWith('/tracking')) return null;

  const userName = user?.name || 'Đang tải...';
  const userRole = status === 'loading' ? 'Đang xác thực...' : (user?.role === 'ADMIN' ? 'Quản trị viên' : (user?.role || 'Guest'));
  const userInitial = user?.name ? userName.charAt(0).toUpperCase() : '?';

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className={`hidden md:flex transition-all duration-300 bg-[#002f51] border-r border-[#00213b] shrink-0 flex-col h-screen relative z-50 ${sidebarOpen ? 'w-64' : 'w-[72px]'}`}>
        {/* Decorative gradient blob */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none"></div>

      <div className="h-[72px] flex items-center justify-between px-5 border-b border-white/5 shrink-0 relative z-10">
        <Link href="/" className="flex items-center gap-3 overflow-hidden cursor-pointer group hover:opacity-90 transition-opacity">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F58220] to-[#d66b15] flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/30 border border-orange-400/50 relative">
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Video size={18} className="text-white fill-white/20" />
          </div>
          {sidebarOpen && (
            <div className="flex flex-col animate-in fade-in slide-in-from-left-2">
              <span className="font-black text-white text-[16px] tracking-wide leading-none drop-shadow-sm">FPTU HCM</span>
              <span className="font-bold text-[#F58220] text-[10px] tracking-widest uppercase mt-1 drop-shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Livestream
              </span>
            </div>
          )}
        </Link>
      </div>

      <div className="px-3 pt-6 pb-2 flex-1 overflow-y-auto overflow-x-hidden relative z-10 custom-scrollbar">
        {sidebarOpen && <p className="text-[10px] font-black text-blue-400/70 uppercase tracking-widest mb-3 px-3 animate-in fade-in">Quản lý chính</p>}
        <nav className="flex flex-col gap-1.5">
          {NAV_ITEMS.filter(canSee).map((item, idx) => {
            const active = pathname === item.href;
            return (
              <Link key={idx} href={item.href} className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 group whitespace-nowrap
                  ${active ? 'bg-gradient-to-r from-[#F58220] to-[#e07010] text-white shadow-lg shadow-orange-500/20' : 'text-blue-200/70 hover:bg-white/5 hover:text-white'}`}>
                <div className="flex items-center gap-3">
                  <item.icon size={20} className={active ? "text-white" : "text-blue-300/50 group-hover:text-blue-200"} strokeWidth={active ? 2.5 : 2} />
                  {sidebarOpen && <span className={`font-bold text-[14px] ${active ? 'text-white' : ''}`}>{item.name}</span>}
                </div>
                {sidebarOpen && item.badge && (
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 shadow-sm uppercase tracking-wider
                    ${active ? 'bg-white text-orange-600 border-white/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${active ? 'bg-orange-500' : 'bg-red-500'}`}></span>{item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        
        {sidebarOpen && <p className="text-[10px] font-black text-blue-400/70 uppercase tracking-widest mt-8 mb-3 px-5 animate-in fade-in">Hệ thống</p>}
        <nav className="flex flex-col gap-1.5 px-3">
          {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group whitespace-nowrap text-blue-200/70 hover:bg-white/5 hover:text-white">
              <Settings size={20} className="text-blue-300/50 group-hover:text-blue-200" strokeWidth={2} />
              {sidebarOpen && <span className="font-bold text-[14px]">Cài đặt chung</span>}
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link href="/audit" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group whitespace-nowrap ${pathname === '/audit' ? 'bg-white/10 text-white' : 'text-blue-200/70 hover:bg-white/5 hover:text-white'}`}>
              <ScrollText size={20} className="text-blue-300/50 group-hover:text-blue-200" strokeWidth={2} />
              {sidebarOpen && <span className="font-bold text-[14px]">Nhật ký hệ thống</span>}
            </Link>
          )}
          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group whitespace-nowrap text-blue-200/70 hover:bg-red-500/10 hover:text-red-300">
            <LogOut size={20} className="text-blue-300/50 group-hover:text-red-300" strokeWidth={2} />
            {sidebarOpen && <span className="font-bold text-[14px]">Đăng xuất</span>}
          </button>
        </nav>
      </div>

      {sidebarOpen && (
        <Link href="/profile" className="p-4 m-3 mt-auto bg-gradient-to-b from-[#003b66] to-[#002845] rounded-2xl border border-white/5 relative overflow-hidden group cursor-pointer hover:border-white/10 transition-colors block">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#F58220]/10 rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center gap-3 relative z-10">
            {user?.image ? (
              <img src={user.image} alt="avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm shrink-0 object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#005691] font-black text-sm border-2 border-white shadow-sm shrink-0">
                {userInitial}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-black text-sm text-white truncate group-hover:text-blue-100 transition-colors">{userName}</span>
              <span className="text-[10px] font-bold text-blue-300/70 truncate">{userRole}</span>
            </div>
          </div>
        </Link>
      )}
    </aside>

      {/* MOBILE BOTTOM NAVIGATION: 4 mục hay dùng + "Menu" mở đủ mục theo quyền */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#002f51] border-t border-[#00213b] z-[100] flex items-center justify-around px-1 shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
        {[
          { name: 'Tổng quan', icon: LayoutDashboard, href: '/', perm: '*' as string | string[] },
          ...NAV_ITEMS.filter((i) => ['/cskh', '/live', '/inventory', '/equipment'].includes(i.href)),
        ].filter(canSee).slice(0, 4).map((item, idx) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
          return (
            <Link key={idx} href={item.href} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <div className={`p-1.5 rounded-full transition-colors ${active ? 'bg-[#F58220]' : 'bg-transparent'}`}>
                <item.icon size={20} className={active ? "text-white" : "text-blue-300/50"} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className={`text-[9px] font-bold ${active ? 'text-[#F58220]' : 'text-blue-300/50'}`}>{item.name.replace('CRM / CSKH', 'CRM').replace('Điều khiển LIVE', 'LIVE').replace('Kho Quà tặng', 'Kho quà').replace('Kho Thiết bị', 'Thiết bị')}</span>
            </Link>
          )
        })}
        <button onClick={() => setMenuOpen(true)} className="flex flex-col items-center justify-center w-full h-full gap-1" aria-label="Mở menu">
          <div className="p-1.5 rounded-full"><Menu size={20} className="text-blue-300/50" /></div>
          <span className="text-[9px] font-bold text-blue-300/50">Menu</span>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[110] bg-slate-900/60" onClick={() => setMenuOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-[#002f51] rounded-t-3xl p-4 pb-8 max-h-[80dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Menu">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="min-w-0">
                <p className="font-black text-white truncate">{userName}</p>
                <p className="text-[11px] font-bold text-blue-300/70">{userRole}</p>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-2 text-blue-200" aria-label="Đóng menu"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                ...NAV_ITEMS.filter(canSee),
                { name: 'Hồ sơ', icon: User, href: '/profile', perm: '*' },
                ...((user?.role === 'ADMIN' || user?.role === 'MANAGER') ? [{ name: 'Cài đặt', icon: Settings, href: '/settings', perm: '*' }] : []),
                ...(user?.role === 'ADMIN' ? [{ name: 'Nhật ký', icon: ScrollText, href: '/audit', perm: '*' }] : []),
              ].map((item) => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center ${active ? 'bg-[#F58220] text-white' : 'bg-white/5 text-blue-100'}`}>
                    <item.icon size={22} />
                    <span className="text-[11px] font-bold leading-tight">{item.name}</span>
                  </Link>
                );
              })}
            </div>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/15 text-red-300 font-bold text-sm">
              <LogOut size={18} /> Đăng xuất
            </button>
          </div>
        </div>
      )}
    </>
  );
}
