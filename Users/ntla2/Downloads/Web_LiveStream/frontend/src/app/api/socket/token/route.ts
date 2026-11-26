import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, isStaff } from '@/lib/session';
import { signSocketToken } from '@/lib/extensionToken';

export const dynamic = 'force-dynamic';

// Mã ngắn hạn để mở kết nối realtime (socket.io trên Render) — chỉ nhân sự đã duyệt
export async function GET(req: NextRequest) {
  const me = await getSessionUser(req);
  if (!isStaff(me?.role)) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const key = process.env.INTERNAL_API_KEY;
  return NextResponse.json({ token: key ? signSocketToken(me!.id, key) : null });
}
