import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.role = (user as any).role || "GUEST";
        
        // Force ADMIN role for ntla2k6@gmail.com
        if (session.user.email === 'ntla2k6@gmail.com') {
          session.user.role = 'ADMIN';
        }
        
        session.user.id = user.id;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
