import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isStaff } from '@/lib/session';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const KEY = 'rbac_roles';
const ROLE_RE = /^[A-Z_]{2,30}$/;
const PERM_RE = /^[a-z_]+\.[a-z_]+$/;

// Cấu hình quyền theo vai trò: mọi nhân sự đọc được (để menu/trang áp đúng), chỉ ADMIN sửa.
export async function GET(req: NextRequest) {
  const me = await getSessionUser(req);
  if (!isStaff(me?.role)) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const row = await prisma.appSetting.findUnique({ where: { key: KEY } });
  return NextResponse.json({ config: row?.value ?? null, updatedAt: row?.updatedAt ?? null });
}

export async function PUT(req: NextRequest) {
  const me = await getSessionUser(req);
  if (!me) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  if (me.role !== 'ADMIN') return NextResponse.json({ error: 'Chỉ Admin được sửa phân quyền' }, { status: 403 });
  const body = await req.json().catch(() => null);
  const input = body?.config;
  if (!input || typeof input !== 'object' || Array.isArray(input)) return NextResponse.json({ error: 'Cấu hình không hợp lệ' }, { status: 400 });

  // Chỉ nhận tên vai trò/quyền đúng định dạng; ADMIN/MANAGER luôn toàn quyền nên không lưu
  const config: Record<string, string[]> = {};
  for (const [role, perms] of Object.entries(input)) {
    if (!ROLE_RE.test(role) || ['ADMIN', 'MANAGER', 'GUEST'].includes(role) || !Array.isArray(perms)) continue;
    config[role] = Array.from(new Set(perms.filter((p): p is string => typeof p === 'string' && PERM_RE.test(p))));
  }
  const before = await prisma.appSetting.findUnique({ where: { key: KEY } });
  const row = await prisma.appSetting.upsert({ where: { key: KEY }, update: { value: config }, create: { key: KEY, value: config } });
  await logAudit(req, { id: me.id, name: me.name, role: me.role }, { action: 'PUT', path: '/rbac', status: 200, detail: { before: before?.value ?? null, after: config } });
  return NextResponse.json({ config: row.value, updatedAt: row.updatedAt });
}
