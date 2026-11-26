import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "select_account"
        }
      }
    }),
  ],
  pages: {
    signIn: '/login',
  },
  events: {
    // Nhật ký: đăng nhập Google + mọi lần đăng xuất (cả tài khoản mật khẩu, vì cùng phiên next-auth)
    async signIn({ user, isNewUser }) {
      const u = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } }).catch(() => null);
      await logAudit(null, { id: user.id, name: user.name || user.email, role: u?.role }, { action: 'LOGIN', path: '/login', status: 200, detail: { method: 'google', email: user.email, isNewUser: !!isNewUser } });
    },
    async signOut(message: any) {
      const userId = message?.session?.userId;
      const u = userId ? await prisma.user.findUnique({ where: { id: userId }, select: { name: true, username: true, email: true, role: true } }).catch(() => null) : null;
      await logAudit(null, { id: userId, name: u?.name || u?.username || u?.email, role: u?.role }, { action: 'LOGOUT', path: '/logout', status: 200 });
    },
    async createUser({ user }) {
      try {
        const isAdmin = user.email === 'ntla2k6@gmail.com';
        const finalRole = isAdmin ? 'ADMIN' : 'GUEST';
        
        if (isAdmin) {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: 'ADMIN', status: 'ACTIVE' }
          });
        }
        
        // Luôn tạo Staff tương ứng
        await prisma.staff.create({
          data: {
            name: user.name || 'User Mới',
            email: user.email,
            role: finalRole,
            status: isAdmin ? 'Sẵn sàng' : 'PENDING',
            avatar: user.image,
            rate: 150000,
            color: 'bg-slate-500'
          }
        });
      } catch (e) {
        console.error("Error creating staff for new user", e);
      }
    }
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        (session.user as any).role = (user as any).role || "GUEST";
        (session.user as any).id = user.id;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
