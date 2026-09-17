import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1. Xóa các phiên rác
  const del = await prisma.liveSession.deleteMany({ 
    where: { title: { contains: 'LIVE m' } } 
  });
  console.log('Deleted junk sessions:', del.count);

  // 2. Fix status ONGOING → LIVE_NOW (để UI nhận đúng)
  const upd1 = await prisma.liveSession.updateMany({ 
    where: { status: 'ONGOING' }, 
    data: { status: 'LIVE_NOW' } 
  });
  console.log('Fixed ONGOING -> LIVE_NOW:', upd1.count);

  // 3. Fix tiêu đề phiên lịch sử bị encoding lỗi
  await prisma.liveSession.updateMany({ 
    where: { id: '6f9a0f4a-0534-4755-89e1-5334991b93f9' }, 
    data: { title: 'Lich su: Chao tan sinh vien K20 - Minigame lon' } 
  });
  await prisma.liveSession.updateMany({ 
    where: { id: '02276ce7-5128-48ea-a135-b28abf5d1ea2' }, 
    data: { title: 'Lich su: Livestream Tu van Chon Nganh Dot 1' } 
  });
  await prisma.liveSession.updateMany({ 
    where: { id: '0c6a5df6-1c80-4fe9-ad07-d74973df325e' }, 
    data: { title: 'DEMO LIVE FPTU HCM - Tuyen sinh 2026' } 
  });

  // 4. Hiển thị kết quả
  const all = await prisma.liveSession.findMany({ 
    select: { id: true, title: true, status: true } 
  });
  console.log('Final sessions:', JSON.stringify(all, null, 2));
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
