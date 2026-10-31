import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import nodemailer from 'nodemailer';

// Backend (Render Free chặn cổng SMTP) nhờ Vercel gửi mail: POST kèm x-internal-key = INTERNAL_API_KEY.
// SMTP_* (Gmail + mật khẩu ứng dụng) đặt trên Vercel.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const key = process.env.INTERNAL_API_KEY;
  if (!key || !safeEqual(req.headers.get('x-internal-key') || '', key)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return NextResponse.json({ message: 'Chưa cấu hình email trên Vercel (SMTP_HOST, SMTP_USER, SMTP_PASS)' }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const to = String(body?.to ?? '').trim();
  if (!EMAIL_RE.test(to) || !body?.subject || !body?.html) {
    return NextResponse.json({ message: 'Thiếu to/subject/html hoặc email không hợp lệ' }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
  });

  try {
    const fromName = process.env.SMTP_FROM_NAME || 'Uống Gì Chưa';
    const fromEmail = process.env.SMTP_FROM_EMAIL || SMTP_USER;
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: String(body.subject),
      html: String(body.html),
    });
    return NextResponse.json({ ok: true, messageId: info.messageId });
  } catch (err: any) {
    return NextResponse.json({ message: `Gửi mail lỗi: ${err?.message || err}` }, { status: 502 });
  }
}
