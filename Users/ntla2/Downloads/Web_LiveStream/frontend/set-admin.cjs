const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'ntla2k6@gmail.com' },
    update: { role: 'ADMIN' },
    create: { email: 'ntla2k6@gmail.com', name: 'Admin', role: 'ADMIN' },
  });
  console.log('Updated user:', user.email, 'Role:', user.role);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
