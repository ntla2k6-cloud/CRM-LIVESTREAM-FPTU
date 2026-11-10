'use client';
import { useEffect, useState } from 'react';
import { Puzzle, Download, KeyRound, Copy, Check, Loader2, Lock } from 'lucide-react';

const STEPS = [
  'Tải file extension về rồi giải nén (chuột phải → Extract All).',
  'Mở Chrome, vào chrome://extensions, bật "Developer mode" (góc phải trên).',
  'Bấm "Load unpacked", chọn thư mục vừa giải nén (có file manifest.json).',
  'Bấm "Lấy mã kết nối" bên dưới, dán vào popup extension → "Cài đặt server CRM" → "Mã truy cập extension".',
  'Mở TikTok LIVE trên Chrome, bấm extension FPTU → Bắt đầu.',
];

// Tải + cài extension, lấy mã kết nối cá nhân. Chỉ vai trò "Quản lý Phiên Live" được đẩy comment.
export function ExtensionConnectCard() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<{ token: string; expiresAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setRole(d?.user?.role ?? null))
      .catch(() => setRole(null));
  }, []);

  const canPush = role === 'LIVE_MANAGER';

  const getToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/extension/token', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Lỗi ${res.status}`);
      setToken(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Không copy được, hãy bôi đen mã rồi Ctrl+C');
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-xl border border-slate-700 overflow-hidden text-white p-6 relative">
      <div className="absolute top-0 right-0 p-32 bg-blue-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
      <div className="relative z-10">
        <h2 className="text-lg font-black mb-2 flex items-center gap-2">
          <Puzzle className="text-blue-400" size={20} /> Extension bắt comment
        </h2>
        <p className="text-slate-400 text-xs font-medium mb-4 leading-relaxed">
          Chỉ tài khoản có vai trò <b className="text-white">Quản lý Phiên Live</b> được đẩy comment từ extension về CRM.
        </p>

        <a href="/fptu-extension.zip" download
          className="w-full flex items-center justify-center gap-2 py-2.5 mb-4 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm font-bold transition-colors">
          <Download size={16} /> Tải extension (.zip)
        </a>

        <ol className="space-y-2 mb-4">
          {STEPS.map((s, i) => (
            <li key={i} className="bg-white/10 rounded-xl p-2.5 border border-white/5 flex items-start gap-3">
              <span className="w-5 h-5 shrink-0 rounded-full bg-blue-500 flex items-center justify-center text-[11px] font-bold">{i + 1}</span>
              <span className="text-xs font-semibold leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>

        {role === null ? null : canPush ? (
          <div className="space-y-2">
            <button onClick={getToken} disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#F58220] hover:bg-[#e07010] disabled:opacity-60 rounded-xl text-sm font-bold transition-colors">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />} {token ? 'Tạo mã mới' : 'Lấy mã kết nối'}
            </button>
            {token && (
              <div className="bg-black/30 rounded-xl p-3 border border-white/10">
                <div className="flex gap-2">
                  <input readOnly value={token.token} onFocus={e => e.target.select()}
                    className="flex-1 min-w-0 bg-transparent text-[11px] font-mono text-slate-200 outline-none" />
                  <button onClick={copy} className="shrink-0 flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold">
                    {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Đã copy' : 'Copy'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Hạn dùng tới {new Date(token.expiresAt).toLocaleDateString('vi-VN')}. Mã gắn với tài khoản của bạn — không gửi cho người khác.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-start gap-2 bg-white/5 rounded-xl p-3 border border-white/10 text-xs text-slate-300">
            <Lock size={14} className="shrink-0 mt-0.5 text-slate-400" />
            Tài khoản của bạn không có quyền đẩy comment. Nhờ Admin phân vai trò "Quản lý Phiên Live" nếu bạn phụ trách bắt comment.
          </div>
        )}
        {error && <p className="text-xs text-red-300 font-semibold mt-2">{error}</p>}
      </div>
    </div>
  );
}
