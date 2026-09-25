"use client"
import React, { useState, useEffect } from 'react';
import { 
  Activity, Calendar, Clock, Users, Play, Trophy, MessageSquare, Filter, Search, ChevronRight, Video, Target, CheckCircle2, Download
} from "lucide-react";

export default function AnalyticsPage() {
  const [activeSession, setActiveSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'MINIGAME' | 'GENERAL' | 'TIKTOK_STATS'>('MINIGAME');
  const [showSessionFilter, setShowSessionFilter] = useState(false);
  const [sessionFilter, setSessionFilter] = useState('Tất cả');
  
  const [sessions, setSessions] = useState<any[]>([]);

  const [minigameComments, setMinigameComments] = useState<any[]>([]);
  const [generalComments, setGeneralComments] = useState<any[]>([]);

  useEffect(() => {
    // Tải danh sách phiên live từ DB
    import('@/lib/api').then(({ LiveSessionAPI }) => {
      LiveSessionAPI.getAll().then((apiSessions: any[]) => {
        if (apiSessions && apiSessions.length > 0) {
          setActiveSession(apiSessions[0].id);
          
          // Đọc data từ localStorage cho từng phiên
          const liveSessions = apiSessions.map((s: any) => ({
            id: s.id,
            name: s.title,
            date: s.date || "Hôm nay",
            duration: "1h 30m",
            views: "0", 
            comments: 0
          }));

        setSessions(prev => {
          // Merge avoiding duplicates by id
          const merged = [...liveSessions];
          prev.forEach(p => {
            if (!merged.find(m => m.id == p.id)) merged.push(p);
          });
          return merged;
        });
      }
      }).catch(e => console.log(e));
    });
  }, []);

  // Update data when active session changes
  useEffect(() => {
    if (!activeSession) return;
    
    import('@/lib/api').then(({ api }) => {
      api.get('/dashboard/analytics/' + activeSession).then((res: any) => {
        const allComments = res?.data?.rawData?.comments || [];
        const mg = allComments.filter((c: any) => c.intent === 'Tham gia Minigame').map((c: any) => ({
          user: c.user,
          question: "Minigame",
          answer: c.content,
          isCorrect: c.content.includes("1.C") || c.content.includes("A") || c.content.includes("B"),
          time: c.time
        }));
        
        const gen = allComments.filter((c: any) => c.intent !== 'Tham gia Minigame').map((c: any) => ({
          user: c.user,
          text: c.content,
          intent: c.intent,
          time: c.time
        }));

        setMinigameComments(mg);
        setGeneralComments(gen);
      });
    });
  }, [activeSession, sessions]);

  return (
    <div className="flex h-full flex-col bg-slate-50 font-sans">
      
      {/* HEADER */}
      <div className="h-[88px] bg-white border-b border-slate-200 px-8 flex flex-col justify-center shrink-0 shadow-sm z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="text-[#005691]" /> Phân Tích & Lịch Sử Livestream
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Xem lại dữ liệu các phiên LIVE và toàn bộ comment đã thu thập</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL: SESSION LIST */}
        <div className="w-[350px] border-r border-slate-200 bg-white flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 shrink-0">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 relative">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider">Danh sách Phiên LIVE</h2>
            
            <button onClick={() => setShowSessionFilter(!showSessionFilter)} className={`p-1.5 rounded-md transition-colors ${showSessionFilter ? 'bg-[#005691] text-white' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'}`}>
              <Filter size={16} />
            </button>

            {showSessionFilter && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSessionFilter(false)}></div>
                <div className="absolute top-12 right-5 w-48 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-50">
                  <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase bg-slate-50 border-b border-slate-100">Lọc theo dữ liệu</div>
                  {['Tất cả', 'Có bình luận', 'Chưa có bình luận'].map(f => (
                    <div 
                      key={f}
                      onClick={() => { setSessionFilter(f); setShowSessionFilter(false); }}
                      className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${sessionFilter === f ? 'bg-[#005691] text-white font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      {f}
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {sessions.filter(s => {
              if (sessionFilter === 'Có bình luận') return s.comments > 0;
              if (sessionFilter === 'Chưa có bình luận') return s.comments === 0;
              return true;
            }).map(s => (
              <div 
                key={s.id} 
                onClick={() => setActiveSession(s.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${activeSession === s.id ? 'bg-blue-50/50 border-[#005691] shadow-sm ring-1 ring-blue-500/20' : 'bg-white border-slate-200 hover:border-[#005691]'}`}
              >
                <h3 className={`font-bold text-sm mb-2 ${activeSession === s.id ? 'text-[#005691]' : 'text-slate-800'}`}>{s.name}</h3>
                <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400">
                  <span className="flex items-center gap-1.5"><Calendar size={12} /> {s.date}</span>
                  <span className="flex items-center gap-1.5"><Clock size={12} /> {s.duration}</span>
                </div>
                <div className="mt-3 flex items-center gap-3 pt-3 border-t border-slate-100/80">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md"><Users size={12} /> {s.views}</span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md"><MessageSquare size={12} /> {s.comments}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: SESSION DETAILS & COMMENTS */}
        <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-hidden">
          <div className="p-8 pb-4 shrink-0">
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-6">Chi tiết Phiên LIVE {sessions.find(s => s.id === activeSession)?.name}</h2>
            
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit mb-4">
              <button onClick={() => setActiveTab('MINIGAME')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'MINIGAME' ? 'bg-white text-[#F58220] shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                <Trophy size={16} /> Lịch sử Minigame (Đáp án)
              </button>
              <button onClick={() => setActiveTab('GENERAL')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'GENERAL' ? 'bg-white text-[#005691] shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                <MessageSquare size={16} /> Comment Hỏi Đáp (Nhu cầu khác)
              </button>
              <button onClick={() => setActiveTab('ALL_COMMENTS' as any)} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'ALL_COMMENTS' as any ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                <Users size={16} /> Tất cả Comment
              </button>
              <button onClick={() => setActiveTab('TIKTOK_STATS')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'TIKTOK_STATS' ? 'bg-[#111] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                <Activity size={16} /> Hiệu suất TikTok LIVE
              </button>
              <button onClick={() => setActiveTab('LEADERBOARD' as any)} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'LEADERBOARD' as any ? 'bg-white text-[#00A859] shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                <Target size={16} /> Bảng xếp hạng
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-8">
            
            {activeTab === 'TIKTOK_STATS' && (
              <div className="bg-[#18191a] rounded-3xl p-6 text-white shadow-xl">
                
                {/* Dashboard Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded overflow-hidden bg-white/10 flex items-center justify-center font-black text-xl text-orange-500">
                      FPT
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{sessions.find(s => s.id === activeSession)?.name || 'HƯỚNG DẪN NHẬP HỌC...'}</h3>
                      <p className="text-xs text-white/50 mt-1">11:59 SA, 18 tháng 8 2026</p>
                    </div>
                  </div>
                  <div className="flex gap-12 text-center">
                    <div>
                      <p className="text-xs text-white/50 mb-1">Thời lượng</p>
                      <p className="font-bold text-sm">2 giờ 12 phút</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/50 mb-1">Lượt xem</p>
                      <p className="font-bold text-sm">6,977</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/50 mb-1">Follower mới</p>
                      <p className="font-bold text-sm">5</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/50 mb-1">Kim cương</p>
                      <p className="font-bold text-sm text-yellow-400 flex items-center gap-1 justify-center">💎 16</p>
                    </div>
                  </div>
                </div>

                <h4 className="font-bold mb-4">Số liệu chính</h4>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-5 gap-4">
                  
                  {/* Cột 1 */}
                  <div className="bg-white/5 rounded-2xl p-5">
                    <h5 className="text-xs font-bold text-white/60 mb-4 flex items-center gap-1">Số liệu người xem <div className="w-3 h-3 rounded-full border border-white/40 flex items-center justify-center text-[8px]">?</div></h5>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center"><span className="text-sm text-white/80">Lượt xem</span><span className="font-bold">6,977</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm text-white/80">Người xem duy nhất</span><span className="font-bold">6,254</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm text-white/80">Người xem tích cực</span><span className="font-bold">60</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm text-white/80">Người xem đồng thời cao nhất</span><span className="font-bold">369</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm text-white/80">Thời lượng xem TB</span><span className="font-bold">14 giây</span></div>
                    </div>
                  </div>

                  {/* Cột 2 */}
                  <div className="bg-white/5 rounded-2xl p-5">
                    <h5 className="text-xs font-bold text-white/60 mb-4 flex items-center gap-1">Tương tác <div className="w-3 h-3 rounded-full border border-white/40 flex items-center justify-center text-[8px]">?</div></h5>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center"><span className="text-sm text-white/80">Bình luận</span><span className="font-bold">170</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm text-white/80">Lượt thích</span><span className="font-bold">3,877</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm text-white/80">Lượt chia sẻ</span><span className="font-bold">8</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm text-white/80">Người gửi quà tặng</span><span className="font-bold">1</span></div>
                    </div>
                  </div>

                  {/* Cột 3 */}
                  <div className="bg-white/5 rounded-2xl p-5">
                    <h5 className="text-xs font-bold text-white/60 mb-4 flex items-center gap-1">Nguồn lưu lượng truy cập <div className="w-3 h-3 rounded-full border border-white/40 flex items-center justify-center text-[8px]">?</div></h5>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center"><span className="text-sm text-white/80">Đề xuất phiên LIVE</span><span className="font-bold">96%</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm text-white/80">Bài đăng của bạn</span><span className="font-bold">0%</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm text-white/80">Bảng tin Đã follow</span><span className="font-bold">2%</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm text-white/80">Chia sẻ</span><span className="font-bold">0%</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm text-white/80">Khác</span><span className="font-bold">1%</span></div>
                    </div>
                  </div>

                  {/* Cột 4 */}
                  <div className="bg-white/5 rounded-2xl p-5">
                    <h5 className="text-xs font-bold text-white/60 mb-4 flex items-center gap-1">Từ follower <div className="w-3 h-3 rounded-full border border-white/40 flex items-center justify-center text-[8px]">?</div></h5>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center"><span className="text-sm text-white/80">Thời lượng xem TB</span><span className="font-bold">3 phút</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm text-white/80">Người xem duy nhất</span><span className="font-bold">179</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm text-white/80">Người bình luận</span><span className="font-bold">22</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm text-white/80">Người gửi quà tặng</span><span className="font-bold">1</span></div>
                    </div>
                  </div>

                  {/* Cột 5 */}
                  <div className="bg-white/5 rounded-2xl p-5">
                    <h5 className="text-xs font-bold text-white/60 mb-4">Phần thưởng LIVE theo tỷ lệ</h5>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center"><span className="text-sm text-white/80">Tạm tính phiên LIVE này</span><span className="font-bold">USD0.06</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm text-white/80">Kim cương</span><span className="font-bold text-yellow-400">16</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm text-white/80">% phiên LIVE này</span><span className="font-bold">40%</span></div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'LEADERBOARD' as any && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-sm font-bold text-slate-500">Lọc theo:</span>
                  <select className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 outline-none">
                    <option>Tuần này</option>
                    <option>Tháng này</option>
                    <option>Năm nay</option>
                    <option>Tất cả thời gian</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  {/* Bảng Trả Lời Đúng */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-[#F58220]">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800">Top Trả Lời Đúng Nhiều Nhất</h3>
                        <p className="text-xs font-bold text-slate-400">Dành cho Minigame</p>
                      </div>
                    </div>
                    <div className="p-2">
                      {[
                        { rank: 1, user: '@thanhdo.2k6', count: 45 },
                        { rank: 2, user: '@hoaianh_05', count: 32 },
                        { rank: 3, user: '@khanhvu.media', count: 28 },
                        { rank: 4, user: '@tuan.pham.design', count: 21 },
                        { rank: 5, user: '@yen.vu.biz', count: 15 },
                      ].map(u => (
                        <div key={u.user} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${u.rank === 1 ? 'bg-yellow-100 text-yellow-600' : u.rank === 2 ? 'bg-slate-200 text-slate-600' : u.rank === 3 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>{u.rank}</span>
                            <span className="text-sm font-bold text-slate-800">{u.user}</span>
                          </div>
                          <span className="text-xs font-bold bg-[#F58220]/10 text-[#F58220] px-2.5 py-1 rounded-md">{u.count} câu đúng</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bảng Trúng Quà */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-[#00A859]">
                        <Trophy size={20} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800">Top Trúng Quà Nhiều Nhất</h3>
                        <p className="text-xs font-bold text-slate-400">Phần thưởng đã nhận</p>
                      </div>
                    </div>
                    <div className="p-2">
                      {[
                        { rank: 1, user: '@thanhdo.2k6', count: 12, last: 'Balo FPT University' },
                        { rank: 2, user: '@hoaianh_05', count: 8, last: 'Bình giữ nhiệt FPT' },
                        { rank: 3, user: '@khanhvu.media', count: 5, last: 'Áo thun Cam FPT' },
                        { rank: 4, user: '@truc.thanh', count: 4, last: 'Móc khóa Ếch xanh Pepe' },
                        { rank: 5, user: '@bao.gia', count: 3, last: 'Móc khóa Ếch xanh Pepe' },
                      ].map(u => (
                        <div key={u.user} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${u.rank === 1 ? 'bg-yellow-100 text-yellow-600' : u.rank === 2 ? 'bg-slate-200 text-slate-600' : u.rank === 3 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>{u.rank}</span>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{u.user}</p>
                              <p className="text-[10px] font-medium text-slate-400">Gần nhất: {u.last}</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold bg-[#00A859]/10 text-[#00A859] px-2.5 py-1 rounded-md">{u.count} phần quà</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 'MINIGAME' || activeTab === 'GENERAL' || activeTab === 'ALL_COMMENTS') && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                {/* TABLE HEADER */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 bg-slate-50/80 text-xs font-black text-slate-500 uppercase tracking-wider">
                  <div className="col-span-2">Thời gian</div>
                  <div className="col-span-3">Tài khoản TikTok</div>
                  <div className="col-span-4">Nội dung Comment</div>
                  <div className="col-span-3">{activeTab === 'MINIGAME' ? 'Câu hỏi & Phân loại' : activeTab === 'GENERAL' ? 'AI Phân tích Nhu cầu' : 'Phân loại dữ liệu'}</div>
                </div>

                {/* TABLE BODY */}
                <div className="flex flex-col flex-1">
                  {activeTab === 'MINIGAME' ? (
                    minigameComments.map((cmt, i) => (
                      <div key={i} className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 hover:bg-slate-50 items-center transition-colors">
                        <div className="col-span-2 text-xs font-bold text-slate-400">{cmt.time}</div>
                        <div className="col-span-3 text-sm font-bold text-slate-800">{cmt.user}</div>
                        <div className="col-span-4 text-sm font-semibold text-slate-600">"{cmt.answer}"</div>
                        <div className="col-span-3 flex items-center gap-3">
                          <span className="text-[10px] font-black bg-slate-100 px-2.5 py-1 rounded text-slate-600">{cmt.question}</span>
                          {cmt.isCorrect ? (
                            <span className="flex items-center gap-1 text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100"><CheckCircle2 size={12} /> HỢP LỆ</span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-black text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100">SAI ĐÁP ÁN</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : activeTab === 'GENERAL' ? (
                    generalComments.map((cmt, i) => (
                      <div key={i} className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 hover:bg-slate-50 items-center transition-colors">
                        <div className="col-span-2 text-xs font-bold text-slate-400">{cmt.time}</div>
                        <div className="col-span-3 text-sm font-bold text-slate-800">{cmt.user}</div>
                        <div className="col-span-4 text-sm font-semibold text-slate-600">"{cmt.text}"</div>
                        <div className="col-span-3">
                          <span className="text-[10px] font-black text-[#005691] bg-blue-50 px-2.5 py-1 rounded border border-blue-100 inline-flex items-center gap-1.5">
                            <Target size={12} /> {cmt.intent}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    [...minigameComments.map(c => ({...c, _type: 'minigame'})), ...generalComments.map(c => ({...c, _type: 'general'}))].sort((a,b) => a.time.localeCompare(b.time)).map((cmt, i) => (
                      <div key={i} className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 hover:bg-slate-50 items-center transition-colors">
                        <div className="col-span-2 text-xs font-bold text-slate-400">{cmt.time}</div>
                        <div className="col-span-3 text-sm font-bold text-slate-800">{cmt.user}</div>
                        <div className="col-span-4 text-sm font-semibold text-slate-600">"{cmt.answer || cmt.text}"</div>
                        <div className="col-span-3">
                          {cmt._type === 'minigame' ? (
                            <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2.5 py-1.5 rounded border border-orange-100 flex items-center gap-1.5 w-fit"><Trophy size={12}/> Minigame</span>
                          ) : (
                            <span className="text-[10px] font-black text-[#005691] bg-blue-50 px-2.5 py-1.5 rounded border border-blue-100 flex items-center gap-1.5 w-fit"><MessageSquare size={12}/> Hỏi đáp</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
