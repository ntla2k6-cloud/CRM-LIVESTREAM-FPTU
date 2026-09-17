import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing DB...');
  await prisma.answer.deleteMany({});
  await prisma.followUp.deleteMany({});
  await prisma.liveComment.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.liveSession.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.shiftAssignment.deleteMany({});
  await prisma.shift.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Cleared.');

  const users = [
    { name: 'Lan Anh', email: 'lananh@fpt.edu.vn', role: 'ADMIN' },
    { name: 'B?nh', email: 'binh@fpt.edu.vn', role: 'PRODUCER' },
    { name: 'D?ng', email: 'dung@fpt.edu.vn', role: 'PRODUCER' },
    { name: 'Thý', email: 'thu@fpt.edu.vn', role: 'BIÊN T?P' },
    { name: 'Trinh', email: 'trinh@fpt.edu.vn', role: 'BIÊN T?P' },
    { name: 'Uyên', email: 'uyen@fpt.edu.vn', role: 'BIÊN T?P' },
    { name: 'Vy', email: 'vy@fpt.edu.vn', role: 'BIÊN T?P' },
    { name: 'B?o Duy', email: 'duy@fpt.edu.vn', role: 'VJ' },
    { name: 'Minh Khôi', email: 'khoi@fpt.edu.vn', role: 'VJ' },
    { name: 'Thành Ð?t', email: 'dat@fpt.edu.vn', role: 'VJ' },
    { name: 'Kim Phát', email: 'phat@fpt.edu.vn', role: 'VJ' },
    { name: 'B?o My', email: 'my@fpt.edu.vn', role: 'CSKH' },
    { name: 'Quang Lâm', email: 'lam@fpt.edu.vn', role: 'CSKH' },
    { name: 'Ví d? 1', email: 'vidu1@fpt.edu.vn', role: 'CSKH' },
    { name: 'Ví d? 2', email: 'vidu2@fpt.edu.vn', role: 'CSKH' },
  ];

  for (const u of users) {
    await prisma.user.create({ data: { name: u.name, email: u.email, role: u.role, status: 'Ho?t ð?ng' } });
    await prisma.staff.create({ data: { name: u.name, email: u.email, role: u.role, status: 'S?n sàng' } });
  }

  const c = await prisma.campaign.create({ data: { name: 'Chi?n d?ch Tháng 9' } });

  const s1 = await prisma.liveSession.create({ data: { campaignId: c.id, title: 'U?ng G? CHÝA T?p 1', status: 'COMPLETED', startTime: new Date('2026-09-10T19:00:00Z'), endTime: new Date('2026-09-10T21:00:00Z') } });
  const s2 = await prisma.liveSession.create({ data: { campaignId: c.id, title: 'Hành Trang IT', status: 'COMPLETED', startTime: new Date('2026-09-12T19:00:00Z'), endTime: new Date('2026-09-12T21:00:00Z') } });
  const s3 = await prisma.liveSession.create({ data: { campaignId: c.id, title: 'Tý v?n Xét tuy?n K19', status: 'SCHEDULED', startTime: new Date('2026-09-20T20:00:00Z') } });

  console.log('Seeded DB');
}

main().catch(console.error).finally(() => prisma.$disconnect());
