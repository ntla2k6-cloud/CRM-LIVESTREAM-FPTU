import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeDetail } from '@/lib/auditSanitize';
export { parseBody } from '@/lib/auditSanitize';

// Nhật ký hệ thống: ai làm gì, lúc nào. Chỉ ADMIN xem (/audit). Ghi lỗi không được làm hỏng thao tác chính.
type Who = { id?: string | null; name?: string | null; role?: string | null } | null | undefined;

export async function logAudit(
  req: NextRequest | null,
  who: Who,
  entry: { action: string; path?: string | null; status?: number | null; detail?: unknown },
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: who?.id ?? null,
        userName: who?.name ?? null,
        role: who?.role ?? null,
        action: entry.action,
        path: entry.path ?? null,
        status: entry.status ?? null,
        ip: req?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
        userAgent: req?.headers.get('user-agent')?.slice(0, 300) || null,
        detail: entry.detail === undefined ? undefined : (sanitizeDetail(entry.detail) as any),
      },
    });
  } catch (e) {
    console.error('[audit] không ghi được log', e);
  }
}
