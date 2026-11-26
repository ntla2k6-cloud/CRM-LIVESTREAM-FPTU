import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { EXTENSION_ROLE, signExtensionToken } from '@/lib/extensionToken';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// Mã kết nối cá nhân để dán vào popup extension. Chỉ tài khoản "Quản lý Phiên Live" lấy được.
export async function POST(req: NextRequest) {
  const me = await getSessionUser(req);
  if (!me) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  if (me.role !== EXTENSION_ROLE) {
    return NextResponse.json({ error: 'Chỉ tài khoản có vai trò "Quản lý Phiên Live" được dùng extension đẩy comment' }, { status: 403 });
  }
  const key = process.env.INTERNAL_API_KEY;
  if (!key) return NextResponse.json({ error: 'Server chưa đặt INTERNAL_API_KEY' }, { status: 503 });
  await logAudit(req, { id: me.id, name: me.name, role: me.role }, { action: 'POST', path: '/extension/token', status: 200 });
  return NextResponse.json(signExtensionToken(me.id, key));
}
