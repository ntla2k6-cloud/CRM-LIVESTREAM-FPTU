import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.staff.create({
    data: { name: 'Trần Anh Tuấn', role: 'MC / Host', phone: '0981112233', email: 'tuanta@fpt.edu.vn', rate: 500000 }
  });
  await prisma.liveSession.create({
    data: {
      title: 'Tư vấn Học bổng',
      status: 'LIVE_NOW',
      campaign: { create: { id: 'c1', name: 'Campaign 1' } }
    }
  });
  console.log('Seeded!');
}
main();
