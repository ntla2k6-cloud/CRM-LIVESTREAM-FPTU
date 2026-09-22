"use client"
import React, { useState, useEffect } from 'react';
import { 
  Video, Calendar, Clock, Users, ArrowRight, MoreVertical, Plus, 
  CheckCircle2, AlertCircle, FileText, Download, Play, MessageSquare, Phone
} from 'lucide-react';
import Link from 'next/link';
import { LiveSessionAPI } from '@/lib/api';

export default function LiveSessionListPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const data = await LiveSessionAPI.getAll();
      const safeData = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      const getSafeNumber = (val: any) => Array.isArray(val) ? val.length : (Number(val) || 0);
      
      const formatDate = (ds: any) => {
        try { return ds ? new Date(ds).toLocaleDateString('vi-VN') : 'Chưa xếp lịch' } catch(e) { return 'Chưa xếp lịch' }
      };
      const formatTime = (ds: any) => {
        try { return ds ? new Date(ds).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : '' } catch(e) { return '' }
      };

      const mappedData = safeData.map((s: any) => ({
        ...s,
        date: formatDate(s?.startTime),
        time: formatTime(s?.startTime),
        host: 'Admin',
        viewers: getSafeNumber(s?.viewers),
        leads: getSafeNumber(s?.leads),
        // Map đúng status từ backend
        status: s?.status === 'SCHEDULED' ? 'UPCOMING' 
              : s?.status === 'ONGOING' ? 'LIVE_NOW'
              : s?.status  // LIVE_NOW, COMPLETED giữ nguyên
      }));
      setSessions(mappedData);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    const title = prompt('Nhập tên phiên Live:') || 'Phiên Live Mới';
    try {
      await LiveSessionAPI.create({
        title,
        status: 'SCHEDULED',
        startTime: new Date().toISOString(),
      });
      fetchSessions();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 min-h-full p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Video className="text-[#F58220]" /> Quản Lý Phiên LIVE (Sessions)
            </h1>
            <p className="text-sm font-bold text-slate-500 mt-1">
              Khởi tạo kịch bản, điều khiển và lưu trữ lịch sử cho từng phiên riêng biệt.
            </p>
          </div>
          <button 
            onClick={handleCreateSession}
            className="w-full md:w-auto bg-gradient-to-r from-[#F58220] to-[#e07010] text-white px-5 py-3 md:py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Tạo Phiên LIVE Mới
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Tổng số Phiên', value: sessions.length, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Tổng Mắt xem', value: sessions.reduce((acc, curr) => acc + (curr.viewers || 0), 0).toLocaleString(), icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Lead thu được', value: sessions.reduce((acc, curr) => acc + (curr.leads || 0), 0).toLocaleString(), icon: Phone, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Đang chuẩn bị', value: sessions.filter(s => s.status === 'UPCOMING').length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
                <stat.icon size={20} className="md:w-6 md:h-6" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-black text-slate-900 leading-none">{stat.value}</p>
                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* TÌNH TRẠNG: ĐANG LIVE */}
        <div className="mb-8">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Đang diễn ra
          </h2>
          <div className="flex flex-col gap-4">
            {sessions.filter(s => s.status === 'LIVE' || s.status === 'LIVE_NOW').map(session => (
              <div key={session.id} className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm group hover:border-red-200 transition-colors">
                
                <div className="flex items-center gap-6">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                      <img src="/placeholder-live.jpg" alt="thumbnail" className="w-full h-full object-cover opacity-50" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="text-white fill-white" size={24} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-red-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span> TRỰC TIẾP
                      </span>
                      <span className="text-xs font-bold text-slate-400">{session.date} • {session.time}</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight">{session.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-500">
                      <span className="flex items-center gap-1.5"><Users size={16} className="text-blue-500" /> {(session.viewers || 0).toLocaleString()} đang xem</span>
                      <span className="flex items-center gap-1.5"><MessageSquare size={16} className="text-orange-500" /> {session.leads || 0} Lead SĐT</span>
                    </div>
                  </div>
                </div>
                
                <Link href={`/live/${session.id}`} className="bg-red-50 hover:bg-red-500 text-red-600 hover:text-white px-6 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 group-hover:shadow-lg shadow-red-500/20 border border-red-100 group-hover:border-red-500 w-full lg:w-auto">
                  VÀO PHÒNG ĐIỀU KHIỂN <ArrowRight size={20} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* LỊCH TRÌNH TIẾP THEO & ĐÃ KẾT THÚC */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* UPCOMING */}
          <div>
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Calendar size={14} /> Sắp diễn ra
            </h2>
            <div className="flex flex-col gap-4">
              {sessions.filter(s => s.status === 'UPCOMING').map(session => (
                <div key={session.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-[#F58220] transition-colors group">
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-orange-50 text-[#F58220] text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border border-orange-100">
                      Chuẩn bị kịch bản
                    </span>
                    <button className="text-slate-400 hover:text-slate-900"><MoreVertical size={16} /></button>
                  </div>
                  <h3 className="text-base font-black text-slate-900 mb-1">{session.title}</h3>
                  <p className="text-xs font-bold text-slate-500 mb-4">{session.date} • {session.time}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[8px]">{session.host[0]}</div>
                      Host: {session.host}
                    </span>
                    <Link href={`/live/${session.id}`} className="text-xs font-black text-[#005691] hover:text-[#F58220] flex items-center gap-1 transition-colors">
                      Soạn kịch bản <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COMPLETED (ARCHIVE) */}
          <div>
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <CheckCircle2 size={14} /> Đã hoàn tất (Kho lưu trữ)
            </h2>
            <div className="flex flex-col gap-4">
              {sessions.filter(s => s.status === 'COMPLETED').map(session => (
                <div key={session.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-5 group">
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-slate-200 text-slate-500 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border border-slate-300">
                      Đã Kết Thúc
                    </span>
                    <button className="text-slate-400 hover:text-slate-900"><Download size={16} /></button>
                  </div>
                  <h3 className="text-base font-black text-slate-700 mb-1">{session.title}</h3>
                  <p className="text-xs font-bold text-slate-400 mb-4">{session.date} • Đạt {(session.viewers || 0).toLocaleString()} view</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <span className="text-xs font-bold text-[#00A859] flex items-center gap-1.5">
                      Thu được {session.leads || 0} Lead
                    </span>
                    <Link href={`/live/${session.id}/report`} className="text-xs font-black text-slate-500 hover:text-[#005691] flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition-colors">
                      📊 Xem Báo Cáo <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
