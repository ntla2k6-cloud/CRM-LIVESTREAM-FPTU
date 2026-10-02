'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Loader2, Sparkles, Zap, ShieldCheck, Puzzle, Activity, Users, Clock, ArrowRight } from 'lucide-react';

export default function LiveConnectPage() {
  const router = useRouter();
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!inputUrl) return;
    setIsLoading(true);
    setError(null);
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${baseUrl}/live-engine/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputUrl })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Không thể lấy thông tin LIVE');
      }
      
      router.push(`/live/${data.id}?autoConnect=true&tiktokUsername=${data.creatorUsername}`);
    } catch (e: any) {
      setError(e.message || 'Lỗi mạng hoặc server không phản hồi');
    } finally {
      setIsLoading(false);
    }
  };

  const recentSessions = [
    { id: '1', name: '@fptuhcm_official', date: 'Hôm nay, 19:00', comments: 12450, leads: 342, status: 'Hoàn thành' },
    { id: '2', name: '@ngauviz_dev', date: 'Hôm qua, 20:30', comments: 8230, leads: 156, status: 'Hoàn thành' },
    { id: '3', name: '@admissions_fptu', date: '01/10/2026', comments: 15600, leads: 512, status: 'Hoàn thành' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 flex flex-col items-center">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT COLUMN: CONNECTION FORM */}
        <div className="lg:col-span-3 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="bg-slate-900 p-8 relative overflow-hidden flex-shrink-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 translate-y-1/2"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-orange-500 text-white p-2.5 rounded-xl">
                  <Zap size={24} className="fill-white" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">KẾT NỐI TIKTOK LIVE</h1>
              </div>
              <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-lg">
                Hệ thống tự động đồng bộ bình luận, phân loại ý định người dùng bằng AI (Lead, Hỏi đáp, Đăng ký) theo thời gian thực.
              </p>
            </div>
          </div>

          <div className="p-8 flex-1 flex flex-col justify-center">
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                Nhập Username hoặc Link LIVE
              </label>
              <input 
                type="text" 
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="VD: @fptuhcm hoặc nhập MOCK để giả lập"
                disabled={isLoading}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-[#F58220] focus:ring-4 focus:ring-orange-100 transition-all font-medium text-slate-900 text-lg shadow-inner"
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              />
              {error && (
                <p className="text-red-500 text-sm font-bold mt-3 flex items-center gap-1.5 bg-red-50 p-2 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> {error}
                </p>
              )}
            </div>

            <button 
              onClick={handleConnect}
              disabled={!inputUrl || isLoading}
              className="w-full bg-[#F58220] hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-black transition-all flex items-center justify-center gap-3 text-lg shadow-lg shadow-orange-500/20"
            >
              {isLoading ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  ĐANG KẾT NỐI...
                </>
              ) : (
                <>
                  <Play size={24} className="fill-white" />
                  KHỞI TẠO PHIÊN LIVE
                </>
              )}
            </button>
            
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-500">
                <div className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-green-500" /> Server-side Connect</div>
                <div className="flex items-center gap-1.5"><Sparkles size={16} className="text-blue-500" /> Auto Classification</div>
                <div className="flex items-center gap-1.5"><Puzzle size={16} className="text-orange-500" /> Extension Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DASHBOARD WIDGETS */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Extension Banner */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-xl border border-slate-700 overflow-hidden text-white p-6 relative">
            <div className="absolute top-0 right-0 p-32 bg-blue-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
            <div className="relative z-10">
              <h2 className="text-lg font-black mb-3 flex items-center gap-2">
                <Puzzle className="text-blue-400" size={20} /> 
                Bắt 100% Comment
              </h2>
              <p className="text-slate-400 text-xs font-medium mb-4 leading-relaxed">
                Dùng <b className="text-white">FPTU EXTENSION</b> để bỏ qua giới hạn chống Bot của Tiktok.
              </p>
              <div className="space-y-3">
                <div className="bg-white/10 rounded-xl p-3 border border-white/5 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">1</div>
                  <h3 className="font-bold text-xs">Mở Extension và dán ID Phiên</h3>
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/5 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">2</div>
                  <h3 className="font-bold text-xs">Nhận comment tức thì độ trễ 0s</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 flex-1 flex flex-col">
            <h2 className="text-slate-800 font-black mb-4 flex items-center gap-2 text-sm uppercase">
              <Activity size={18} className="text-orange-500" />
              Tổng quan hệ thống
            </h2>
            <div className="grid grid-cols-2 gap-4 flex-1">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-center">
                <div className="text-3xl font-black text-slate-800">42.5K</div>
                <div className="text-xs font-bold text-slate-400 uppercase mt-1">Bình luận đã xử lý</div>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex flex-col justify-center">
                <div className="text-3xl font-black text-orange-600">1,010</div>
                <div className="text-xs font-bold text-orange-400 uppercase mt-1">Leads (Có SĐT)</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* BOTTOM FULL-WIDTH: RECENT SESSIONS */}
        <div className="lg:col-span-5 bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Clock size={20} className="text-blue-500" />
              Phiên LIVE gần đây
            </h2>
            <button className="text-sm font-bold text-orange-500 flex items-center gap-1 hover:text-orange-600">
              Xem tất cả <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentSessions.map(session => (
              <div key={session.id} className="border border-slate-200 rounded-2xl p-5 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100 transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-orange-600 transition-colors">{session.name}</h3>
                    <p className="text-xs font-semibold text-slate-400 mt-1">{session.date}</p>
                  </div>
                  <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded uppercase">
                    {session.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm font-bold text-slate-600">
                  <div className="flex items-center gap-1.5"><Users size={16} className="text-slate-400" /> {session.comments.toLocaleString()} Cmt</div>
                  <div className="flex items-center gap-1.5"><Zap size={16} className="text-orange-400" /> {session.leads} Leads</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
