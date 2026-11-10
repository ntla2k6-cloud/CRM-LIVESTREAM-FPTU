import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

// Đăng nhập bằng tài khoản + mật khẩu (ngoài Google). Tạo phiên next-auth trong DB y như đăng nhập Google,
// nên proxy /api/backend, middleware, getSessionUser, useSession, signOut đều dùng chung.
const SESSION_DAYS = 30;
const MAX_FAILS = 5;
const LOCK_MS = 10 * 60 * 1000;
const fails = new Map<string, { count: number; until: number }>(); // chống dò mật khẩu (theo từng instance)

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = String(body?.username ?? '').trim().toLowerCase();
  const password = String(body?.password ?? '');
  if (!username || !password) return NextResponse.json({ error: 'Nhập tài khoản và mật khẩu' }, { status: 400 });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const key = `${username}|${ip}`;
  const f = fails.get(key);
  if (f && f.count >= MAX_FAILS && f.until > Date.now()) {
    return NextResponse.json({ error: 'Sai quá nhiều lần, thử lại sau 10 phút' }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  const ok = await verifyPassword(password, user?.passwordHash);
  if (!user || !ok) {
    fails.set(key, { count: (f && f.until > Date.now() ? f.count : 0) + 1, until: Date.now() + LOCK_MS });
    return NextResponse.json({ error: 'Sai tài khoản hoặc mật khẩu' }, { status: 401 });
  }
  if (user.status === 'LOCKED') return NextResponse.json({ error: 'Tài khoản đã bị khóa' }, { status: 403 });
  fails.delete(key);

  const sessionToken = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400 * 1000);
  await prisma.session.create({ data: { sessionToken, userId: user.id, expires } });

  // Cùng tên cookie next-auth dùng (https → tiền tố __Secure-)
  const secure = (process.env.NEXTAUTH_URL || req.nextUrl.origin).startsWith('https://');
  const res = NextResponse.json({ ok: true });
  res.cookies.set(secure ? '__Secure-next-auth.session-token' : 'next-auth.session-token', sessionToken, {
    httpOnly: true, secure, sameSite: 'lax', path: '/', expires,
  });
  return res;
}
