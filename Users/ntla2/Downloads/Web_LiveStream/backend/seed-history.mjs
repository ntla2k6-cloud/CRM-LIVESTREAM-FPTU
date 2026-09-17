import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching Campaign for history...');
  let campaign = await prisma.campaign.findFirst({
    where: { name: "Chiến dịch Demo Tuyển Sinh" }
  });
  
  if (!campaign) {
    campaign = await prisma.campaign.create({
      data: { name: "Chiến dịch Demo Tuyển Sinh", status: "ACTIVE" }
    });
  }

  console.log('Seeding Historical Live Sessions...');
  
  // Phiên Live 1: Đã hoàn thành tuần trước
  await prisma.liveSession.create({
    data: {
      title: "🔥 Lịch sử: Livestream Tư vấn Chọn Ngành Đợt 1",
      status: "COMPLETED",
      startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      endTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // lasted 2 hours
      campaignId: campaign.id,
      questions: {
        create: [
          {
            code: "Q1_H1",
            content: "Năm 2025 FPTU có bao nhiêu phương thức xét tuyển?",
            correctAnswer: "3 phương thức",
            status: "CLOSED",
            startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000)
          }
        ]
      }
    }
  });

  // Phiên Live 2: Đã hoàn thành tháng trước
  await prisma.liveSession.create({
    data: {
      title: "🎉 Lịch sử: Chào tân sinh viên K20 - Minigame lớn",
      status: "COMPLETED",
      startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000), // lasted 1.5 hours
      campaignId: campaign.id,
      questions: {
        create: [
          {
            code: "Q1_H2",
            content: "Lễ khai giảng K20 tổ chức ngày nào?",
            correctAnswer: "15/09",
            status: "CLOSED",
            startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000)
          }
        ]
      }
    }
  });

  console.log('Successfully seeded Historical Data!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
