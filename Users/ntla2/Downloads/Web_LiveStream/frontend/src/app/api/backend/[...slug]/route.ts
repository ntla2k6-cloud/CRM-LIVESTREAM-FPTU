import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit, parseBody } from '@/lib/audit';

// Render gói Free ngủ khi không dùng, lần gọi đầu mất ~50s để dậy → cho hàm proxy chạy tới 60s
// (mặc định Vercel cắt ~10s, trang nhận lỗi và hiện số 0).
export const maxDuration = 60;

const BACKEND = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://crm-livestream-fptu.onrender.com';

// Generic proxy: forward request to NestJS backend
async function proxy(req: NextRequest, path: string) {
  const url = `${BACKEND}${path}`;
  const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined;
  
  // Extract user role from session to pass to backend
  let userRole = 'GUEST';
  // Người thao tác (ghi lịch sử, vd Kho thiết bị) — backend chỉ tin khi x-internal-key đúng
  let userId = '';
  let userName = '';
  try {
    const sessionToken = req.cookies.get('next-auth.session-token')?.value || req.cookies.get('__Secure-next-auth.session-token')?.value;
    if (sessionToken) {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true }
      });
      if (session && session.user && session.expires > new Date()) {
        userRole = session.user.role;
        userId = session.user.id;
        userName = session.user.name || session.user.username || session.user.email || '';
      }
    }
  } catch (e) {
    console.error('Error fetching role for proxy:', e);
  }

  try {
    const backendRes = await fetch(url, {
      method: req.method,
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': userRole,
        ...(userId ? { 'x-user-id': userId, 'x-user-name': encodeURIComponent(userName) } : {}),
        // Khóa bí mật chung với backend (env INTERNAL_API_KEY trên Vercel + Render) — backend chỉ tin x-user-role khi khóa đúng
        ...(process.env.INTERNAL_API_KEY ? { 'x-internal-key': process.env.INTERNAL_API_KEY } : {}),
      },
      body,
    });
    
    const data = backendRes.status === 204 ? null : await backendRes.json().catch(() => null);
    // Nhật ký: mọi thao tác thay đổi dữ liệu (không ghi GET để khỏi ngập log)
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      await logAudit(req, userId ? { id: userId, name: userName, role: userRole } : null, {
        action: req.method, path, status: backendRes.status, detail: parseBody(body),
      });
    }
    return NextResponse.json(data, { status: backendRes.status });
  } catch (e: any) {
    console.error('[proxy] error:', url, e.message);
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      await logAudit(req, userId ? { id: userId, name: userName, role: userRole } : null, { action: req.method, path, status: 503, detail: parseBody(body) });
    }
    return NextResponse.json({ error: 'Backend unreachable', detail: e.message }, { status: 503 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
  // Giữ cả query string (?sessionId=…)
  const path = '/' + params.slug.join('/') + req.nextUrl.search;
  return proxy(req, path);
}

export async function POST(req: NextRequest, { params }: { params: { slug: string[] } }) {
  // Giữ cả query string (?sessionId=…)
  const path = '/' + params.slug.join('/') + req.nextUrl.search;
  return proxy(req, path);
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string[] } }) {
  // Giữ cả query string (?sessionId=…)
  const path = '/' + params.slug.join('/') + req.nextUrl.search;
  return proxy(req, path);
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string[] } }) {
  // Giữ cả query string (?sessionId=…)
  const path = '/' + params.slug.join('/') + req.nextUrl.search;
  return proxy(req, path);
}
