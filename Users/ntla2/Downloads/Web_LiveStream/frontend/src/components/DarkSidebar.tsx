"use client"
import React from 'react';
import { LayoutDashboard, Users, Settings, Briefcase, Video, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function DarkSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] h-screen bg-[#0B1120] border-r border-slate-800/60 flex flex-col shrink-0">
      <div className="h-[72px] flex items-center px-6 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center">
            <span className="text-[#F58220] font-bold text-lg tracking-wide flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm border-2 border-[#F58220]"></div>
              FPT LIVE CRM
            </span>
          </div>
        </div>
      </div>

      <div className="py-6 flex-1">
        <nav className="flex flex-col gap-1 px-3">
          {[
            { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
            { name: 'Chiến Dịch', icon: Briefcase, href: '/campaigns' },
            { name: 'Live Control', icon: Video, href: '/live' },
            { name: 'CRM / CSKH', icon: Users, href: '/cskh' },
          ].map((item, idx) => {
            const active = pathname === item.href;
            return (
              <Link key={idx} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${active ? 'bg-orange-500/10 text-[#F58220]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                <item.icon size={18} className={active ? "text-[#F58220]" : "text-slate-500 group-hover:text-slate-300"} strokeWidth={2} />
                <span className={`font-semibold text-[13px] ${active ? 'text-[#F58220]' : ''}`}>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800/60">
        <div className="flex items-center gap-3 px-4 py-2">
          <UserCircle size={24} className="text-slate-400" />
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-slate-300">Admin</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
