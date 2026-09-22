"use client";
import React, { useState, useEffect } from 'react';
import { Trophy, Gift, Send, Loader2, PartyPopper, CheckCircle2 } from 'lucide-react';
import io from 'socket.io-client';
import confetti from 'canvas-confetti';

let socket: any;

export default function StudentPlayPage() {
  const [step, setStep] = useState<'REGISTER' | 'WAITING' | 'PLAYING' | 'ENDED'>('REGISTER');
  const [profile, setProfile] = useState({ name: '', phone: '', school: '' });
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Kết nối tới Socket Backend
    socket = io('http://localhost:3001');

    socket.on('gameStarted', (data: any) => {
      setActiveQuestion(data);
      setStep('PLAYING');
      setAnswer('');
      setSubmitted(false);
    });

    socket.on('gameEnded', () => {
      setStep('WAITING');
      setActiveQuestion(null);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name || !profile.phone) return alert('Vui lòng nhập tên và SĐT');
    setStep('WAITING');
  };

  const handleSubmit = () => {
    if (!answer) return;
    const now = new Date();
    socket.emit('submitAnswer', {
      name: profile.name,
      phone: profile.phone,
      answer: answer,
      time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      timestamp: now.getTime()
    });
    setSubmitted(true);
    
    // Hiệu ứng pháo hoa khi gửi
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-[#F58220] selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 relative">
        
        {/* Header Decor */}
        <div className="h-32 bg-gradient-to-br from-[#F58220] to-[#e07010] relative flex items-center justify-center">
          <div className="absolute inset-0 bg-white/10 opacity-50" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
          <h1 className="text-3xl font-black text-white relative z-10 tracking-wider drop-shadow-md flex items-center gap-2">
            <Trophy className="text-yellow-300" /> FPTU HCM
          </h1>
        </div>

        <div className="p-6">
          {step === 'REGISTER' && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center mb-6">
                <h2 className="text-xl font-black text-slate-800">Đăng ký tham gia</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Nhập thông tin để nhận quà liền tay!</p>
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Họ và tên</label>
                  <input required value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} type="text" className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#F58220] focus:ring-2 focus:ring-orange-100 transition-all font-medium text-slate-700" placeholder="VD: Nguyễn Văn A" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Số điện thoại</label>
                  <input required value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} type="tel" className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#F58220] focus:ring-2 focus:ring-orange-100 transition-all font-medium text-slate-700" placeholder="VD: 0901234567" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Trường THPT (Không bắt buộc)</label>
                  <input value={profile.school} onChange={e => setProfile({...profile, school: e.target.value})} type="text" className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#F58220] focus:ring-2 focus:ring-orange-100 transition-all font-medium text-slate-700" placeholder="VD: THPT Nguyễn Thị Minh Khai" />
                </div>
                <button type="submit" className="w-full py-3.5 bg-[#F58220] hover:bg-[#e07010] text-white font-black rounded-xl shadow-lg shadow-orange-500/30 transition-all flex justify-center items-center gap-2 mt-4">
                  <PartyPopper size={18} /> Vào Phòng Chờ
                </button>
              </form>
            </div>
          )}

          {step === 'WAITING' && (
            <div className="animate-in fade-in zoom-in-95 py-8 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                <Loader2 size={36} className="animate-spin" />
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-2">Đang chờ Host bắt đầu!</h2>
              <p className="text-sm font-medium text-slate-500">Xin chào <span className="text-[#F58220] font-bold">{profile.name}</span>.<br/>Hãy theo dõi Livestream, câu hỏi sẽ tự động hiện lên tại đây nhé!</p>
            </div>
          )}

          {step === 'PLAYING' && (
            <div className="animate-in fade-in zoom-in-95">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-600 font-bold rounded-full text-xs uppercase mb-3 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span> Đang diễn ra
                </div>
                <h2 className="text-xl font-black text-slate-800">Câu hỏi: {activeQuestion?.questionCode || 'Minigame'}</h2>
              </div>
              
              {!submitted ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase text-center block mb-2">Nhập đáp án của bạn</label>
                    <input 
                      autoFocus
                      value={answer} 
                      onChange={e => setAnswer(e.target.value.toUpperCase())} 
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      type="text" 
                      className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-[#F58220] focus:ring-4 focus:ring-orange-100 transition-all font-black text-2xl text-center text-slate-800" 
                      placeholder="VD: A hoặc B, C, D" 
                    />
                  </div>
                  <button onClick={handleSubmit} className="w-full py-4 bg-[#005691] hover:bg-[#004a7c] text-white font-black text-lg rounded-xl shadow-lg shadow-blue-900/20 transition-all flex justify-center items-center gap-2">
                    <Send size={20} /> Gửi Đáp Án Ngay!
                  </button>
                </div>
              ) : (
                <div className="py-6 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h2 className="text-lg font-black text-slate-800 mb-2">Đã gửi thành công!</h2>
                  <p className="text-sm font-medium text-slate-500">Kết quả của bạn là <span className="text-[#005691] font-bold text-lg">{answer}</span>.<br/>Hãy theo dõi Livestream để xem ai là người nhanh nhất nhé!</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
