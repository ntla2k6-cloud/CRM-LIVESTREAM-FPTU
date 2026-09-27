"use client";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ShieldAlert, Loader2, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const pathname = usePathname();
  const [realtimeRole, setRealtimeRole] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  
  useEffect(() => {
    if (status === 'authenticated') {
      // Fetch latest role from DB to bypass stale session cache
      fetch('/api/auth/me', { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data.authenticated && data.user) {
            setRealtimeRole(data.user.role);
            // If DB role is different from session role, update NextAuth session
            if (data.user.role !== (session?.user as any)?.role) {
               update({ role: data.user.role });
            }
          }
        })
        .catch(console.error)
        .finally(() => setIsVerifying(false));
    } else if (status === 'unauthenticated') {
      setIsVerifying(false);
    }
  }, [status, session]);

  if (pathname === '/login' || pathname.startsWith('/tracking')) {
    if (pathname === '/login' && session && ((realtimeRole || (session.user as any)?.role) !== 'GUEST')) {
      if (typeof window !== 'undefined') window.location.href = '/';
      return <div className="h-screen w-full bg-slate-50"></div>;
    }
    return <>{children}</>;
  }

  if (status === 'loading' || (status === 'authenticated' && isVerifying)) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-400" size={32} /></div>;
  }

  if (!session) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return <div className="h-screen w-full bg-slate-50"></div>;
  }

  const role = realtimeRole || (session.user as any)?.role;

  if (role === 'GUEST') {
    return (
      <div className="h-full w-full bg-slate-50 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none flex justify-center items-center opacity-30">
          <div className="w-[500px] h-[500px] bg-gradient-to-tr from-orange-200 to-blue-200 rounded-full blur-[80px]" />
        </div>
        
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 max-w-md w-full text-center flex flex-col items-center relative z-10 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100 rounded-full flex items-center justify-center text-[#F58220] mb-5 shadow-inner">
            <ShieldAlert size={36} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Tài khoản chờ duyệt</h2>
          <p className="text-[15px] font-medium text-slate-500 mb-8 leading-relaxed px-4">
            Xin chào <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{session.user?.name}</span>!<br/><br/>
            Tài khoản của bạn đã được ghi nhận vào hệ thống nhưng <span className="font-bold text-orange-600">chưa được phân quyền truy cập</span>. Vui lòng liên hệ Admin hoặc Quản lý dự án để được cấp quyền nhé!
          </p>
          <div className="flex flex-col gap-3 w-full">
            <button onClick={() => window.location.reload()} className="w-full py-3.5 bg-[#005691] hover:bg-[#004677] text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
               Tải lại trạng thái
            </button>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all shadow-md shadow-slate-900/10 flex items-center justify-center gap-2">
              <LogOut size={18} /> Quay lại trang đăng nhập
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
