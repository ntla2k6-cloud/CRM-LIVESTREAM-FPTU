"use client"
import React, { useState, useEffect } from 'react';
import { 
  Search, Bell, ChevronDown, TrendingUp, TrendingDown, 
  Eye, Activity, MessageCircle, MoreVertical, Briefcase, Users, Gift, Calendar
} from 'lucide-react';

export default function FptLightDashboard() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    setMounted(true);
    setCurrentDate(new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(s => { 
        if (s?.user) setUser(s.user); 
      })
      .catch(() => {});
  }, []);

  const userName = user?.name || 'Lan Anh';
  const userRole = user?.role === 'ADMIN' ? 'Quản trị viên' : (user?.role || 'Quản trị viên');

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* STICKY HEADER */}
      <header className="h-[72px] shrink-0 bg-white/70 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 z-30 sticky top-0">
        <div className="flex items-center gap-4">
          {mounted && (
            <div className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-lg">
              <Calendar size={16} className="text-[#F58220]" />
              {currentDate}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-5 relative">
          <div className="relative">
            <button onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }} className="relative text-slate-400 hover:text-slate-700 transition-colors p-2">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#F58220] rounded-full border border-white"></span>
            </button>
            {showNotifs && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)}></div>
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-100 bg-slate-50 font-bold text-sm text-slate-800">Thông báo mới</div>
                  <div className="p-3 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer border-b border-slate-50">
                    <p className="font-bold text-slate-800">Có 1 đơn quà tặng mới</p>
                    <p className="text-xs text-slate-400 mt-1">Từ phiên live: Hành Trang IT</p>
                  </div>
                  <div className="p-3 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer">
                    <p className="font-bold text-slate-800">3 học sinh cần tư vấn</p>
                    <p className="text-xs text-slate-400 mt-1">Mới cập nhật 5 phút trước</p>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="relative border-l border-slate-200 pl-5">
            <div onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }} className="flex items-center gap-3 cursor-pointer group">
              {user?.image ? (
                <img src={user.image} alt="Profile" className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-none group-hover:text-[#F58220] transition-colors">{userName}</p>
                <p className="text-[11px] font-medium text-slate-500 mt-1">{userRole}</p>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
            </div>
            {showProfile && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)}></div>
                <div className="absolute right-0 mt-3 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden py-1">
                  <a href="/profile" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#005691] font-medium transition-colors">Hồ sơ cá nhân</a>
                  <a href="/settings" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#005691] font-medium transition-colors">Cài đặt hệ thống</a>
                  <div className="border-t border-slate-100 my-1"></div>
                  <a href="/login" className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-bold transition-colors">Đăng xuất</a>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* DASHBOARD CONTENT GRID */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        
        <div className="mb-8">
          <p className="text-sm font-bold text-slate-500 mb-1">
            <span className="text-[#F58220]">
              👋 Chào {userName}!
            </span>
            {' '}Dưới đây là tình hình hoạt động hôm nay.
          </p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tổng Quan Hệ Thống</h1>
        </div>

        {/* METRIC CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {[
            { title: 'TỔNG LƯỢT XEM', value: '0', trend: '0%', isUp: true, icon: Eye, color: '#F58220' },
            { title: 'HỌC SINH TƯ VẤN', value: '0', trend: '0', isUp: true, icon: Users, color: '#005691' },
            { title: 'ĐƠN QUÀ TẶNG', value: '0', trend: '0', isUp: true, icon: Gift, color: '#00A859' },
            { title: 'TỶ LỆ CHUYỂN ĐỔI', value: '0%', trend: '0%', isUp: true, icon: Activity, color: '#6366f1' },
          ].map((metric, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden cursor-pointer">
              <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-0 group-hover:opacity-10 transition-opacity blur-xl" style={{ backgroundColor: metric.color }}></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h3 className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">{metric.title}</h3>
                  <p className="text-2xl font-black text-slate-900">{metric.value}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 group-hover:-translate-y-1 transition-transform" style={{ color: metric.color, backgroundColor: `${metric.color}15` }}>
                  <metric.icon size={20} strokeWidth={2.5} />
                </div>
              </div>
              
              <div className="flex items-center text-sm mt-4 relative z-10">
                <span className={`flex items-center gap-1 font-bold ${metric.isUp ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.isUp ? <TrendingUp size={14} strokeWidth={3} /> : <TrendingDown size={14} strokeWidth={3} />} {metric.trend}
                </span>
                <span className="text-slate-400 text-[11px] font-medium ml-2">so với tháng trước</span>
              </div>
            </div>
          ))}
        </div>

        {/* DATA VISUALIZATION AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
          
          {/* LINE CHART */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col min-h-[380px]">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Tốc Độ Sinh Lead (7 Ngày)</h2>
                <p className="text-[12px] font-medium text-slate-500 mt-0.5">Phân tích lượng học sinh có nhu cầu theo thời gian</p>
              </div>
              <div className="flex gap-4">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F58220] shadow-inner"></div> HOT Leads
                </span>
                <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-100 border border-slate-200"></div> Tổng Leads
                </span>
              </div>
            </div>
            
            {/* Animated Bar Chart */}
            <div className="flex-1 w-full flex items-end gap-3 h-[250px] mt-auto">
              {[
                { hot: 0, total: 0, day: 'Thứ 2' }, { hot: 0, total: 0, day: 'Thứ 3' },
                { hot: 0, total: 0, day: 'Thứ 4' }, { hot: 0, total: 0, day: 'Thứ 5' },
                { hot: 0, total: 0, day: 'Thứ 6' }, { hot: 0, total: 0, day: 'Thứ 7' },
                { hot: 0, total: 0, day: 'CN' }
              ].map((data, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end group h-full relative cursor-pointer">
                  <div className="w-full flex justify-center items-end h-full">
                    <div className="w-full max-w-[40px] relative h-full flex items-end opacity-90 group-hover:opacity-100 transition-opacity">
                      {/* Background Bar */}
                      <div className="absolute bottom-0 w-full bg-slate-100 rounded-t-xl transition-all duration-1000 ease-out group-hover:bg-blue-50" style={{ height: mounted ? `${data.total}%` : '0%' }}></div>
                      {/* Foreground Bar */}
                      <div className="absolute bottom-0 w-full bg-[#F58220] rounded-t-xl transition-all duration-1000 ease-out shadow-sm group-hover:shadow-[0_0_15px_rgba(245,130,32,0.4)]" style={{ height: mounted ? `${data.hot}%` : '0%', transitionDelay: `${i * 100}ms` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-[11px] font-bold text-slate-400 border-t border-slate-100 pt-4 px-2">
              <span>Thứ 2</span><span>Thứ 3</span><span>Thứ 4</span><span>Thứ 5</span><span>Thứ 6</span><span>Thứ 7</span><span>CN</span>
            </div>
          </div>

          {/* RECENT ACTIVITIES */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Hoạt Động Gần Đây</h2>
            </div>
            
            <div className="flex flex-col gap-5 flex-1">
              {/* Empty State */}
              <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-70">
                <p className="text-sm font-bold">Chưa có hoạt động nào</p>
                <p className="text-xs mt-1 text-center">Hệ thống sẽ cập nhật ngay khi có sự kiện mới.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
