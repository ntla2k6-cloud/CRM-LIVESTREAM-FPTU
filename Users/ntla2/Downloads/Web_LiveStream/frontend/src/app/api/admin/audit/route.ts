import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

const PAGE = 100;
const TYPE_ACTIONS: Record<string, string[]> = {
  login: ['LOGIN'], failed: ['LOGIN_FAILED'], logout: ['LOGOUT'],
  create: ['POST'], update: ['PATCH', 'PUT'], delete: ['DELETE'],
};

// Nhật ký hệ thống — CHỈ ADMIN. Lọc: người, loại thao tác, khoảng ngày, chữ trong đường dẫn/tên; phân trang theo cursor.
export async function GET(req: NextRequest) {
  const me = await getSessionUser(req);
  if (!me) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  if (me.role !== 'ADMIN') return NextResponse.json({ error: 'Chỉ quản trị viên được xem nhật ký' }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const where: any = {};
  const userId = sp.get('userId');
  if (userId) where.userId = userId;
  const type = sp.get('type');
  if (type && TYPE_ACTIONS[type]) where.action = { in: TYPE_ACTIONS[type] };
  if (sp.get('errors') === '1') where.status = { gte: 400 };
  const from = sp.get('from');
  const to = sp.get('to');
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from + 'T00:00:00+07:00') } : {}),
      ...(to ? { lte: new Date(to + 'T23:59:59+07:00') } : {}),
    };
  }
  const q = sp.get('q')?.trim();
  if (q) where.OR = [{ path: { contains: q, mode: 'insensitive' } }, { userName: { contains: q, mode: 'insensitive' } }, { ip: { contains: q } }];

  const cursor = sp.get('cursor');
  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: PAGE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > PAGE;
  const items = hasMore ? rows.slice(0, PAGE) : rows;
  return NextResponse.json({ items, nextCursor: hasMore ? items[items.length - 1].id : null });
}
