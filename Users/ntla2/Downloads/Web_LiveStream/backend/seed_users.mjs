import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany({});
  
  const staffList = [
    { name: 'Lan Anh', email: 'lananh@fpt.edu.vn', role: 'ADMIN', status: 'ACTIVE' },
    
    // Producer
    { name: 'Bình', email: 'binh@fpt.edu.vn', role: 'SAN_XUAT', status: 'ACTIVE' },
    { name: 'Dũng', email: 'dung@fpt.edu.vn', role: 'SAN_XUAT', status: 'ACTIVE' },
    
    // Biên tập
    { name: 'Thư', email: 'thu@fpt.edu.vn', role: 'BIEN_TAP', status: 'ACTIVE' },
    { name: 'Trinh', email: 'trinh@fpt.edu.vn', role: 'BIEN_TAP', status: 'ACTIVE' },
    { name: 'Uyên', email: 'uyen@fpt.edu.vn', role: 'BIEN_TAP', status: 'ACTIVE' },
    { name: 'Vy', email: 'vy@fpt.edu.vn', role: 'BIEN_TAP', status: 'ACTIVE' },
    
    // VJ
    { name: 'Bảo Duy', email: 'duy@fpt.edu.vn', role: 'VJ', status: 'ACTIVE' },
    { name: 'Minh Khôi', email: 'khoi@fpt.edu.vn', role: 'VJ', status: 'ACTIVE' },
    { name: 'Thành Đạt', email: 'dat@fpt.edu.vn', role: 'VJ', status: 'ACTIVE' },
    { name: 'Kim Phát', email: 'phat@fpt.edu.vn', role: 'VJ', status: 'ACTIVE' },
    
    // CSKH
    { name: 'Bảo My', email: 'my@fpt.edu.vn', role: 'CSKH', status: 'ACTIVE' },
    { name: 'Quang Lâm', email: 'lam@fpt.edu.vn', role: 'CSKH', status: 'ACTIVE' },
    { name: 'Ví dụ 1', email: 'vidu1@fpt.edu.vn', role: 'CSKH', status: 'ACTIVE' },
    { name: 'Ví dụ 2', email: 'vidu2@fpt.edu.vn', role: 'CSKH', status: 'ACTIVE' },
  ];

  for (const s of staffList) {
    await prisma.user.create({ data: s });
  }

  console.log('Seeded Users properly encoded.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
