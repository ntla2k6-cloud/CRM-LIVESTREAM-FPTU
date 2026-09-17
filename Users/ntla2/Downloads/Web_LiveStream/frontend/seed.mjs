import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany({});
  
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
    await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        role: u.role,
        status: 'Ho?t ð?ng'
      }
    });
  }
  console.log('Seeded Users');
}

main().catch(console.error).finally(() => prisma.$disconnect());
