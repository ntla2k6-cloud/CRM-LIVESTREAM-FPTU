const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Wiping all data...');
  // Delete in reverse order of relations
  await prisma.liveComment.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.order.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.question.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.shiftAssignment.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.script.deleteMany();
  await prisma.gift.deleteMany();
  await prisma.liveSession.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.verificationToken.deleteMany();
  console.log('Data wiped successfully!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
