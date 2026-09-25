import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://crm-livestream-fptu.onrender.com';

// Generic proxy: forward request to NestJS backend
async function proxy(req: NextRequest, path: string) {
  const url = `${BACKEND}${path}`;
  const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined;
  
  try {
    const backendRes = await fetch(url, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
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
