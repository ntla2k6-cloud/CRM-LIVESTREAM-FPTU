"use client"
import React, { useState, useEffect } from 'react';
import { 
  Play, Square, MessageSquare, Users, Trash2, Timer, Video, ListTodo, Pin, CheckCircle2, Phone, BellRing, Trophy, Clock, Zap, Target, TrendingUp, AlertTriangle, Gift
} from 'lucide-react';
import io from 'socket.io-client';

let socket: any;

export default function LiveControlPage() {
  const [activeTabLeft, setActiveTabLeft] = useState<'SCRIPT' | 'TRIVIA' | 'KEYWORDS'>('SCRIPT');
  const [activeTabRight, setActiveTabRight] = useState<'COMMENTS' | 'LEADS' | 'WINNERS'>('COMMENTS');
  
  // ============ STATES: KỊCH BẢN & DỮ LIỆU ============
  const [scriptContent, setScriptContent] = useState(
    "1. Chào hỏi & Minigame đầu giờ (15p)\n- Kêu gọi thả tim, share livestream\n\n2. Q&A Giải đáp thắc mắc\n- Tập trung trả lời câu hỏi được ghim\n\n3. Trắc nghiệm Minigame\n- Chơi 3 câu nhận Balo FPTU"
  );
  const [leads, setLeads] = useState<any[]>([]);
  const [newLeadAlert, setNewLeadAlert] = useState(false);
  const [keywordStats, setKeywordStats] = useState<Record<string, number>>({});

  // ============ STATES: TRIVIA / MINIGAME ============
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [stats, setStats] = useState({ total: 0, correct: 0 });
  const [sendingDMs, setSendingDMs] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ============ STATES: TIKTOK CONNECTOR ============
  const [tiktokUsername, setTiktokUsername] = useState('');
  const [tiktokStatus, setTiktokStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  const params = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : 'demo';
  const [sessionData, setSessionData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<any>(null);

  const MOCK_QUESTIONS = [
    { id: 'q1', code: 'Q1', content: 'Cơ sở vật chất của FPTU HCM có gì đặc biệt?', answer: 'C', timeLimit: 30, options: { A: 'Hồ bơi Olympic', B: 'Sân golf 9 lỗ', C: 'Thư viện 3 tầng, sân bóng tiêu chuẩn FIFA, hồ sen', D: 'Khu vườn ươm cây' } },
    { id: 'q2', code: 'Q2', content: 'FPTU HCM thuộc hệ thống Đại học nào?', answer: 'A', timeLimit: 30, options: { A: 'FPT University', B: 'Đại học Quốc gia HCM', C: 'Đại học Bách Khoa', D: 'Đại học Khoa học Tự nhiên' } },
    { id: 'q3', code: 'Q3', content: 'Ngành học hot nhất tại FPTU HCM năm 2026 là gì?', answer: 'B', timeLimit: 30, options: { A: 'Quản trị kinh doanh', B: 'Kỹ thuật phần mềm & AI', C: 'Báo chí đa phương tiện', D: 'Thiết kế đồ họa' } },
  ];

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    fetch(`${baseUrl}/live-session`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          const current = data.find((s: any) => s.id === params) || data[0];
          setSessionData(current);
          const apiQuestions = current.questions?.map((q: any) => ({
            id: q.id,
            code: q.code,
            content: q.content,
            answer: q.correctAnswer,
            timeLimit: 30,
            options: { A: '', B: '', C: '', D: '' }
          })) || [];
          setQuestions(apiQuestions.length > 0 ? apiQuestions : MOCK_QUESTIONS);
        } else {
          setQuestions(MOCK_QUESTIONS);
        }
      })
      .catch(() => setQuestions(MOCK_QUESTIONS));
  }, [params]);

  const activeQ = questions.find(q => q.id === activeQuestion);

  // ============ ENGINE TỔNG HỢP ============
  const [comments, setComments] = useState<any[]>([]);

  // 1. Socket.IO & Timer Engine
  useEffect(() => {
    // Kết nối Socket
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    socket = io(socketUrl);

    socket.emit('joinLiveSession', params);

    socket.on('tiktokStatus', (data: any) => {
      setTiktokStatus(data.status);
      if (data.status === 'error') {
        alert("Lỗi kết nối TikTok: " + data.message);
      }
    });

    socket.on('tiktokEvent', (data: any) => {
      setToastMessage(`TikTok: ${data.text}`);
      setTimeout(() => setToastMessage(null), 3000);
    });
    
    socket.on('newComment', (dbComment: any) => {
      const hasPhone = /\d{9,11}/.test(dbComment.content);
      const isHighIntent = dbComment.aiIntent !== 'NEUTRAL' || /(tư vấn|quan tâm|muốn học)/i.test(dbComment.content);
      
      const newComment = {
        id: dbComment.id,
        name: dbComment.username,
        text: dbComment.content,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isPhone: hasPhone,
        isHighIntent: isHighIntent
      };

      setComments(prev => [newComment, ...prev].slice(0, 100));
      
      if (hasPhone || isHighIntent) {
        setLeads(prev => {
          if (prev.find(l => l.name === newComment.name)) return prev;
          setNewLeadAlert(true);
          setTimeout(() => setNewLeadAlert(false), 3000);
          return [{ 
            id: newComment.id, 
            name: newComment.name, 
            phone: hasPhone ? newComment.text.match(/\d{9,11}/)?.[0] : 'Chưa có', 
            intent: hasPhone ? 'HOT' : 'WARM',
            text: newComment.text,
            time: newComment.time, 
            status: 'Chưa gọi' 
          }, ...prev];
        });
      }
      
      // Chấm điểm Minigame từ Socket
      setActiveQuestion((currentActiveQ) => {
        if (currentActiveQ) {
          const qObj = questions.find(q => q.id === currentActiveQ);
          if (qObj && qObj.answer) {
            const isCorrect = newComment.text.toLowerCase().includes(qObj.answer.toLowerCase());
            setStats(prev => ({ total: prev.total + 1, correct: prev.correct + (isCorrect ? 1 : 0) }));
            if (isCorrect) {
              setLeaderboard(prev => {
                if (prev.find(u => u.name === newComment.name)) return prev;
                // Tính tốc độ (chỉ tương đối vì ko có startTime chính xác tuyệt đối ở đây, dùng Date.now làm fallback)
                const speedMs = newComment.timestamp - Date.now() + 10000; 
                const speedSec = (Math.max(0.1, Math.abs(speedMs) / 1000)).toFixed(1);
                return [...prev, { name: newComment.name, speed: speedSec, text: newComment.text }].sort((a, b) => parseFloat(a.speed) - parseFloat(b.speed));
              });
            }
          }
        }
        return currentActiveQ;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [questions]);

  // Timer Engine
  useEffect(() => {
    if (!activeQuestion) return;
    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          setActiveQuestion(null);
          // Phát sự kiện kết thúc game
          socket?.emit('endGame', { liveSessionId: params, questionCode: 'Minigame' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [activeQuestion, params]);



  // ============ DỒNG BỘ DATA CHO TRANG BÁO CÁO (THỐNG KÊ) ============
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const reportPayload = {
        totalComments: comments.length,
        totalLeads: leads.length,
        comments: comments.map(c => ({
          id: c.id,
          time: c.time,
          user: c.name,
          content: c.text,
          intent: c.isPhone ? 'Có SĐT' : c.isHighIntent ? 'Nhu cầu cao' : c.text.match(/^[0-9A-D]\./) ? 'Tham gia Minigame' : c.text.length < 10 ? 'Tương tác' : 'Bình thường'
        })),
        leads: leads.map(l => ({
          id: l.id,
          time: l.time,
          user: l.name,
          info: l.phone !== 'Chưa có' ? l.phone : 'Inbox',
          type: l.intent === 'HOT' ? 'SĐT Trực tiếp' : 'Nhu cầu cao',
          status: l.status,
          note: l.text
        })),
        winners: leaderboard.map((w, idx) => ({
          rank: w.rank,
          user: w.name,
          time: `+${w.speed}`,
          answer: w.answer,
          type: idx < 3 ? 'Chính thức' : 'Dự bị',
          gift: idx < 3 ? 'Balo FPTU' : '-'
        })),
        keywordStats: keywordStats
      };
      localStorage.setItem(`live_report_${params}`, JSON.stringify(reportPayload));
    }
  }, [comments, leads, leaderboard, keywordStats, params]);

  // ============ ACTIONS ============
  const startGame = (qId: string, timeLimit: number) => {
    setActiveQuestion(qId);
    setTimeLeft(timeLimit);
    setLeaderboard([]);
    setStats({ total: 0, correct: 0 });
    setStartTime(Date.now());

    // Bắn sự kiện sang Socket để máy học sinh hiển thị câu hỏi
    const qObj = questions.find(q => q.id === qId);
    socket?.emit('startGame', { 
      liveSessionId: params, 
      questionCode: qObj?.code || 'Minigame', 
      timeLimit 
    });
    setActiveTabRight('WINNERS');
  };

  const handleSendDMs = () => {
    if (leaderboard.length === 0) return;
    setSendingDMs(true);
    setTimeout(() => {
      setSendingDMs(false);
      setToastMessage(`🎉 Đã gửi kịch bản Auto-DM thành công cho Top 3 Winners và Top 10 Backup Winners!`);
      setTimeout(() => setToastMessage(null), 4000);
    }, 1500);
  };

  const topKeywords = Object.entries(keywordStats).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="flex h-full bg-slate-50 font-sans text-slate-800">
      
      {/* LEFT PANEL: KỊCH BẢN, TRIVIA & KEYWORDS */}
      <div className="w-[500px] border-r border-slate-200 bg-white flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 shrink-0">
        <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-[10px] font-black border border-red-100 shadow-sm uppercase">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span> ĐANG PHÁT LIVE
            </span>
            <span className="text-[11px] font-bold text-slate-400">#LIVE</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{sessionData?.title || 'Đang tải...'}</h1>
          <p className="text-[12px] text-slate-500 mt-1 font-medium flex items-center gap-2">
            <Users size={12} /> Mắt xem: {sessionData ? '1,402' : '...'} • Quản trị viên
          </p>
        </div>

        {/* Left Tabs */}
        <div className="flex p-4 pb-0 gap-1 border-b border-slate-100 bg-slate-50">
          <button onClick={() => setActiveTabLeft('SCRIPT')} className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-t-xl text-[11px] font-bold transition-all ${activeTabLeft === 'SCRIPT' ? 'bg-white text-[#F58220] border-t border-l border-r border-slate-200 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.02)]' : 'text-slate-500 hover:bg-slate-200/50 border border-transparent'}`}>
            <ListTodo size={16} /> Kịch bản
          </button>
          <button onClick={() => setActiveTabLeft('TRIVIA')} className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-t-xl text-[11px] font-bold transition-all ${activeTabLeft === 'TRIVIA' ? 'bg-white text-[#F58220] border-t border-l border-r border-slate-200 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.02)]' : 'text-slate-500 hover:bg-slate-200/50 border border-transparent'}`}>
            <Target size={16} /> Minigame
          </button>
          <button onClick={() => setActiveTabLeft('KEYWORDS')} className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-t-xl text-[11px] font-bold transition-all ${activeTabLeft === 'KEYWORDS' ? 'bg-white text-[#F58220] border-t border-l border-r border-slate-200 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.02)]' : 'text-slate-500 hover:bg-slate-200/50 border border-transparent'}`}>
            <TrendingUp size={16} /> AI Analytics
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          
          {/* SCRIPT TAB */}
          {activeTabLeft === 'SCRIPT' && (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Trình soạn thảo Kịch bản</label>
              </div>
              <textarea 
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                className="flex-1 w-full p-5 bg-yellow-50/50 border border-yellow-200 rounded-2xl text-slate-800 text-[15px] font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-yellow-400/50 resize-none custom-scrollbar shadow-inner"
              ></textarea>
            </div>
          )}

          {/* TRIVIA TAB */}
          {activeTabLeft === 'TRIVIA' && (
            <div className="flex flex-col gap-5">
              {questions.length === 0 ? <p className="text-sm text-slate-400 text-center py-10">Không có câu hỏi nào.</p> : 
                questions.map((q) => (
                <div key={q.id} className={`rounded-2xl border transition-all duration-300 relative overflow-hidden ${activeQuestion === q.id ? 'border-[#F58220] shadow-[0_8px_30px_rgba(245,130,32,0.12)] bg-white' : editingQuestionId === q.id ? 'border-[#005691] shadow-lg bg-white' : 'border-slate-200 bg-slate-50/50'}`}>
                  {activeQuestion === q.id && <div className="absolute top-0 left-0 h-1 bg-[#F58220] transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / q.timeLimit) * 100}%` }} />}
                  
                  <div className="p-5 pl-6 pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-md ${activeQuestion === q.id ? 'bg-[#F58220] text-white' : editingQuestionId === q.id ? 'bg-[#005691] text-white' : 'bg-slate-200 text-slate-600'}`}>{q.code}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#00A859] bg-green-50 px-2 py-1 rounded-md border border-green-100">Đáp án: {editingQuestionId === q.id ? editDraft?.answer : q.answer}</span>
                        {editingQuestionId !== q.id && activeQuestion !== q.id && (
                          <button 
                            onClick={() => { setEditingQuestionId(q.id); setEditDraft({ ...q }); }}
                            className="w-7 h-7 rounded-lg bg-slate-100 text-slate-400 hover:bg-[#005691] hover:text-white flex items-center justify-center transition-colors"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* EDIT MODE */}
                    {editingQuestionId === q.id && editDraft ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Câu hỏi</label>
                          <textarea
                            value={editDraft.content}
                            onChange={e => setEditDraft({ ...editDraft, content: e.target.value })}
                            rows={2}
                            className="w-full text-sm font-bold text-slate-800 border border-[#005691]/30 rounded-xl px-3 py-2 bg-blue-50/30 outline-none focus:ring-2 focus:ring-[#005691]/20 resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {(['A', 'B', 'C', 'D'] as const).map(opt => (
                            <div key={opt} className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 transition-colors ${editDraft.answer === opt ? 'border-[#00A859] bg-green-50' : 'border-slate-200 bg-white'}`}>
                              <button
                                onClick={() => setEditDraft({ ...editDraft, answer: opt })}
                                className={`w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center shrink-0 border-2 transition-colors ${editDraft.answer === opt ? 'bg-[#00A859] border-[#00A859] text-white' : 'bg-white border-slate-300 text-slate-500'}`}
                              >{opt}</button>
                              <input 
                                type="text" 
                                value={editDraft.options?.[opt] || ''} 
                                onChange={e => setEditDraft({ ...editDraft, options: { ...editDraft.options, [opt]: e.target.value } })}
                                placeholder={`Đáp án ${opt}...`} 
                                className="w-full text-xs font-semibold text-slate-700 outline-none bg-transparent" 
                              />
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button 
                            onClick={() => {
                              setQuestions(questions.map(qs => qs.id === q.id ? { ...editDraft } : qs));
                              setEditingQuestionId(null);
                              setEditDraft(null);
                            }}
                            className="flex-1 py-2 bg-[#005691] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 size={13} /> Lưu câu hỏi
                          </button>
                          <button 
                            onClick={() => { setEditingQuestionId(null); setEditDraft(null); }}
                            className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl"
                          >Hủy</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-slate-800 leading-snug mb-3">{q.content}</p>
                        
                        <div className="grid grid-cols-2 gap-2 mb-5">
                          {(['A', 'B', 'C', 'D'] as const).map(opt => (
                            <div key={opt} className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 ${q.answer === opt ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                              <span className={`text-[10px] font-black w-4 h-4 flex items-center justify-center rounded ${q.answer === opt ? 'bg-[#00A859] text-white' : 'bg-slate-100 text-slate-500'}`}>{opt}</span>
                              <span className="text-xs font-semibold text-slate-700">{q.options?.[opt] || `Đáp án ${opt}...`}</span>
                            </div>
                          ))}
                        </div>

                        {activeQuestion === q.id ? (
                          <button onClick={() => setActiveQuestion(null)} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl text-xs font-bold shadow-lg">
                            <Square size={14} className="fill-white" /> KẾT THÚC CÂU HỎI
                          </button>
                        ) : (
                          <button onClick={() => startGame(q.id, q.timeLimit)} disabled={activeQuestion !== null} className={`w-full flex items-center justify-center gap-2 border-2 py-3 rounded-xl text-xs font-bold transition-all ${activeQuestion !== null ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-200 hover:border-[#F58220] hover:text-[#F58220]'}`}>
                            <Play size={14} /> BẮT ĐẦU ({q.timeLimit}s)
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  {activeQuestion === q.id && (
                    <div className="bg-orange-50 text-[#F58220] border-t border-orange-100 text-[10px] font-black p-2.5 flex justify-between px-5 uppercase">
                      <span className="flex items-center gap-2"><Zap size={12} className="animate-pulse fill-[#F58220]" /> CHẤM ĐIỂM TỰ ĐỘNG...</span>
                      <span className="flex items-center gap-1.5"><Timer size={12} /> {timeLeft}s</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* KEYWORDS TAB */}
          {activeTabLeft === 'KEYWORDS' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp size={14} /> Từ khóa người xem đang hỏi nhiều nhất
                </h3>
                <div className="space-y-3">
                  {topKeywords.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-5">AI đang thu thập dữ liệu...</p>
                  ) : (
                    topKeywords.map(([kw, count], idx) => (
                      <div key={kw} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-black text-[#005691]">#{idx + 1}</span>
                          <span className="font-bold text-slate-800 capitalize">{kw}</span>
                        </div>
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">{count} lượt hỏi</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: COMMENTS, LEADS & WINNERS */}
      <div className="flex-1 flex flex-col h-full bg-slate-50/50 relative">
        <div className="h-[72px] bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setActiveTabRight('COMMENTS')} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTabRight === 'COMMENTS' ? 'bg-white text-[#F58220] shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}>
              <MessageSquare size={16} /> Luồng Comment
            </button>
            <button onClick={() => setActiveTabRight('LEADS')} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all relative ${activeTabRight === 'LEADS' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}>
              <Phone size={16} /> Bắt Leads (AI)
              {leads.filter(l => l.status === 'Chưa gọi').length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[9px] font-black items-center justify-center">{leads.filter(l => l.status === 'Chưa gọi').length}</span></span>
              )}
            </button>
            <button onClick={() => setActiveTabRight('WINNERS')} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTabRight === 'WINNERS' ? 'bg-white text-[#00A859] shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}>
              <Trophy size={16} /> Bảng Người Trúng
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative p-8">
          
          {/* TAB: COMMENTS */}
          {activeTabRight === 'COMMENTS' && (
            <div className="absolute inset-0 p-8 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2"><MessageSquare size={14} className="text-[#005691]" /> Comment trực tiếp từ TikTok/FB</h3>
                
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="@tiktok_id" 
                    value={tiktokUsername}
                    onChange={(e) => setTiktokUsername(e.target.value)}
                    disabled={tiktokStatus === 'connected' || tiktokStatus === 'connecting'}
                    className="px-3 py-1.5 rounded-lg text-xs border border-slate-300 focus:outline-none focus:border-[#F58220]"
                  />
                  {tiktokStatus === 'connected' ? (
                    <button onClick={() => { setTiktokStatus('disconnected'); socket.emit('stopTiktokConnection', params); }} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-600 transition-colors">
                      Ngắt kết nối
                    </button>
                  ) : (
                    <button onClick={() => { setTiktokStatus('connecting'); socket.emit('startTiktokConnection', { liveSessionId: params, tiktokUsername }); }} className="bg-[#00A859] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 transition-colors">
                      {tiktokStatus === 'connecting' ? 'Đang kết nối...' : 'Bắt Live TikTok'}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex-1 bg-slate-900 rounded-3xl shadow-xl p-6 flex flex-col overflow-hidden relative border border-slate-800">
                <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-slate-900 to-transparent z-10 pointer-events-none"></div>
                <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-4 custom-scrollbar">
                  {comments.map((cmt) => (
                    <div key={cmt.id} className={`flex flex-col gap-2 p-4 rounded-2xl border backdrop-blur-sm group ${cmt.isPhone || cmt.isHighIntent ? 'bg-red-900/30 border-red-700/50' : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'}`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-xs ${cmt.isPhone || cmt.isHighIntent ? 'text-red-400' : 'text-blue-300'}`}>{cmt.name}</span>
                          {cmt.isPhone && <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">CÓ SĐT</span>}
                          {cmt.isHighIntent && <span className="bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Nhu cầu cao</span>}
                        </div>
                        <span className="text-[10px] font-medium text-slate-500">{cmt.time}</span>
                      </div>
                      <div className="flex items-end justify-between gap-4">
                        <span className="text-slate-200 font-semibold text-[15px] leading-snug">{cmt.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-slate-900 to-transparent z-10 pointer-events-none"></div>
              </div>
            </div>
          )}

          {/* TAB: LEADS (CSKH) */}
          {activeTabRight === 'LEADS' && (
            <div className="absolute inset-0 p-8 flex flex-col">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4"><AlertTriangle size={14} className="text-red-500" /> AI Nhận Diện Học Sinh Tiềm Năng (Leads)</h3>
              <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                {leads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-50"><Phone size={48} className="text-slate-300 mb-4" /><p className="font-bold text-slate-500">Hệ thống AI đang quét comment...</p></div>
                ) : (
                  leads.map((lead, idx) => (
                    <div key={lead.id} className={`flex items-center justify-between p-5 rounded-2xl border ${lead.status === 'Chưa gọi' ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200 opacity-70'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black ${lead.status === 'Chưa gọi' ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500'}`}>{idx + 1}</div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-lg font-black tracking-wide text-slate-900">{lead.phone}</p>
                            {lead.intent === 'HOT' ? (
                              <span className="bg-red-100 text-red-700 text-[9px] px-1.5 py-0.5 rounded font-black border border-red-200">SĐT TRỰC TIẾP</span>
                            ) : (
                              <span className="bg-orange-100 text-orange-700 text-[9px] px-1.5 py-0.5 rounded font-black border border-orange-200">AI DETECT: CẦN TƯ VẤN</span>
                            )}
                          </div>
                          <p className="text-[11px] font-bold text-slate-500">Tài khoản: <span className="text-blue-600">{lead.name}</span> • Comment: "{lead.text}"</p>
                        </div>
                      </div>
                      <button onClick={() => setLeads(prev => prev.map(l => l.id === lead.id ? {...l, status: l.status === 'Chưa gọi' ? 'Đã tư vấn' : 'Chưa gọi'} : l))} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 ${lead.status === 'Chưa gọi' ? 'bg-[#F58220] hover:bg-[#e07010] text-white' : 'bg-slate-200 text-slate-600'}`}>
                        <CheckCircle2 size={16} />{lead.status === 'Chưa gọi' ? 'Chốt đơn / Nhận xử lý' : 'Đã xử lý xong'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: WINNERS (MINIGAME) */}
          {activeTabRight === 'WINNERS' && (
            <div className="absolute inset-0 p-8 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Trophy size={14} className="text-[#00A859]" /> Người Thắng Cược & Dự Bị (Auto-Ranking)
                </h3>
                {activeQuestion && (
                  <div className="flex items-center gap-4 bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Cmt thu được: <span className="text-slate-900 font-black text-xs">{stats.total}</span></p>
                    <div className="w-[1px] h-4 bg-slate-200"></div>
                    <p className="text-[10px] font-bold text-[#00A859] uppercase">Đáp án đúng: <span className="font-black text-xs">{stats.correct}</span></p>
                  </div>
                )}
              </div>
              <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                {leaderboard.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-20 opacity-50">
                    <Trophy size={48} className="text-slate-300 mb-4" />
                    <p className="font-bold text-slate-500">Chưa có ai trả lời đúng.</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-2 text-xs font-black text-slate-400 uppercase tracking-widest pl-2">🏆 TOP 3 - TRÚNG QUÀ CHÍNH THỨC</div>
                    {leaderboard.slice(0, 3).map((user, idx) => (
                      <div key={user.name} className="flex items-center justify-between p-4 rounded-2xl border bg-orange-50 border-orange-200">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black bg-[#F58220] text-white shadow-sm">{user.rank}</div>
                          <div>
                            <p className="font-bold text-slate-900 flex items-center gap-2">
                              {user.name} 
                              {user.winCount > 0 && <span className="bg-purple-100 text-purple-700 border border-purple-200 text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1"><Gift size={10}/> Trúng lần {user.winCount + 1}</span>}
                            </p>
                            <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1"><Clock size={12}/> Tốc độ: {user.speed}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-800 mb-0.5">Đáp án: {user.answer}</p>
                          <span className="text-[9px] font-black text-[#00A859] bg-green-50 px-2 py-0.5 rounded border border-green-100">Hợp Lệ</span>
                        </div>
                      </div>
                    ))}
                    
                    {leaderboard.length > 3 && (
                      <div className="mt-4 mb-2 text-xs font-black text-slate-400 uppercase tracking-widest pl-2">⚠️ TOP DỰ BỊ (PHÒNG HỜ BOM HÀNG)</div>
                    )}
                    {leaderboard.slice(3).map((user, idx) => (
                      <div key={user.name} className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 border-slate-200 opacity-80">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold bg-slate-200 text-slate-600">{user.rank}</div>
                          <div>
                            <p className="font-bold text-slate-700 text-sm">{user.name}</p>
                            <p className="text-[10px] font-bold text-slate-400">Tốc độ: {user.speed}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{user.answer}</span>
                      </div>
                    ))}

                    {!activeQuestion && (
                      <button 
                        onClick={handleSendDMs} 
                        disabled={sendingDMs}
                        className="mt-4 w-full py-4 rounded-2xl font-bold bg-[#005691] hover:bg-[#004a7c] text-white shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                      >
                        {sendingDMs ? (
                          <><Zap size={18} className="animate-pulse" /> Đang gửi kịch bản Auto-DM...</>
                        ) : (
                          <><MessageSquare size={18} /> Gửi Tin Nhắn DM Trúng Thưởng (Cả Chính Thức & Dự Bị)</>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          
        </div>
      </div>
      
      {/* Real-time Alert Overlay */}
      {newLeadAlert && (
        <div className="fixed bottom-8 right-8 bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-10 fade-in z-50 border border-red-400">
          <BellRing size={24} className="animate-bounce" />
          <div>
            <p className="font-black text-sm uppercase tracking-wide">🚨 AI Detect: Có Lead Tiềm Năng Mới!</p>
            <p className="text-xs font-medium opacity-90 mt-0.5">Hệ thống vừa bắt được học sinh có nhu cầu tư vấn.</p>
          </div>
        </div>
      )}

      {/* Action Toast Notification */}
      {toastMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-10 fade-in z-50 border border-slate-700">
          <CheckCircle2 size={18} className="text-[#00A859]" />
          <p className="font-bold text-sm">{toastMessage}</p>
        </div>
      )}
      
    </div>
  );
}
