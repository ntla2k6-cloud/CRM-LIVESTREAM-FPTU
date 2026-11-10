"use client"
import React, { useState } from 'react';
import { ShieldCheck, User, Lock, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Đăng nhập bằng tài khoản do Admin cấp (không cần Gmail) — /api/login tạo phiên giống Google
  const loginWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Lỗi ${res.status}`);
      const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
      window.location.href = callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//') ? callbackUrl : '/';
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 flex flex-col justify-center items-center relative overflow-hidden font-sans">

      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#F58220] rounded-full blur-[120px] opacity-20"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#005691] rounded-full blur-[120px] opacity-20"></div>

      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-8 relative z-10">

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <span className="font-black text-2xl tracking-tighter">FPT<span className="text-[#F58220]">.</span></span>
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hệ thống Quản trị LIVE</h1>
          <p className="text-sm font-bold text-slate-500 mt-2">Đăng nhập bằng Google hoặc tài khoản được cấp</p>
        </div>

        <button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="w-full bg-white border-2 border-slate-100 hover:bg-slate-50 text-slate-700 font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-sm hover:shadow-md"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Đăng nhập bằng Email FPT
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">hoặc tài khoản</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <form onSubmit={loginWithPassword} className="space-y-3">
          <label className="block">
            <span className="sr-only">Tài khoản</span>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Tài khoản" autoComplete="username" required
                className="w-full pl-10 pr-4 py-3 border-2 border-slate-100 rounded-xl text-sm font-semibold outline-none focus:border-[#005691]" />
            </div>
          </label>
          <label className="block">
            <span className="sr-only">Mật khẩu</span>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mật khẩu" autoComplete="current-password" required
                className="w-full pl-10 pr-4 py-3 border-2 border-slate-100 rounded-xl text-sm font-semibold outline-none focus:border-[#005691]" />
            </div>
          </label>
          {error && <p className="text-sm font-semibold text-red-600" role="alert">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#005691] hover:bg-[#004270] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
            {loading && <Loader2 size={16} className="animate-spin" />} Đăng nhập
          </button>
        </form>

      </div>

      <div className="mt-8 flex items-center gap-2 text-xs font-bold text-slate-400">
        <ShieldCheck size={14} className="text-[#00A859]" /> Được bảo mật và quản lý bởi Admin
      </div>
    </div>
  );
}
