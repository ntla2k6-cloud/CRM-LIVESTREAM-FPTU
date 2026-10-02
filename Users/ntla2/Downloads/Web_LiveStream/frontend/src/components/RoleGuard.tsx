"use client";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ShieldAlert, Loader2, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";




export function RoleGuard({ children }: { children: React.ReactNode }) {
  const role = ""; // Will be overridden

  const { data: session, status, update } = useSession();
  const pathname = usePathname();
  const [realtimeRole, setRealtimeRole] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [mounted, setMounted] = useState(false);
  const currentRole = realtimeRole || (session?.user as any)?.role;

  useEffect(() => setMounted(true), []);
  
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
    
  // RBAC LOGIC
  if (currentRole !== 'ADMIN' && currentRole !== 'MANAGER' && currentRole !== 'GUEST') {
    
      let p: string[] = [];
      if (currentRole === 'ADMIN' || currentRole === 'MANAGER') p = ['*'];
      else {
        if (currentRole === 'VJ_HOST') p = ['schedule.register', 'live.view'];
        if (currentRole === 'CSKH') p = ['crm.view', 'crm.edit', 'cskh.view', 'cskh.process', 'schedule.register'];
        if (currentRole === 'BIEN_TAP') p = ['live.view', 'live.script', 'schedule.register'];
        if (currentRole === 'KY_THUAT') p = ['live.view', 'live.control', 'schedule.register'];
        if (currentRole === 'SAN_XUAT') p = ['schedule.view', 'schedule.register', 'schedule.approve', 'schedule.manage', 'live.view', 'live.manage'];
        if (currentRole === 'THU_KHO') p = ['inventory.view', 'inventory.manage', 'inventory.export', 'schedule.register'];
        if (typeof window !== 'undefined') {
          try {
            const rbacStr = localStorage.getItem('rbac_roles');
            if (rbacStr) {
              const roles = JSON.parse(rbacStr);
              const myRole = roles.find((rx: any) => rx.value === currentRole);
              if (myRole && myRole.permissions) p = myRole.permissions;
            }
          } catch(e) {}
        }
      }

      if (!p.includes('*')) {
         let allowed = true;
         if (pathname.startsWith('/staff') && !['admin.users', 'admin.approve', 'admin.rbac'].some(k => p.includes(k))) allowed = false;
         if (pathname.startsWith('/schedule') && !['schedule.view', 'schedule.register', 'schedule.approve', 'schedule.manage', 'payroll.view', 'payroll.manage', 'payroll.export'].some(k => p.includes(k))) allowed = false;
         if (pathname.startsWith('/inventory') && !['inventory.view', 'inventory.manage', 'inventory.export'].some(k => p.includes(k))) allowed = false;
         if (pathname.startsWith('/cskh') && !['crm.view', 'crm.edit', 'crm.export', 'cskh.view', 'cskh.process', 'cskh.manage_orders'].some(k => p.includes(k))) allowed = false;
         if (pathname.startsWith('/analytics') && !p.includes('admin.analytics')) allowed = false;
         if (pathname.startsWith('/live') && !['live.view', 'live.manage', 'live.control', 'live.script'].some(k => p.includes(k))) allowed = false;
         if (pathname.startsWith('/settings')) allowed = false;
         
         if (!allowed) {
            return (
              <div className="h-full w-full bg-slate-50 flex items-center justify-center p-6 relative">
                 <div className="text-center bg-white p-8 rounded-3xl shadow-xl border border-red-100 max-w-md w-full">
                    <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
                    <h2 className="text-2xl font-black text-slate-800">Truy cập bị từ chối</h2>
                    <p className="text-slate-500 mt-2 font-medium">Bạn không có quyền truy cập vào phân hệ này dựa theo cấu hình Vai trò (RBAC) hiện tại.</p>
                    <button onClick={() => window.location.href = '/'} className="mt-6 px-6 py-3 bg-[#005691] hover:bg-[#004677] text-white font-bold rounded-xl w-full">Quay lại Trang chủ</button>
                 </div>
              </div>
            );
         }
      }
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

  

  if (currentRole === 'GUEST') {
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
