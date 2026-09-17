import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.campaign.findFirst();
  await prisma.liveSession.deleteMany({});
  const s1 = await prisma.liveSession.create({ data: { campaignId: c.id, title: 'Uống Gì CHƯA Tập 1', status: 'COMPLETED', startTime: new Date('2026-09-10T19:00:00Z'), endTime: new Date('2026-09-10T21:00:00Z') } });
  const s2 = await prisma.liveSession.create({ data: { campaignId: c.id, title: 'Hành Trang IT', status: 'COMPLETED', startTime: new Date('2026-09-12T19:00:00Z'), endTime: new Date('2026-09-12T21:00:00Z') } });
  const s3 = await prisma.liveSession.create({ data: { campaignId: c.id, title: 'Tư vấn Xét tuyển K19', status: 'SCHEDULED', startTime: new Date('2026-09-20T20:00:00Z') } });
  console.log('Seeded Live Sessions properly encoded.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
