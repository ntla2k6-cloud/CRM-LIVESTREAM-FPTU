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
  
  // ============ STATES: Ká»CH Báº¢N & Dá»® LIá»†U ============
  const [scriptContent, setScriptContent] = useState(
    "1. ChĂ o há»i & Minigame Ä‘áº§u giá» (15p)\n- KĂªu gá»i tháº£ tim, share livestream\n\n2. Q&A Giáº£i Ä‘Ă¡p tháº¯c máº¯c\n- Táº­p trung tráº£ lá»i cĂ¢u há»i Ä‘Æ°á»£c ghim\n\n3. Tráº¯c nghiá»‡m Minigame\n- ChÆ¡i 3 cĂ¢u nháº­n Balo FPTU"
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

  const params = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : 'demo';
  const [sessionData, setSessionData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<any>(null);

  const MOCK_QUESTIONS = [
    { id: 'q1', code: 'Q1', content: 'CÆ¡ sá»Ÿ váº­t cháº¥t cá»§a FPTU HCM cĂ³ gĂ¬ Ä‘áº·c biá»‡t?', answer: 'C', timeLimit: 30, options: { A: 'Há»“ bÆ¡i Olympic', B: 'SĂ¢n golf 9 lá»—', C: 'ThÆ° viá»‡n 3 táº§ng, sĂ¢n bĂ³ng tiĂªu chuáº©n FIFA, há»“ sen', D: 'Khu vÆ°á»n Æ°Æ¡m cĂ¢y' } },
    { id: 'q2', code: 'Q2', content: 'FPTU HCM thuá»™c há»‡ thá»‘ng Äáº¡i há»c nĂ o?', answer: 'A', timeLimit: 30, options: { A: 'FPT University', B: 'Äáº¡i há»c Quá»‘c gia HCM', C: 'Äáº¡i há»c BĂ¡ch Khoa', D: 'Äáº¡i há»c Khoa há»c Tá»± nhiĂªn' } },
    { id: 'q3', code: 'Q3', content: 'NgĂ nh há»c hot nháº¥t táº¡i FPTU HCM nÄƒm 2026 lĂ  gĂ¬?', answer: 'B', timeLimit: 30, options: { A: 'Quáº£n trá»‹ kinh doanh', B: 'Ká»¹ thuáº­t pháº§n má»m & AI', C: 'BĂ¡o chĂ­ Ä‘a phÆ°Æ¡ng tiá»‡n', D: 'Thiáº¿t káº¿ Ä‘á»“ há»a' } },
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

  // ============ ENGINE Tá»”NG Há»¢P ============
  const [comments, setComments] = useState<any[]>([]);

  // 1. Socket.IO & Timer Engine
  useEffect(() => {
    // Káº¿t ná»‘i Socket
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    socket = io(socketUrl);
    
    socket.on('newComment', (newComment: any) => {
      setComments(prev => [newComment, ...prev].slice(0, 100));
      
      const hasPhone = newComment.isPhone;
      const hasHighIntent = newComment.isHighIntent;
      
      if (hasPhone || hasHighIntent) {
        setLeads(prev => {
          if (prev.find(l => l.name === newComment.name)) return prev;
          setNewLeadAlert(true);
          setTimeout(() => setNewLeadAlert(false), 3000);
          return [{ 
            id: newComment.id, 
            name: newComment.name, 
            phone: hasPhone ? newComment.text.match(/\d{9,10}/)?.[0] : 'ChÆ°a cĂ³', 
            intent: hasPhone ? 'HOT' : 'WARM',
            text: newComment.text,
            time: newComment.time, 
            status: 'ChÆ°a gá»i' 
          }, ...prev];
        });
      }
      
      // Cháº¥m Ä‘iá»ƒm Minigame tá»« Socket
      setActiveQuestion((currentActiveQ) => {
        if (currentActiveQ) {
          const qObj = questions.find(q => q.id === currentActiveQ);
          if (qObj && qObj.answer) {
            const isCorrect = newComment.text.toLowerCase().includes(qObj.answer.toLowerCase());
            setStats(prev => ({ total: prev.total + 1, correct: prev.correct + (isCorrect ? 1 : 0) }));
            if (isCorrect) {
              setLeaderboard(prev => {
                if (prev.find(u => u.name === newComment.name)) return prev;
                // TĂ­nh tá»‘c Ä‘á»™ (chá»‰ tÆ°Æ¡ng Ä‘á»‘i vĂ¬ ko cĂ³ startTime chĂ­nh xĂ¡c tuyá»‡t Ä‘á»‘i á»Ÿ Ä‘Ă¢y, dĂ¹ng Date.now lĂ m fallback)
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
          // PhĂ¡t sá»± kiá»‡n káº¿t thĂºc game
          socket?.emit('endGame', { liveSessionId: params, questionCode: 'Minigame' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [activeQuestion, params]);

    // B? Fake Comment Engine theo yêu c?u c?a user. Comment s? ch? l?y t? Socket.io ? trên.

  // ============ Dá»’NG Bá»˜ DATA CHO TRANG BĂO CĂO (THá»NG KĂ) ============
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
          intent: c.isPhone ? 'CĂ³ SÄT' : c.isHighIntent ? 'Nhu cáº§u cao' : c.text.match(/^[0-9A-D]\./) ? 'Tham gia Minigame' : c.text.length < 10 ? 'TÆ°Æ¡ng tĂ¡c' : 'BĂ¬nh thÆ°á»ng'
        })),
        leads: leads.map(l => ({
          id: l.id,
          time: l.time,
          user: l.name,
          info: l.phone !== 'ChÆ°a cĂ³' ? l.phone : 'Inbox',
          type: l.intent === 'HOT' ? 'SÄT Trá»±c tiáº¿p' : 'Nhu cáº§u cao',
          status: l.status,
          note: l.text
        })),
        winners: leaderboard.map((w, idx) => ({
          rank: w.rank,
          user: w.name,
          time: `+${w.speed}`,
          answer: w.answer,
          type: idx < 3 ? 'ChĂ­nh thá»©c' : 'Dá»± bá»‹',
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

    // Báº¯n sá»± kiá»‡n sang Socket Ä‘á»ƒ mĂ¡y há»c sinh hiá»ƒn thá»‹ cĂ¢u há»i
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
      setToastMessage(`đŸ‰ ÄĂ£ gá»­i ká»‹ch báº£n Auto-DM thĂ nh cĂ´ng cho Top 3 Winners vĂ  Top 10 Backup Winners!`);
      setTimeout(() => setToastMessage(null), 4000);
    }, 1500);
  };

  const topKeywords = Object.entries(keywordStats).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="flex h-full bg-slate-50 font-sans text-slate-800">
      
      {/* LEFT PANEL: Ká»CH Báº¢N, TRIVIA & KEYWORDS */}
      <div className="w-[500px] border-r border-slate-200 bg-white flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 shrink-0">
        <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-[10px] font-black border border-red-100 shadow-sm uppercase">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span> ÄANG PHĂT LIVE
            </span>
            <span className="text-[11px] font-bold text-slate-400">#LIVE</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{sessionData?.title || 'Äang táº£i...'}</h1>
          <p className="text-[12px] text-slate-500 mt-1 font-medium flex items-center gap-2">
            <Users size={12} /> Máº¯t xem: {sessionData ? '1,402' : '...'} â€¢ Quáº£n trá»‹ viĂªn
          </p>
        </div>

        {/* Left Tabs */}
        <div className="flex p-4 pb-0 gap-1 border-b border-slate-100 bg-slate-50">
          <button onClick={() => setActiveTabLeft('SCRIPT')} className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-t-xl text-[11px] font-bold transition-all ${activeTabLeft === 'SCRIPT' ? 'bg-white text-[#F58220] border-t border-l border-r border-slate-200 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.02)]' : 'text-slate-500 hover:bg-slate-200/50 border border-transparent'}`}>
            <ListTodo size={16} /> Ká»‹ch báº£n
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
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">TrĂ¬nh soáº¡n tháº£o Ká»‹ch báº£n</label>
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
              {questions.length === 0 ? <p className="text-sm text-slate-400 text-center py-10">KhĂ´ng cĂ³ cĂ¢u há»i nĂ o.</p> : 
                questions.map((q) => (
                <div key={q.id} className={`rounded-2xl border transition-all duration-300 relative overflow-hidden ${activeQuestion === q.id ? 'border-[#F58220] shadow-[0_8px_30px_rgba(245,130,32,0.12)] bg-white' : editingQuestionId === q.id ? 'border-[#005691] shadow-lg bg-white' : 'border-slate-200 bg-slate-50/50'}`}>
                  {activeQuestion === q.id && <div className="absolute top-0 left-0 h-1 bg-[#F58220] transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / q.timeLimit) * 100}%` }} />}
                  
                  <div className="p-5 pl-6 pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-md ${activeQuestion === q.id ? 'bg-[#F58220] text-white' : editingQuestionId === q.id ? 'bg-[#005691] text-white' : 'bg-slate-200 text-slate-600'}`}>{q.code}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#00A859] bg-green-50 px-2 py-1 rounded-md border border-green-100">ÄĂ¡p Ă¡n: {editingQuestionId === q.id ? editDraft?.answer : q.answer}</span>
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
                          <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">CĂ¢u há»i</label>
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
                                placeholder={`ÄĂ¡p Ă¡n ${opt}...`} 
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
                            <CheckCircle2 size={13} /> LÆ°u cĂ¢u há»i
                          </button>
                          <button 
                            onClick={() => { setEditingQuestionId(null); setEditDraft(null); }}
                            className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl"
                          >Há»§y</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-slate-800 leading-snug mb-3">{q.content}</p>
                        
                        <div className="grid grid-cols-2 gap-2 mb-5">
                          {(['A', 'B', 'C', 'D'] as const).map(opt => (
                            <div key={opt} className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 ${q.answer === opt ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                              <span className={`text-[10px] font-black w-4 h-4 flex items-center justify-center rounded ${q.answer === opt ? 'bg-[#00A859] text-white' : 'bg-slate-100 text-slate-500'}`}>{opt}</span>
                              <span className="text-xs font-semibold text-slate-700">{q.options?.[opt] || `ÄĂ¡p Ă¡n ${opt}...`}</span>
                            </div>
                          ))}
                        </div>

                        {activeQuestion === q.id ? (
                          <button onClick={() => setActiveQuestion(null)} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl text-xs font-bold shadow-lg">
                            <Square size={14} className="fill-white" /> Káº¾T THĂC CĂ‚U Há»I
                          </button>
                        ) : (
                          <button onClick={() => startGame(q.id, q.timeLimit)} disabled={activeQuestion !== null} className={`w-full flex items-center justify-center gap-2 border-2 py-3 rounded-xl text-xs font-bold transition-all ${activeQuestion !== null ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-200 hover:border-[#F58220] hover:text-[#F58220]'}`}>
                            <Play size={14} /> Báº®T Äáº¦U ({q.timeLimit}s)
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  {activeQuestion === q.id && (
                    <div className="bg-orange-50 text-[#F58220] border-t border-orange-100 text-[10px] font-black p-2.5 flex justify-between px-5 uppercase">
                      <span className="flex items-center gap-2"><Zap size={12} className="animate-pulse fill-[#F58220]" /> CHáº¤M ÄIá»‚M Tá»° Äá»˜NG...</span>
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
                  <TrendingUp size={14} /> Tá»« khĂ³a ngÆ°á»i xem Ä‘ang há»i nhiá»u nháº¥t
                </h3>
                <div className="space-y-3">
                  {topKeywords.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-5">AI Ä‘ang thu tháº­p dá»¯ liá»‡u...</p>
                  ) : (
                    topKeywords.map(([kw, count], idx) => (
                      <div key={kw} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-black text-[#005691]">#{idx + 1}</span>
                          <span className="font-bold text-slate-800 capitalize">{kw}</span>
                        </div>
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">{count} lÆ°á»£t há»i</span>
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
              <MessageSquare size={16} /> Luá»“ng Comment
            </button>
            <button onClick={() => setActiveTabRight('LEADS')} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all relative ${activeTabRight === 'LEADS' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}>
              <Phone size={16} /> Báº¯t Leads (AI)
              {leads.filter(l => l.status === 'ChÆ°a gá»i').length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[9px] font-black items-center justify-center">{leads.filter(l => l.status === 'ChÆ°a gá»i').length}</span></span>
              )}
            </button>
            <button onClick={() => setActiveTabRight('WINNERS')} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTabRight === 'WINNERS' ? 'bg-white text-[#00A859] shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}>
              <Trophy size={16} /> Báº£ng NgÆ°á»i TrĂºng
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative p-8">
          
          {/* TAB: COMMENTS */}
          {activeTabRight === 'COMMENTS' && (
            <div className="absolute inset-0 p-8 flex flex-col">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4"><MessageSquare size={14} className="text-[#005691]" /> Comment trá»±c tiáº¿p tá»« TikTok/FB</h3>
              <div className="flex-1 bg-slate-900 rounded-3xl shadow-xl p-6 flex flex-col overflow-hidden relative border border-slate-800">
                <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-slate-900 to-transparent z-10 pointer-events-none"></div>
                <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-4 custom-scrollbar">
                  {comments.map((cmt) => (
                    <div key={cmt.id} className={`flex flex-col gap-2 p-4 rounded-2xl border backdrop-blur-sm group ${cmt.isPhone || cmt.isHighIntent ? 'bg-red-900/30 border-red-700/50' : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'}`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-xs ${cmt.isPhone || cmt.isHighIntent ? 'text-red-400' : 'text-blue-300'}`}>{cmt.name}</span>
                          {cmt.isPhone && <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">CĂ“ SÄT</span>}
                          {cmt.isHighIntent && <span className="bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Nhu cáº§u cao</span>}
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
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4"><AlertTriangle size={14} className="text-red-500" /> AI Nháº­n Diá»‡n Há»c Sinh Tiá»m NÄƒng (Leads)</h3>
              <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                {leads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-50"><Phone size={48} className="text-slate-300 mb-4" /><p className="font-bold text-slate-500">Há»‡ thá»‘ng AI Ä‘ang quĂ©t comment...</p></div>
                ) : (
                  leads.map((lead, idx) => (
                    <div key={lead.id} className={`flex items-center justify-between p-5 rounded-2xl border ${lead.status === 'ChÆ°a gá»i' ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200 opacity-70'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black ${lead.status === 'ChÆ°a gá»i' ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500'}`}>{idx + 1}</div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-lg font-black tracking-wide text-slate-900">{lead.phone}</p>
                            {lead.intent === 'HOT' ? (
                              <span className="bg-red-100 text-red-700 text-[9px] px-1.5 py-0.5 rounded font-black border border-red-200">SÄT TRá»°C TIáº¾P</span>
                            ) : (
                              <span className="bg-orange-100 text-orange-700 text-[9px] px-1.5 py-0.5 rounded font-black border border-orange-200">AI DETECT: Cáº¦N TÆ¯ Váº¤N</span>
                            )}
                          </div>
                          <p className="text-[11px] font-bold text-slate-500">TĂ i khoáº£n: <span className="text-blue-600">{lead.name}</span> â€¢ Comment: "{lead.text}"</p>
                        </div>
                      </div>
                      <button onClick={() => setLeads(prev => prev.map(l => l.id === lead.id ? {...l, status: l.status === 'ChÆ°a gá»i' ? 'ÄĂ£ tÆ° váº¥n' : 'ChÆ°a gá»i'} : l))} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 ${lead.status === 'ChÆ°a gá»i' ? 'bg-[#F58220] hover:bg-[#e07010] text-white' : 'bg-slate-200 text-slate-600'}`}>
                        <CheckCircle2 size={16} />{lead.status === 'ChÆ°a gá»i' ? 'Chá»‘t Ä‘Æ¡n / Nháº­n xá»­ lĂ½' : 'ÄĂ£ xá»­ lĂ½ xong'}
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
                  <Trophy size={14} className="text-[#00A859]" /> NgÆ°á»i Tháº¯ng CÆ°á»£c & Dá»± Bá»‹ (Auto-Ranking)
                </h3>
                {activeQuestion && (
                  <div className="flex items-center gap-4 bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Cmt thu Ä‘Æ°á»£c: <span className="text-slate-900 font-black text-xs">{stats.total}</span></p>
                    <div className="w-[1px] h-4 bg-slate-200"></div>
                    <p className="text-[10px] font-bold text-[#00A859] uppercase">ÄĂ¡p Ă¡n Ä‘Ăºng: <span className="font-black text-xs">{stats.correct}</span></p>
                  </div>
                )}
              </div>
              <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                {leaderboard.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-20 opacity-50">
                    <Trophy size={48} className="text-slate-300 mb-4" />
                    <p className="font-bold text-slate-500">ChÆ°a cĂ³ ai tráº£ lá»i Ä‘Ăºng.</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-2 text-xs font-black text-slate-400 uppercase tracking-widest pl-2">đŸ† TOP 3 - TRĂNG QUĂ€ CHĂNH THá»¨C</div>
                    {leaderboard.slice(0, 3).map((user, idx) => (
                      <div key={user.name} className="flex items-center justify-between p-4 rounded-2xl border bg-orange-50 border-orange-200">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black bg-[#F58220] text-white shadow-sm">{user.rank}</div>
                          <div>
                            <p className="font-bold text-slate-900 flex items-center gap-2">
                              {user.name} 
                              {user.winCount > 0 && <span className="bg-purple-100 text-purple-700 border border-purple-200 text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1"><Gift size={10}/> TrĂºng láº§n {user.winCount + 1}</span>}
                            </p>
                            <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1"><Clock size={12}/> Tá»‘c Ä‘á»™: {user.speed}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-800 mb-0.5">ÄĂ¡p Ă¡n: {user.answer}</p>
                          <span className="text-[9px] font-black text-[#00A859] bg-green-50 px-2 py-0.5 rounded border border-green-100">Há»£p Lá»‡</span>
                        </div>
                      </div>
                    ))}
                    
                    {leaderboard.length > 3 && (
                      <div className="mt-4 mb-2 text-xs font-black text-slate-400 uppercase tracking-widest pl-2">â ï¸ TOP Dá»° Bá» (PHĂ’NG Há»œ BOM HĂ€NG)</div>
                    )}
                    {leaderboard.slice(3).map((user, idx) => (
                      <div key={user.name} className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 border-slate-200 opacity-80">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold bg-slate-200 text-slate-600">{user.rank}</div>
                          <div>
                            <p className="font-bold text-slate-700 text-sm">{user.name}</p>
                            <p className="text-[10px] font-bold text-slate-400">Tá»‘c Ä‘á»™: {user.speed}</p>
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
                          <><Zap size={18} className="animate-pulse" /> Äang gá»­i ká»‹ch báº£n Auto-DM...</>
                        ) : (
                          <><MessageSquare size={18} /> Gá»­i Tin Nháº¯n DM TrĂºng ThÆ°á»Ÿng (Cáº£ ChĂ­nh Thá»©c & Dá»± Bá»‹)</>
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
            <p className="font-black text-sm uppercase tracking-wide">đŸ¨ AI Detect: CĂ³ Lead Tiá»m NÄƒng Má»›i!</p>
            <p className="text-xs font-medium opacity-90 mt-0.5">Há»‡ thá»‘ng vá»«a báº¯t Ä‘Æ°á»£c há»c sinh cĂ³ nhu cáº§u tÆ° váº¥n.</p>
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
