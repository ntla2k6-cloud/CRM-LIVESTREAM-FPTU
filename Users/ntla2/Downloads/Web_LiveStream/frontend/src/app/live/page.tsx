'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Loader2, Sparkles, Zap, ShieldCheck, Download, Puzzle } from 'lucide-react';

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

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 flex items-center justify-center">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-5 gap-6">
        
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

        {/* RIGHT COLUMN: EXTENSION INFO */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-xl border border-slate-700 overflow-hidden text-white p-8 flex flex-col justify-center relative">
          <div className="absolute top-0 right-0 p-32 bg-blue-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
          
          <div className="relative z-10">
            <h2 className="text-xl font-black mb-4 flex items-center gap-2">
              <Puzzle className="text-blue-400" /> 
              Bắt 100% Comment
            </h2>
            <p className="text-slate-400 text-sm font-medium mb-6 leading-relaxed">
              Sử dụng <b className="text-white">FPTU LIVE EXTENSION</b> để kết nối trực tiếp từ trình duyệt của bạn, bỏ qua mọi giới hạn chống Bot của nền tảng Tiktok.
            </p>
            
            <div className="space-y-4">
              <div className="bg-white/10 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">1</div>
                  <h3 className="font-bold text-sm">Cài đặt Extension</h3>
                </div>
                <p className="text-xs text-slate-400 pl-9">Kích hoạt thư mục <code className="bg-black/30 px-1 py-0.5 rounded text-orange-300">extension</code> ở chế độ Developer Mode trong Chrome.</p>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">2</div>
                  <h3 className="font-bold text-sm">Khởi tạo phiên</h3>
                </div>
                <p className="text-xs text-slate-400 pl-9">Nhập tên bất kỳ ở form bên trái để tạo phiên. Sau đó copy mã Phiên dán vào Extension.</p>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">3</div>
                  <h3 className="font-bold text-sm">Kết nối đồng bộ</h3>
                </div>
                <p className="text-xs text-slate-400 pl-9">Vừa xem Live vừa nhận comment trực tiếp về màn hình CRM với độ trễ 0s.</p>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
