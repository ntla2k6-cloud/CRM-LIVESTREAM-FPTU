import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BACKEND = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://crm-livestream-fptu.onrender.com';

// Generic proxy: forward request to NestJS backend
async function proxy(req: NextRequest, path: string) {
  const url = `${BACKEND}${path}`;
  const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined;
  
  // Extract user role from session to pass to backend
  let userRole = 'GUEST';
  try {
    const sessionToken = req.cookies.get('next-auth.session-token')?.value || req.cookies.get('__Secure-next-auth.session-token')?.value;
    if (sessionToken) {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true }
      });
      if (session && session.user) {
        userRole = session.user.role;
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
        'x-user-role': userRole
      },
      body,
    });
    
    const data = backendRes.status === 204 ? null : await backendRes.json().catch(() => null);
    return NextResponse.json(data, { status: backendRes.status });
  } catch (e: any) {
    console.error('[proxy] error:', url, e.message);
    return NextResponse.json({ error: 'Backend unreachable', detail: e.message }, { status: 503 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const path = '/' + params.slug.join('/');
  return proxy(req, path);
}

export async function POST(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const path = '/' + params.slug.join('/');
  return proxy(req, path);
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const path = '/' + params.slug.join('/');
  return proxy(req, path);
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const path = '/' + params.slug.join('/');
  return proxy(req, path);
}
