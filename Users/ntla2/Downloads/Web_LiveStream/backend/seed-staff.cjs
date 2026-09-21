const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Staff data...');
  
  await prisma.staff.createMany({
    data: [
      { name: 'Bình', role: 'Producer', rate: 200000, color: 'bg-purple-500' },
      { name: 'Thư', role: 'Biên tập', rate: 150000, color: 'bg-blue-500' },
      { name: 'Trinh', role: 'Biên tập', rate: 150000, color: 'bg-blue-500' },
      { name: 'Bảo Duy', role: 'VJ', rate: 300000, color: 'bg-pink-500' },
      { name: 'Thành Đạt', role: 'VJ', rate: 300000, color: 'bg-pink-500' },
      { name: 'Kim Phát', role: 'VJ', rate: 300000, color: 'bg-pink-500' },
      { name: 'Lan Anh', role: 'Admin', rate: 400000, color: 'bg-red-500' },
    ]
  });
  
  console.log('Seeded Staff successfully!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
