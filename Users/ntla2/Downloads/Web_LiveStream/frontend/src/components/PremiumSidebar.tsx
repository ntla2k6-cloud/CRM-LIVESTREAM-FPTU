"use client"
import React from 'react';
import { 
  LayoutDashboard, Users, Settings, Briefcase, Video, Plus 
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function PremiumSidebar({ sidebarOpen, setSidebarOpen, setShowModal }: any) {
  const pathname = usePathname();

  return (
    <aside className={`fixed lg:static top-0 left-0 z-40 h-screen transition-all duration-300 bg-white border-r border-slate-200/60 ${sidebarOpen ? 'w-64' : 'w-[80px]'} overflow-hidden flex flex-col`}>
      <div className="h-[72px] flex items-center justify-between px-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F58220] flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
            <span className="text-white font-black text-xl tracking-tighter">F</span>
          </div>
          {sidebarOpen && <span className="font-bold text-[17px] text-slate-900 tracking-tight whitespace-nowrap">CRM LIVE</span>}
        </div>
      </div>

      <div className="px-4 pt-6 pb-2">
        {sidebarOpen && <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Quản lý chính</p>}
        <nav className="flex flex-col gap-1.5">
          {[
            { name: 'Tổng quan', icon: LayoutDashboard, href: '/' },
            { name: 'Chiến dịch', icon: Briefcase, href: '#' },
            { name: 'CRM / CSKH', icon: Users, href: '/cskh' },
          ].map((item, idx) => {
            const active = pathname === item.href;
            return (
              <Link key={idx} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group whitespace-nowrap
                  ${active ? 'bg-orange-50/80 text-[#F58220]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                <item.icon size={20} className={active ? "text-[#F58220]" : "text-slate-400 group-hover:text-slate-600"} strokeWidth={active ? 2.5 : 2} />
                {sidebarOpen && <span className={`font-semibold text-[14px] ${active ? 'text-[#F58220]' : ''}`}>{item.name}</span>}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="px-4 pt-4 pb-2">
        {sidebarOpen && <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Vận hành</p>}
        <nav className="flex flex-col gap-1.5">
          {[
            { name: 'Điều khiển LIVE', icon: Video, badge: 'Đang LIVE', href: '/live' },
            { name: 'Cài đặt', icon: Settings, href: '#' },
          ].map((item, idx) => {
            const active = pathname === item.href;
            return (
              <Link key={idx} href={item.href} className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group whitespace-nowrap ${active ? 'bg-orange-50/80 text-[#F58220]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                <div className="flex items-center gap-3">
                  <item.icon size={20} className={active ? "text-[#F58220]" : "text-slate-400 group-hover:text-slate-600"} strokeWidth={active ? 2.5 : 2} />
                  {sidebarOpen && <span className={`font-semibold text-[14px] ${active ? 'text-[#F58220]' : ''}`}>{item.name}</span>}
                </div>
                {sidebarOpen && item.badge && (
                  <span className="bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>LIVE
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Nút hành động nhanh ở Sidebar */}
      <div className="mt-auto p-5">
        {sidebarOpen ? (
          <button onClick={() => setShowModal && setShowModal(true)} className="w-full flex items-center justify-center gap-2 bg-[#F58220] hover:bg-[#e07519] text-white py-3 rounded-xl font-semibold shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-0.5">
            <Plus size={18} strokeWidth={2.5} /> Bắt đầu Chiến dịch
          </button>
        ) : (
          <button onClick={() => setShowModal && setShowModal(true)} className="w-10 h-10 mx-auto flex items-center justify-center bg-[#F58220] hover:bg-[#e07519] text-white rounded-xl shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-0.5">
            <Plus size={20} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </aside>
  );
}
