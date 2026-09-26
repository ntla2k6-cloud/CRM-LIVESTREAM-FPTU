"use client"
import React, { useState, useEffect } from 'react';
import { BarChart3, Users, MessageSquare, Phone, TrendingUp, ChevronLeft, Calendar, FileText, Search, Trophy, Download } from 'lucide-react';
import Link from 'next/link';

export default function PostLiveReportPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'COMMENTS' | 'LEADS' | 'WINNERS'>('DASHBOARD');
  const [liveData, setLiveData] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sessionId = window.location.pathname.split('/')[2] || params.id;
      const saved = localStorage.getItem(`live_report_${sessionId}`);
      if (saved) {
        try {
          setLiveData(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, [params.id]);

  // Mock Data cho Dashboard Báo cáo (Dữ liệu nền)
  const baseReportData = {
    totalViewers: "12,450",
    peakViewers: "3,200",
    totalComments: "8,942",
    totalLeads: 145,
    totalGames: 3,
    topKeywords: [
      { word: "Học phí", count: 1205, percentage: 45 },
      { word: "Ký túc xá", count: 850, percentage: 30 },
      { word: "Ngành AI", count: 420, percentage: 15 },
      { word: "Học bổng", count: 215, percentage: 10 },
    ],
    timelineData: [
      { time: '20:00', label: 'Opening', viewers: 1200, comments: 300 },
      { time: '20:15', label: 'Minigame 1', viewers: 2800, comments: 1500 },
      { time: '20:30', label: 'Tư vấn Ngành', viewers: 2500, comments: 800 },
      { time: '20:45', label: 'Minigame 2', viewers: 3200, comments: 2100 },
      { time: '21:00', label: 'Q&A (Ký túc xá)', viewers: 2900, comments: 1200 },
      { time: '21:15', label: 'Closing & CTA', viewers: 2100, comments: 900 },
    ],
    comments: [
      { id: 1, time: '20:00:12', user: '@nhan.nguyen', content: 'Chào ad ạ', intent: 'Bình thường' },
      { id: 2, time: '20:01:05', user: '@phong.le', content: 'Live nét căng', intent: 'Bình thường' },
      { id: 3, time: '20:15:33', user: '@hoang.vu', content: 'Điểm chuẩn IT năm nay dự kiến bn ạ?', intent: 'Hỏi đáp' },
      { id: 4, time: '20:16:01', user: '@minh_fptu', content: 'Tư vấn em với ạ 0912345678', intent: 'Có SĐT' },
    ],
    leads: [
      { id: 1, time: '20:16:01', user: '@minh_fptu', info: '0912345678', type: 'SĐT Trực tiếp', status: 'Đã tư vấn', note: 'Quan tâm ngành SE' },
    ],
    winners: []
  };

  // Trộn dữ liệu từ LocalStorage nếu có
  const reportData = {
    ...baseReportData,
    totalComments: liveData?.totalComments || baseReportData.totalComments,
    totalLeads: liveData?.totalLeads || baseReportData.totalLeads,
    comments: liveData?.comments?.length > 0 ? liveData.comments : baseReportData.comments,
    leads: liveData?.leads?.length > 0 ? liveData.leads : baseReportData.leads,
    winners: liveData?.winners?.length > 0 ? liveData.winners : baseReportData.winners,
    topKeywords: liveData?.keywordStats && Object.keys(liveData.keywordStats).length > 0 
      ? Object.entries(liveData.keywordStats)
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 4)
          .map(([word, count]: any) => ({ word, count, percentage: Math.min(100, (count / 50) * 100) }))
      : baseReportData.topKeywords
  };

  // ============ CHỨC NĂNG XUẤT EXCEL (CSV) ============
  const handleExportExcel = () => {
    let csv = "\uFEFF"; // BOM for UTF-8 Excel support
    let filename = `BaoCao_Live_${params.id}`;

    if (activeTab === 'LEADS') {
      csv += "Thời gian,User,Liên hệ,Nhu cầu,Trạng thái,Ghi chú\n";
      reportData.leads.forEach((l: any) => {
        csv += `"${l.time}","${l.user}","${l.info}","${l.type}","${l.status}","${l.note}"\n`;
      });
      filename += "_Leads.csv";
    } else if (activeTab === 'WINNERS') {
      csv += "Hạng,User,Thời gian,Đáp án,Loại,Phần quà\n";
      reportData.winners.forEach((w: any) => {
        csv += `"${w.rank}","${w.user}","${w.time}","${w.answer}","${w.type}","${w.gift}"\n`;
      });
      filename += "_Winners.csv";
    } else if (activeTab === 'COMMENTS') {
      csv += "Thời gian,User,Nội dung,Phân loại AI\n";
      reportData.comments.forEach((c: any) => {
        csv += `"${c.time}","${c.user}","${c.content.replace(/"/g, '""')}","${c.intent}"\n`;
      });
      filename += "_Comments.csv";
    } else {
      alert("Chuyển sang Tab Comment, Leads hoặc Winners để xuất Excel nhé sếp!");
      return;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/live" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Báo Cáo Tổng Kết Phiên Live</h1>
            <p className="text-sm font-medium text-slate-500 flex items-center gap-2 mt-1">
              <Calendar size={14} /> Hôm nay • Phiên #023 • Nền tảng: TikTok
            </p>
          </div>
        </div>
        <button onClick={handleExportExcel} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg active:scale-95">
          <Download size={16} /> Xuất Excel Dữ Liệu
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 bg-white p-1.5 rounded-2xl border border-slate-200 inline-flex shadow-sm">
        <button onClick={() => setActiveTab('DASHBOARD')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'DASHBOARD' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}>
          <BarChart3 size={16} /> Tổng Quan
        </button>
        <button onClick={() => setActiveTab('COMMENTS')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'COMMENTS' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>
          <MessageSquare size={16} /> Lịch Sử Comment ({reportData.totalComments})
        </button>
        <button onClick={() => setActiveTab('LEADS')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'LEADS' ? 'bg-red-50 text-red-700' : 'text-slate-500 hover:bg-slate-50'}`}>
          <Phone size={16} /> Danh Sách Leads ({reportData.totalLeads})
        </button>
        <button onClick={() => setActiveTab('WINNERS')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'WINNERS' ? 'bg-green-50 text-green-700' : 'text-slate-500 hover:bg-slate-50'}`}>
          <Trophy size={16} /> Quản Lý Trúng Quà
        </button>
      </div>

      {activeTab === 'DASHBOARD' && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Users size={20} /></div>
              </div>
              <p className="text-3xl font-black text-slate-900 mb-1">{reportData.totalViewers}</p>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Tổng Lượt Xem</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><MessageSquare size={20} /></div>
              </div>
              <p className="text-3xl font-black text-slate-900 mb-1">{reportData.totalComments}</p>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Tổng Comment</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center"><Phone size={20} /></div>
              </div>
              <p className="text-3xl font-black text-slate-900 mb-1">{reportData.totalLeads}</p>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Leads (SĐT & Nhu cầu)</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center"><BarChart3 size={20} /></div>
              </div>
              <p className="text-3xl font-black text-slate-900 mb-1">{reportData.peakViewers}</p>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Peak Mắt Xem (Đỉnh)</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 flex-1">
            {/* Timeline Analysis */}
            <div className="col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-[#F58220]" /> Phân Tích Hiệu Quả Timeline
              </h2>
              
              <div className="space-y-4">
                {reportData.timelineData.map((node, i) => (
                  <div key={i} className="flex items-center gap-6">
                    <div className="w-16 text-right">
                      <p className="text-sm font-black text-slate-800">{node.time}</p>
                    </div>
                    
                    {/* Visual Bar */}
                    <div className="flex-1 relative">
                      <div className="flex items-center gap-2 w-full">
                        {/* Viewers Bar */}
                        <div className="h-4 bg-blue-100 rounded-full relative group cursor-pointer transition-all hover:bg-blue-200" style={{ width: `${(node.viewers / 3200) * 100}%` }}>
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                            {node.viewers} Views
                          </div>
                        </div>
                        {/* Comments Bar */}
                        <div className="h-4 bg-green-400 rounded-full relative group cursor-pointer transition-all hover:bg-green-500" style={{ width: `${(node.comments / 2100) * 100}%` }}>
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                            {node.comments} Cmt
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-40">
                      <p className="text-xs font-bold text-slate-500 uppercase truncate">{node.label}</p>
                      {node.label.includes('Minigame') && <span className="text-[9px] bg-yellow-100 text-yellow-700 font-black px-1.5 py-0.5 rounded">TƯƠNG TÁC ĐỈNH</span>}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 flex items-center justify-center gap-6 border-t border-slate-100 pt-6">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-100"></span><span className="text-xs font-bold text-slate-500">Người xem (Viewers)</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-400"></span><span className="text-xs font-bold text-slate-500">Lượng bình luận</span></div>
              </div>
            </div>

            {/* AI Intent & Keywords */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col">
              <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <FileText size={20} className="text-[#005691]" /> Keyword Analysis
              </h2>
              
              <div className="space-y-5">
                {reportData.topKeywords.map((kw, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-slate-800">#{kw.word}</span>
                      <span className="font-black text-[#005691]">{kw.count} lượt</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#005691] to-[#00A859]" style={{ width: `${kw.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">💡 AI Insight Report</h3>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                  Minigame số 2 thu hút lượng bình luận <strong>tăng đột biến (+120%)</strong>. Khán giả cực kỳ quan tâm về chủ đề <strong>Học phí</strong> và <strong>Ký túc xá</strong>. Khuyến nghị VJ nói chậm hơn ở phần này trong phiên sau.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* COMMENTS TAB */}
      {activeTab === 'COMMENTS' && (
        <div className="bg-white flex-1 rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">Lịch Sử Toàn Bộ Comment</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Tìm tên user, nội dung..." className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-80 focus:outline-none focus:border-[#005691]" />
            </div>
          </div>
          <div className="flex-1 overflow-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">Thời gian</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">Tài khoản (User)</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">Nội dung</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">Phân loại (AI)</th>
                </tr>
              </thead>
              <tbody>
                {reportData.comments.map((cmt: any) => (
                  <tr key={cmt.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 text-sm text-slate-500 font-medium">{cmt.time}</td>
                    <td className="p-4 text-sm font-bold text-slate-900">{cmt.user}</td>
                    <td className="p-4 text-sm text-slate-700">{cmt.content}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${cmt.intent === 'Có SĐT' ? 'bg-red-100 text-red-700' : cmt.intent === 'Nhu cầu cao' ? 'bg-orange-100 text-orange-700' : cmt.intent === 'Tham gia Minigame' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                        {cmt.intent}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LEADS TAB */}
      {activeTab === 'LEADS' && (
        <div className="bg-white flex-1 rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">Danh Sách Leads Thu Được</h2>
          </div>
          <div className="flex-1 overflow-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">Thời gian thu thập</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">Nguồn / User</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">Thông tin liên hệ</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">Nhu cầu (Loại)</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">Trạng thái CSKH</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {reportData.leads.map((lead: any) => (
                  <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 text-sm text-slate-500 font-medium">{lead.time}</td>
                    <td className="p-4 text-sm font-bold text-slate-900">{lead.user}</td>
                    <td className="p-4 text-sm font-black text-slate-700">{lead.info}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${lead.type === 'SĐT Trực tiếp' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
                        {lead.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold ${lead.status === 'Đã tư vấn' ? 'text-green-600' : 'text-slate-400'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500 italic">{lead.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WINNERS TAB */}
      {activeTab === 'WINNERS' && (
        <div className="bg-white flex-1 rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">Danh Sách Nhận Quà (Minigame)</h2>
          </div>
          <div className="flex-1 overflow-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">Hạng</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">Tài khoản (Winner)</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">Timestamp Chính xác</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">Đáp án đã gửi</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">Loại giải</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">Phần quà</th>
                </tr>
              </thead>
              <tbody>
                {reportData.winners.map((win: any) => (
                  <tr key={win.rank} className={`border-b border-slate-100 hover:bg-slate-50/50 ${win.type === 'Chính thức' ? 'bg-green-50/30' : 'opacity-80'}`}>
                    <td className="p-4 font-black text-xl text-slate-400">#{win.rank}</td>
                    <td className="p-4 text-sm font-bold text-slate-900">{win.user}</td>
                    <td className="p-4 text-sm font-mono text-slate-600">{win.time}</td>
                    <td className="p-4 text-sm font-bold text-slate-700">{win.answer}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${win.type === 'Chính thức' ? 'bg-[#00A859] text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {win.type}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-800">{win.gift}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
