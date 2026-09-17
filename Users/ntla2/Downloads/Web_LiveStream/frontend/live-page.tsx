"use client"
import React, { useState, useEffect } from 'react';
import { 
  Play, Square, MessageSquare, Users, Trash2, Timer, Video, ListTodo, Pin, CheckCircle2, Phone, BellRing, Trophy, Clock, Zap, Target
} from 'lucide-react';

export default function LiveControlPage() {
  const [activeTabLeft, setActiveTabLeft] = useState<'SCRIPT' | 'TRIVIA' | 'PINNED_QA'>('SCRIPT');
  const [activeTabRight, setActiveTabRight] = useState<'COMMENTS' | 'LEADS' | 'WINNERS'>('COMMENTS');
  
  // ============ STATES: KỊCH BẢN & Q&A ============
  const [scriptContent, setScriptContent] = useState(
    "1. Chào hỏi & Minigame đầu giờ (15p)\n- Kêu gọi thả tim, share livestream\n\n2. Q&A Giải đáp thắc mắc\n- Tập trung trả lời câu hỏi được ghim\n\n3. Trắc nghiệm Minigame\n- Chơi 3 câu nhận Balo FPTU"
  );
  const [pinnedQA, setPinnedQA] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [newLeadAlert, setNewLeadAlert] = useState(false);

  // ============ STATES: TRIVIA / MINIGAME ============
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [stats, setStats] = useState({ total: 0, correct: 0 });
  const [sendingDMs, setSendingDMs] = useState(false);

  const questions = [
    { id: 1, code: "Q001", content: "Đại học FPT có tổng cộng bao nhiêu cơ sở (Campus) trên toàn quốc?", answer: "C", options: ["A. 3", "B. 4", "C. 5", "D. 6"], timeLimit: 30 },
    { id: 2, code: "Q002", content: "Ngành học nào KHÔNG thuộc khối ngành CNTT tại ĐH FPT?", answer: "D", options: ["A. Kỹ thuật phần mềm", "B. Trí tuệ nhân tạo", "C. An toàn thông tin", "D. Truyền thông đa phương tiện"], timeLimit: 45 },
  ];
  const activeQ = questions.find(q => q.id === activeQuestion);

  // ============ ENGINE TỔNG HỢP (COMMENTS + LEADS + TRIVIA) ============
  const [comments, setComments] = useState<any[]>([]);

  // 1. Timer Engine
  useEffect(() => {
    if (!activeQuestion) return;
    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          setActiveQuestion(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [activeQuestion]);

  // 2. Comment & Logic Engine
  useEffect(() => {
    const names = ["@tuan.coder", "@hoaianh", "@minh_fptu", "@linh.cute", "@hoang.vu", "@anh.ngoc", "@vy.le"];
    const randomTexts = [
      "Cho em hỏi học phí ngành SE ạ?", 
      "Tư vấn em với 0987123456", 
      "Điểm chuẩn năm nay bao nhiêu vậy ạ?", 
      "Em muốn đăng ký 0912999888",
      "Ký túc xá có bắt buộc không ạ",
      "A", "B", "C", "D", "1.A", "1.C"
    ];
    
    const commentInterval = setInterval(() => {
      // Nếu đang có Minigame, tăng tỷ lệ người dùng chat đáp án đúng
      const isCorrectTriviaText = activeQ ? Math.random() > 0.6 : false;
      const text = isCorrectTriviaText ? `1.${activeQ!.answer}` : randomTexts[Math.floor(Math.random() * randomTexts.length)];
      const name = names[Math.floor(Math.random() * names.length)];
      const isPhone = text.match(/\d{9,10}/) !== null;
      
      const newComment = {
        id: Math.random().toString(),
        name: name,
        text: text,
        time: new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit', second:'2-digit'}),
        isPhone: isPhone,
        timestamp: Date.now()
      };

      setComments(prev => [newComment, ...prev].slice(0, 50));

      // --- LOGIC 1: Bắt Số Điện Thoại (Leads) ---
      if (isPhone) {
        setLeads(prev => {
          if (prev.find(l => l.name === newComment.name)) return prev; // Avoid duplicate alerts for same user
          setNewLeadAlert(true);
          setTimeout(() => setNewLeadAlert(false), 3000);
          return [{ id: newComment.id, name: newComment.name, phone: text.match(/\d{9,10}/)?.[0], time: newComment.time, status: 'Chưa gọi' }, ...prev];
        });
      }

      // --- LOGIC 2: Chấm điểm Minigame ---
      if (activeQ) {
        const answerRegex = new RegExp(activeQ.answer, 'i');
        const isCorrect = answerRegex.test(newComment.text);
        
        setStats(prev => ({ total: prev.total + 1, correct: prev.correct + (isCorrect ? 1 : 0) }));

        if (isCorrect) {
          setLeaderboard(prev => {
            if (prev.find(u => u.name === newComment.name)) return prev;
            const speedMs = newComment.timestamp - (startTime || Date.now());
            const speedSec = (speedMs / 1000).toFixed(1);
            
            const newUser = {
              name: newComment.name,
              answer: newComment.text,
              speed: `${speedSec}s`,
              speedMs,
              avatar: newComment.name.charAt(1).toUpperCase()
            };
            const newBoard = [...prev, newUser].sort((a, b) => a.speedMs - b.speedMs).slice(0, 10);
            return newBoard.map((u, i) => ({ ...u, rank: i + 1 }));
          });
        }
      }
    }, 2000); 

    return () => clearInterval(commentInterval);
  }, [activeQ, startTime]);

  // ============ ACTIONS ============
  const startGame = (qId: number, timeLimit: number) => {
    setActiveQuestion(qId);
    setTimeLeft(timeLimit);
    setLeaderboard([]);
    setStats({ total: 0, correct: 0 });
    setStartTime(Date.now());
    setActiveTabRight('WINNERS');
  };

  const handleSendDMs = () => {
    if (leaderboard.length === 0) return;
    setSendingDMs(true);
    setTimeout(() => {
      setSendingDMs(false);
      alert(`Đã gửi tự động tin nhắn DM xác nhận trúng thưởng cho ${leaderboard.length} người chơi!`);
    }, 1500);
  };

  const handlePinComment = (cmt: any) => {
    if (!pinnedQA.find(q => q.id === cmt.id)) {
      setPinnedQA(prev => [{...cmt, answered: false}, ...prev]);
      setActiveTabLeft('PINNED_QA');
    }
  };

  return (
    <div className="flex h-full bg-slate-50 font-sans text-slate-800">
      
      {/* LEFT PANEL: KỊCH BẢN, TRIVIA & Q&A GHIM */}
      <div className="w-[500px] border-r border-slate-200 bg-white flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 shrink-0">
        <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-[10px] font-black border border-red-100 shadow-sm uppercase">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span> ĐANG PHÁT LIVE
            </span>
            <span className="text-[11px] font-bold text-slate-400">#023</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tư vấn & Tặng Quà Đợt 2</h1>
          <p className="text-[12px] text-slate-500 mt-1 font-medium flex items-center gap-2">
            <Users size={12} /> Mắt xem: 1,402 • Quản trị viên
          </p>
        </div>

        {/* Left Tabs */}
        <div className="flex p-4 pb-0 gap-1 border-b border-slate-100 bg-slate-50">
          <button onClick={() => setActiveTabLeft('SCRIPT')} className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-t-xl text-[11px] font-bold transition-all ${activeTabLeft === 'SCRIPT' ? 'bg-white text-[#F58220] border-t border-l border-r border-slate-200 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.02)]' : 'text-slate-500 hover:bg-slate-200/50 border border-transparent'}`}>
            <ListTodo size={16} /> Kịch bản
          </button>
          <button onClick={() => setActiveTabLeft('TRIVIA')} className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-t-xl text-[11px] font-bold transition-all ${activeTabLeft === 'TRIVIA' ? 'bg-white text-[#F58220] border-t border-l border-r border-slate-200 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.02)]' : 'text-slate-500 hover:bg-slate-200/50 border border-transparent'}`}>
            <Target size={16} /> Câu đố (Minigame)
          </button>
          <button onClick={() => setActiveTabLeft('PINNED_QA')} className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-t-xl text-[11px] font-bold transition-all ${activeTabLeft === 'PINNED_QA' ? 'bg-white text-[#F58220] border-t border-l border-r border-slate-200 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.02)]' : 'text-slate-500 hover:bg-slate-200/50 border border-transparent'}`}>
            <Pin size={16} /> Q&A Đã ghim ({pinnedQA.filter(q=>!q.answered).length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          
          {/* SCRIPT TAB */}
          {activeTabLeft === 'SCRIPT' && (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Trình soạn thảo Kịch bản (Cho VJ)</label>
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
              {questions.map((q) => (
                <div key={q.id} className={`rounded-2xl border transition-all duration-300 relative overflow-hidden ${activeQuestion === q.id ? 'border-[#F58220] shadow-[0_8px_30px_rgba(245,130,32,0.12)] bg-white' : 'border-slate-200 bg-slate-50/50'}`}>
                  {activeQuestion === q.id && <div className="absolute top-0 left-0 h-1 bg-[#F58220] transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / q.timeLimit) * 100}%` }} />}
                  <div className="p-5 pl-6 pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-md ${activeQuestion === q.id ? 'bg-[#F58220] text-white' : 'bg-slate-200 text-slate-600'}`}>{q.code}</span>
                      <span className="text-[10px] font-bold text-[#00A859] bg-green-50 px-2 py-1 rounded-md border border-green-100">Đáp án: {q.answer}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-snug mb-5">{q.content}</p>
                    {activeQuestion === q.id ? (
                      <button onClick={() => setActiveQuestion(null)} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl text-xs font-bold shadow-lg">
                        <Square size={14} className="fill-white" /> KẾT THÚC CÂU HỎI
                      </button>
                    ) : (
                      <button onClick={() => startGame(q.id, q.timeLimit)} disabled={activeQuestion !== null} className={`w-full flex items-center justify-center gap-2 border-2 py-3 rounded-xl text-xs font-bold transition-all ${activeQuestion !== null ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-200 hover:border-[#F58220] hover:text-[#F58220]'}`}>
                        <Play size={14} /> BẮT ĐẦU ({q.timeLimit}s)
                      </button>
                    )}
                  </div>
                  {activeQuestion === q.id && (
                    <div className="bg-orange-50 text-[#F58220] border-t border-orange-100 text-[10px] font-black p-2.5 flex justify-between px-5 uppercase">
                      <span className="flex items-center gap-2"><Zap size={12} className="animate-pulse fill-[#F58220]" /> TỰ ĐỘNG CHẤM ĐIỂM...</span>
                      <span className="flex items-center gap-1.5"><Timer size={12} /> {timeLeft}s</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* PINNED Q&A TAB */}
          {activeTabLeft === 'PINNED_QA' && (
            <div className="space-y-4">
              {pinnedQA.length === 0 ? (
                <div className="text-center py-10 text-slate-400"><Pin size={40} className="mx-auto mb-3 opacity-20" /><p className="text-sm font-bold">Chưa có câu hỏi nào được ghim.</p></div>
              ) : (
                pinnedQA.map((q) => (
                  <div key={q.id} className={`p-5 rounded-2xl border ${q.answered ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-blue-50/50 border-[#005691]/20 shadow-md'}`}>
                    <div className="flex justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#005691] text-white flex items-center justify-center font-black text-xs">{q.name.charAt(1).toUpperCase()}</div>
                        <div><p className="text-xs font-black text-slate-900">{q.name}</p><p className="text-[10px] font-bold text-slate-400">{q.time}</p></div>
                      </div>
                      <button onClick={() => setPinnedQA(prev => prev.map(p => p.id === q.id ? {...p, answered: !p.answered} : p))} className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${q.answered ? 'bg-slate-200 text-slate-500' : 'bg-[#00A859] text-white'}`}>
                        <CheckCircle2 size={14} /> {q.answered ? 'Đã trả lời' : 'Xong'}
                      </button>
                    </div>
                    <p className={`text-[15px] font-bold leading-snug ${q.answered ? 'text-slate-500' : 'text-[#005691]'}`}>"{q.text}"</p>
                  </div>
                ))
              )}
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
              <Phone size={16} /> Leads (SĐT)
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
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4"><MessageSquare size={14} className="text-[#005691]" /> Comment trực tiếp từ TikTok/FB</h3>
              <div className="flex-1 bg-slate-900 rounded-3xl shadow-xl p-6 flex flex-col overflow-hidden relative border border-slate-800">
                <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-slate-900 to-transparent z-10 pointer-events-none"></div>
                <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-4 custom-scrollbar">
                  {comments.map((cmt) => (
                    <div key={cmt.id} className={`flex flex-col gap-2 p-4 rounded-2xl border backdrop-blur-sm group ${cmt.isPhone ? 'bg-red-900/30 border-red-700/50' : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'}`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2"><span className={`font-bold text-xs ${cmt.isPhone ? 'text-red-400' : 'text-blue-300'}`}>{cmt.name}</span>{cmt.isPhone && <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">CÓ SĐT</span>}</div>
                        <span className="text-[10px] font-medium text-slate-500">{cmt.time}</span>
                      </div>
                      <div className="flex items-end justify-between gap-4">
                        <span className="text-slate-200 font-semibold text-[15px] leading-snug">{cmt.text}</span>
                        {!cmt.isPhone && (
                          <button onClick={() => handlePinComment(cmt)} className="shrink-0 flex items-center gap-1.5 bg-slate-700/50 hover:bg-[#F58220] text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all opacity-0 group-hover:opacity-100 shadow-sm"><Pin size={14} /> Ghim cho VJ</button>
                        )}
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
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4"><Phone size={14} className="text-red-500" /> Nhắc việc CSKH Real-time</h3>
              <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                {leads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-50"><Phone size={48} className="text-slate-300 mb-4" /><p className="font-bold text-slate-500">Chưa có khách nào để lại SĐT.</p></div>
                ) : (
                  leads.map((lead, idx) => (
                    <div key={lead.id} className={`flex items-center justify-between p-5 rounded-2xl border ${lead.status === 'Chưa gọi' ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200 opacity-70'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black ${lead.status === 'Chưa gọi' ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500'}`}>{idx + 1}</div>
                        <div><p className="text-lg font-black tracking-wide text-slate-900 mb-0.5">{lead.phone}</p><p className="text-[11px] font-bold text-slate-500">Tài khoản: <span className="text-blue-600">{lead.name}</span> • Lấy lúc {lead.time}</p></div>
                      </div>
                      <button onClick={() => setLeads(prev => prev.map(l => l.id === lead.id ? {...l, status: l.status === 'Chưa gọi' ? 'Đã tư vấn' : 'Chưa gọi'} : l))} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold ${lead.status === 'Chưa gọi' ? 'bg-[#F58220] hover:bg-[#e07010] text-white' : 'bg-slate-200 text-slate-600'}`}>
                        <CheckCircle2 size={16} />{lead.status === 'Chưa gọi' ? 'Chốt đơn / Đã gọi' : 'Đã xử lý xong'}
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
                  <Trophy size={14} className="text-[#00A859]" /> Bảng xếp hạng người chơi đúng & nhanh nhất
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
                    {leaderboard.map((user, idx) => (
                      <div key={user.name} className={`flex items-center justify-between p-4 rounded-2xl border ${idx === 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${idx === 0 ? 'bg-[#F58220] text-white' : 'bg-slate-100 text-slate-500'}`}>{user.rank}</div>
                          <div><p className="font-bold text-slate-900">{user.name}</p><p className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><Clock size={12}/> Tốc độ: {user.speed}</p></div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-800 mb-0.5">Đáp án: {user.answer}</p>
                          <span className="text-[9px] font-black text-[#00A859] bg-green-50 px-2 py-0.5 rounded border border-green-100">Hợp Lệ</span>
                        </div>
                      </div>
                    ))}
                    {!activeQuestion && (
                      <button 
                        onClick={handleSendDMs} 
                        disabled={sendingDMs}
                        className="mt-4 w-full py-4 rounded-2xl font-bold bg-[#005691] hover:bg-[#004a7c] text-white shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                      >
                        {sendingDMs ? (
                          <><Zap size={18} className="animate-pulse" /> Đang cấu hình kịch bản gửi tin nhắn tự động...</>
                        ) : (
                          <><MessageSquare size={18} /> Gửi Tin Nhắn DM Theo Danh Sách Này</>
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
        <div className="fixed bottom-8 right-8 bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-10 fade-in z-50">
          <BellRing size={24} className="animate-bounce" />
          <div><p className="font-black text-sm uppercase tracking-wide">Có Lead mới!</p><p className="text-xs font-medium opacity-90">Khách vừa để lại SĐT trong comment.</p></div>
        </div>
      )}
      
    </div>
  );
}
