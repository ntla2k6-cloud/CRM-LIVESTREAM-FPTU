import type { PrismaService } from '../prisma/prisma.service.js';

// Phiên LIVE không tự kết thúc khi tắt extension/TikTok → coi là đã kết thúc nếu
// không có comment mới trong 30 phút; giờ kết thúc = comment cuối (hoặc lúc bắt đầu).
export const STALE_MINUTES = 30;

export function staleEndTime(startedAt: Date, lastCommentAt: Date | null, now = new Date()): Date | null {
  const last = lastCommentAt && lastCommentAt > startedAt ? lastCommentAt : startedAt;
  return now.getTime() - last.getTime() > STALE_MINUTES * 60_000 ? last : null;
}

export async function closeStaleSessions(prisma: PrismaService, now = new Date()) {
  const live = await prisma.liveSession.findMany({
    where: { status: 'LIVE_NOW' },
    select: { id: true, startTime: true, createdAt: true, comments: { select: { serverTimestamp: true }, orderBy: { serverTimestamp: 'desc' }, take: 1 } },
  });
  for (const s of live) {
    const end = staleEndTime(s.startTime ?? s.createdAt, s.comments[0]?.serverTimestamp ?? null, now);
    if (end) await prisma.liveSession.update({ where: { id: s.id }, data: { status: 'COMPLETED', endTime: end } });
  }
}
