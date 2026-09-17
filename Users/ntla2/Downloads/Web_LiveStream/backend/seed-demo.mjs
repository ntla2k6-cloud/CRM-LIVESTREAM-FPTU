import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old live data...');
  await prisma.followUp.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.liveSession.deleteMany({});
  await prisma.campaign.deleteMany({});
  
  console.log('Seeding Demo Campaign...');
  const campaign = await prisma.campaign.create({
    data: {
      name: "Chiến dịch Demo Tuyển Sinh",
      status: "ACTIVE"
    }
  });

  console.log('Seeding Demo Live Session...');
  const session = await prisma.liveSession.create({
    data: {
      title: "🔥 DEMO LIVE FPTU HCM - Tuyển sinh 2026",
      status: "ONGOING",
      startTime: new Date(),
      campaignId: campaign.id,
      questions: {
        create: [
          {
            code: "Q1",
            content: "Cơ sở vật chất của FPTU HCM có gì đặc biệt?",
            correctAnswer: "Thư viện 3 tầng, sân bóng tiêu chuẩn FIFA, hồ sen",
            status: "PENDING"
          },
          {
            code: "Q2",
            content: "Năm 2026, FPTU mở thêm ngành gì mới?",
            correctAnswer: "Trí tuệ nhân tạo (AI) và Bán dẫn",
            status: "PENDING"
          },
          {
            code: "Q3",
            content: "Mã trường của Đại học FPT là gì?",
            correctAnswer: "FPT",
            status: "PENDING"
          }
        ]
      }
    }
  });

  console.log('Seeding Demo Customers & Leads...');
  const customer1 = await prisma.customer.create({
    data: {
      fullName: "Nguyễn Văn Demo",
      phone: "0901234567",
      tiktokAccount: "@demo1"
    }
  });
  
  const customer2 = await prisma.customer.create({
    data: {
      fullName: "Trần Thị Test",
      phone: "0987654321",
      tiktokAccount: "@test2"
    }
  });

  await prisma.lead.createMany({
    data: [
      {
        customerId: customer1.id,
        campaignId: campaign.id,
        status: "NEW",
        liveSessionId: session.id,
        intent: "HOT"
      },
      {
        customerId: customer2.id,
        campaignId: campaign.id,
        status: "CONTACTED",
        liveSessionId: session.id,
        intent: "WARM"
      }
    ]
  });

  console.log('Successfully seeded DEMO data!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
