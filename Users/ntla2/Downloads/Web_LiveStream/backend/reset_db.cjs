const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up data...');
  await prisma.answer.deleteMany();
  await prisma.winner.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.leadHistory.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.liveComment.deleteMany();
  await prisma.question.deleteMany();
  await prisma.liveSessionAssignment.deleteMany();
  await prisma.script.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.liveSession.deleteMany();
  await prisma.gift.deleteMany();
  await prisma.task.deleteMany();

  console.log('Seeding 1 test record for each category...');

  const session = await prisma.liveSession.create({ data: { id: 'LIVE-TEST', title: 'Livestream Demo Test', description: '\u0110\u00e2y l\u00e0 phi\u00ean live m\u1eabu', status: 'SCHEDULED' } });
  const customer = await prisma.customer.create({ data: { fullName: 'Kh\u00e1ch H\u00e0ng M\u1eabu', phone: '0901234567', tiktokAccount: 'tiktok_test_01' } });
  const lead = await prisma.lead.create({ data: { customerId: customer.id, liveSessionId: session.id, status: 'NEW', source: 'LIVESTREAM', leadScore: 100, intent: 'HOT' } });
  const gift = await prisma.gift.create({ data: { name: 'Qu\u00e0 Test 2026', sku: 'GIFT-TEST-01', stock: 100, price: '100,000\u0111', status: 'S\u1eb5n s\u00e0ng' } });
  const shipment = await prisma.shipment.create({ data: { id: 'DON-TEST999', recipientName: 'Kh\u00e1ch H\u00e0ng M\u1eabu', phone: '0901234567', address: 'FPT University HCM', status: '\u0110ang v\u1eadn chuy\u1ec3n', giftName: gift.name, shippingProvider: 'GHTK', trackingCode: 'GHTK-TEST-999' } });
  const task = await prisma.task.create({ data: { title: 'C\u00f4ng vi\u1ec7c m\u1eabu', description: '\u0110\u00e2y l\u00e0 task m\u1eabu', status: 'TODO' } });

  console.log('Done! Customer:', customer.fullName, 'Gift:', gift.name, gift.price, gift.status, 'Shipment:', shipment.recipientName, shipment.status);
}

main().catch(console.error).finally(() => prisma.());