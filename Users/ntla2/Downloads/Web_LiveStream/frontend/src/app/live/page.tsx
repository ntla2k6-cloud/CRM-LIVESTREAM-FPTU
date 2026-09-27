'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Loader2 } from 'lucide-react';

export default function LivePage() {
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
      
      // Auto redirect to the Dashboard with autoConnect=true
      router.push(`/live/${data.id}?autoConnect=true&tiktokUsername=${data.creatorUsername}`);
    } catch (e: any) {
      setError(e.message || 'Lỗi mạng hoặc server không phản hồi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">KẾT NỐI TIKTOK LIVE</h1>
            <p className="text-slate-400 font-medium">Hệ thống sẽ tự động lấy thông tin và bắt đầu AI Comment Engine.</p>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
              Dán link TikTok LIVE hoặc nhập Username
            </label>
            <input 
              type="text" 
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="VD: https://www.tiktok.com/@fptuniversity/live"
              disabled={isLoading}
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-[#F58220] focus:ring-4 focus:ring-orange-100 transition-all font-medium text-slate-900 text-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            />
            {error && (
              <p className="text-red-500 text-sm font-bold mt-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span> {error}
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
                ĐANG KẾT NỐI VÀ LẤY DỮ LIỆU...
              </>
            ) : (
              <>
                <Play size={24} className="fill-white" />
                KẾT NỐI LIVE NGAY
              </>
            )}
          </button>
          
          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">QUY TRÌNH TỰ ĐỘNG (ZERO-MANUAL)</p>
            <div className="flex justify-center items-center gap-2 text-sm text-slate-500 font-medium">
              <span>Resolve</span> → <span>Create Session</span> → <span>Connect</span> → <span>AI Classification</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
