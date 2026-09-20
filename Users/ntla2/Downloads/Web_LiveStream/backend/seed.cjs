const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.gift.createMany({
    data: [
      { name: 'Balo FPT University', sku: 'Q-BALO-01', stock: 45, sent: 320, price: '350,000đ', status: 'Sẵn sàng' },
      { name: 'Áo thun Cam FPT', sku: 'Q-AOT-03', stock: 210, sent: 1200, price: '150,000đ', status: 'Sẵn sàng' },
    ]
  });

  const gift1 = await prisma.gift.findFirst({ where: { sku: 'Q-BALO-01' } });
  const gift2 = await prisma.gift.findFirst({ where: { sku: 'Q-AOT-03' } });

  await prisma.order.createMany({
    data: [
      { id: 'DON-001', recipient: 'Thành Đô', phone: '090xxxx123', address: 'Quận 1, TP.HCM', giftId: gift1.id, status: 'Đã xử lý', date: '10/09/2026 10:15' },
      { id: 'DON-002', recipient: 'Khánh Vũ', phone: '091xxxx789', address: 'Đồng Nai', giftId: gift2.id, status: 'Đang vận chuyển', date: '10/09/2026 10:20', shippingProvider: 'GHTK', trackingCode: 'GHTK-001', trackingLink: 'https://ghtk.vn' },
      { id: 'DON-003', recipient: 'Hoài Anh', phone: '098xxxx456', address: 'Hà Nội', giftId: gift1.id, status: 'Đã giao', date: '12/09/2026 19:10', shippingProvider: 'Viettel Post', trackingCode: 'VT-999', trackingLink: 'https://viettelpost.vn' },
    ]
  });
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
