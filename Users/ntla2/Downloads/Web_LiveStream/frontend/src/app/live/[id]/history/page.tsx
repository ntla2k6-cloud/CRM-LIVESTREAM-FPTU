'use client'
import React, { useState, useEffect } from 'react';
import { 
  Archive, Download, Search, Calendar, Clock, MessageSquare, Phone, 
  ChevronLeft, Filter, Users, Medal, Trophy, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function LiveHistoryPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'COMMENTS' | 'LEADS' | 'WINNERS'>('COMMENTS');
  
  const [comments, setComments] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/live-session/' + params.id + '/history').then(data => {
      setComments(data.comments || []);
      setLeads(data.leads || []);
      setWinners(data.winners || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [params.id]);

  if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-orange-500" /></div>;

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans text-slate-800">
      <div className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <Link href={'/live/' + params.id} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <Archive size={24} className="text-slate-700" />
              <h1 className="text-xl font-black text-slate-800">Kho lưu trữ Phiên Live</h1>
            </div>
          </div>
        </div>
        <button className="h-10 px-6 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 flex items-center gap-2">
          <Download size={18} /> Xuất File (CSV)
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-8">
        <div className="max-w-6xl w-full mx-auto h-full flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <button onClick={() => setActiveTab('COMMENTS')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'COMMENTS' ? 'bg-[#005691] text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}>
              <MessageSquare size={18} /> Tất cả Comment 
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{comments.length}</span>
            </button>
            <button onClick={() => setActiveTab('LEADS')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'LEADS' ? 'bg-[#00A859] text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}>
              <Users size={18} /> Số tiềm năng (SĐT)
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{leads.length}</span>
            </button>
            <button onClick={() => setActiveTab('WINNERS')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'WINNERS' ? 'bg-[#F58220] text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}>
              <Medal size={18} /> Người trúng giải
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{winners.length}</span>
            </button>
          </div>

          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {activeTab === 'COMMENTS' && (
                comments.length === 0 ? <p className="text-slate-500 text-center py-10">Chưa có comment nào</p> :
                comments.map((cmt) => (
                  <div key={cmt.id} className="flex gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 overflow-hidden">
                      {cmt.avatar ? <img src={cmt.avatar} alt="avatar" /> : null}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-700">{cmt.displayName || cmt.username}</span>
                        <span className="text-xs text-slate-400 font-medium">{new Date(cmt.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-800">{cmt.content}</p>
                    </div>
                  </div>
                ))
              )}

              {activeTab === 'LEADS' && (
                leads.length === 0 ? <p className="text-slate-500 text-center py-10">Chưa có Lead nào</p> :
                leads.map((lead) => (
                  <div key={lead.id} className="flex gap-4 p-4 bg-green-50/50 rounded-xl border border-green-100">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                      <Phone size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-700">{lead.customer?.name || lead.customer?.username || 'Khách hàng'}</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">SDT Tiềm năng</span>
                      </div>
                      <p className="text-slate-800">{lead.customer?.phone || lead.customer?.email || 'N/A'}</p>
                    </div>
                  </div>
                ))
              )}

              {activeTab === 'WINNERS' && (
                winners.length === 0 ? <p className="text-slate-500 text-center py-10">Chưa có Người trúng giải nào</p> :
                winners.map((winner) => (
                  <div key={winner.id} className="flex gap-4 p-4 bg-orange-50/50 rounded-xl border border-orange-100 items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                        <Trophy size={24} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{winner.customer?.name || winner.customer?.username || 'Khách hàng'}</div>
                        <div className="text-sm text-slate-500">{winner.customer?.phone || winner.customer?.email || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-orange-600">Quà: {winner.gift?.name || 'Không xác định'}</div>
                      <div className="text-xs font-bold text-slate-500 mt-1 uppercase">Trạng thái: {winner.status}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}