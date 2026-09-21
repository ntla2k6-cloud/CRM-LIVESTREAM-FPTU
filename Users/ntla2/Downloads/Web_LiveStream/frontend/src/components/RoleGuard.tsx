"use client";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ShieldAlert, Loader2, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  
  if (pathname === '/login' || pathname.startsWith('/tracking')) {
    return <>{children}</>;
  }

  if (status === 'loading') {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-400" size={32} /></div>;
  }

  if (!session) {
    return <>{children}</>;
  }

  const role = (session.user as any)?.role;

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
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all shadow-md shadow-slate-900/10 flex items-center justify-center gap-2">
            <LogOut size={18} /> Quay lại trang đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
