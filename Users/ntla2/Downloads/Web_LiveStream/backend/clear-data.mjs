import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.staff.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Successfully cleared all Staff and User data from Supabase.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
