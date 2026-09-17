"use client"
import React, { useState } from 'react';
import { 
  Archive, Download, Search, Calendar, Clock, MessageSquare, Phone, 
  ChevronLeft, Filter, Users, Medal, Trophy
} from 'lucide-react';
import Link from 'next/link';

export default function LiveHistoryPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'COMMENTS' | 'LEADS' | 'WINNERS'>('COMMENTS');
  
  // Mock data for archive
  const mockComments = Array.from({length: 150}).map((_, i) => ({
    id: i,
    name: `@user_${Math.floor(Math.random() * 9999)}`,
    text: i % 15 === 0 ? "Cho em hỏi học phí ạ 0901234567" : i % 5 === 0 ? "1.C" : "Trường đẹp quá ạ",
    time: `19:${Math.floor(i/3).toString().padStart(2, '0')}:${(i%60).toString().padStart(2, '0')}`,
    isPhone: i % 15 === 0
  }));

  const mockLeads = mockComments.filter(c => c.isPhone);

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans text-slate-800">
      
      {/* Header */}
      <div className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <Link href="/live" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-slate-200 text-slate-600 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-slate-300">
                Kho lưu trữ
              </span>
              <span className="text-[11px] font-bold text-slate-400">Phiên: {params.id}</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Archive className="text-[#005691]" /> Lịch sử: Tư vấn Xét tuyển Đợt 2
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-4 border-r border-slate-200 pr-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ngày phát</span>
            <span className="font-bold text-slate-700 flex items-center gap-1.5"><Calendar size={14}/> 13/09/2026</span>
          </div>
          <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm flex items-center gap-2 transition-all">
            <Download size={18} /> Xuất File Báo Cáo (.xlsx)
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar Menu */}
        <div className="w-[280px] bg-white border-r border-slate-200 flex flex-col p-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Dữ liệu lưu trữ</p>
          <div className="flex flex-col gap-1.5">
            <button 
              onClick={() => setActiveTab('COMMENTS')}
              className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'COMMENTS' ? 'bg-blue-50 text-[#005691]' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <span className="flex items-center gap-2"><MessageSquare size={18} /> Toàn bộ Comment</span>
              <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">{mockComments.length}</span>
            </button>
            <button 
              onClick={() => setActiveTab('LEADS')}
              className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'LEADS' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <span className="flex items-center gap-2"><Phone size={18} /> SĐT Thu được (Leads)</span>
              <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">{mockLeads.length}</span>
            </button>
            <button 
              onClick={() => setActiveTab('WINNERS')}
              className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'WINNERS' ? 'bg-green-50 text-[#00A859]' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <span className="flex items-center gap-2"><Trophy size={18} /> Kết quả Minigame</span>
              <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">10</span>
            </button>
          </div>

          <div className="mt-auto bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">Tổng quan phiên Live</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-bold">Mắt xem cao nhất:</span><span className="font-black text-slate-900">3,250</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-bold">Tổng tương tác:</span><span className="font-black text-slate-900">14,200</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-bold">Thời lượng phát:</span><span className="font-black text-slate-900">120 phút</span></div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-8 overflow-hidden relative">
          <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="relative w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm người dùng, nội dung chat..." 
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-[#005691] transition-colors"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
                <Filter size={16} /> Lọc dữ liệu
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {activeTab === 'COMMENTS' && (
                <div className="space-y-1">
                  {mockComments.map((cmt) => (
                    <div key={cmt.id} className={`flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors ${cmt.isPhone ? 'bg-red-50/30' : ''}`}>
                      <div className="text-[11px] font-bold text-slate-400 mt-0.5 shrink-0">{cmt.time}</div>
                      <div>
                        <span className="font-bold text-[#005691] mr-2 text-sm">{cmt.name}</span>
                        {cmt.isPhone && <span className="bg-red-100 text-red-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase mr-2 border border-red-200">SĐT</span>}
                        <span className="text-slate-700 text-sm font-medium">{cmt.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'LEADS' && (
                <div className="grid grid-cols-2 gap-4">
                  {mockLeads.map((lead, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-[#F58220] hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-black">{idx + 1}</div>
                        <div>
                          <p className="text-base font-black tracking-wide text-slate-900">{lead.text.match(/\d{9,10}/)?.[0]}</p>
                          <p className="text-[11px] font-bold text-slate-500">Tài khoản: <span className="text-blue-600">{lead.name}</span></p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200">Đã Liên Hệ</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'WINNERS' && (
                <div className="flex flex-col items-center justify-center h-full opacity-50">
                  <Medal size={48} className="text-slate-300 mb-4" />
                  <p className="font-bold text-slate-500">Danh sách người trúng giải đã được lưu trữ.</p>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
