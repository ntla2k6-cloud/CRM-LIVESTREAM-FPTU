import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// API route của Next (/api/*) không qua middleware → tự kiểm tra phiên next-auth trong DB.
export async function getSessionUser(req: NextRequest) {
  const token = req.cookies.get('__Secure-next-auth.session-token')?.value || req.cookies.get('next-auth.session-token')?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { sessionToken: token }, include: { user: true } });
  if (!session?.user || session.expires <= new Date()) return null;
  return session.user;
}

export const isStaff = (role?: string | null) => !!role && role !== 'GUEST';
export const isManager = (role?: string | null) => role === 'ADMIN' || role === 'MANAGER';
