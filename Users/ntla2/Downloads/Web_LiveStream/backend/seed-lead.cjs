const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const customer = await prisma.customer.create({
    data: { fullName: 'Thành Đô', phone: '090xxxx123', tiktokAccount: '@thanhdo.2k6', highSchool: 'THPT Chuyên Lê Hồng Phong', classGrade: 'Lớp 12', location: 'TP. Hồ Chí Minh' }
  });
  const campaign = await prisma.campaign.create({
    data: { name: 'Uống Gì CHƯA', status: 'ACTIVE' }
  });
  await prisma.lead.create({
    data: {
      customerId: customer.id,
      campaignId: campaign.id,
      status: 'NEW',
      leadScore: 95,
      intent: 'Ngành Kỹ thuật phần mềm',
      note: 'Quan tâm AI, AI-IoT',
      history: [{ text: "Trường mình có xét tuyển học bạ không ạ?", time: "10:05", type: "Hỏi Tuyển sinh" }]
    }
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
