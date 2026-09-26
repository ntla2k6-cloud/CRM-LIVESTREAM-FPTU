import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MinigameGateway } from './minigame.gateway.js';

@Injectable()
export class MinigameService {
  constructor(
    private prisma: PrismaService,
    private gateway: MinigameGateway
  ) {}

  // Giả lập Webhook nhận comment từ TikTok
  async processIncomingComment(data: { liveSessionId: string; username: string; content: string; tiktokUserId: string }) {
    
    // 1. Lưu Comment thô vào DB
    const comment = await this.prisma.liveComment.create({
      data: {
        liveSessionId: data.liveSessionId,
        username: data.username,
        content: data.content,
        tiktokUserId: data.tiktokUserId,
      }
    });

    // 2. Kiểm tra xem có câu hỏi nào đang ACTIVE không
    const activeQuestion = await this.prisma.question.findFirst({
      where: {
        liveSessionId: data.liveSessionId,
        status: 'ACTIVE'
      }
    });

    let isCorrect = false;

    if (activeQuestion) {
      // 3. Regex check đáp án (giống như ta đã làm ở UI)
      const answerRegex = new RegExp(activeQuestion.correctAnswer, 'i');
      isCorrect = answerRegex.test(data.content);

      if (isCorrect) {
        // Nếu đúng, lưu vào bảng Answer
        const speedMs = Date.now() - (activeQuestion.startedAt?.getTime() || Date.now());
        
        // Cần đảm bảo Customer tồn tại
        let customer = await this.prisma.customer.findUnique({ where: { tiktokAccount: data.username }});
        if (!customer) {
          customer = await this.prisma.customer.create({
            data: {
              tiktokAccount: data.username,
              fullName: data.username,
            }
          });
        }

        await this.prisma.answer.create({
          data: {
            questionId: activeQuestion.id,
            customerId: customer.id,
            commentId: comment.id,
            userAnswer: data.content,
            status: 'CORRECT',
            responseSpeed: speedMs
          }
        });

        // 4. Lấy Top Leaderboard
        const topAnswers = await this.prisma.answer.findMany({
          where: { questionId: activeQuestion.id, status: 'CORRECT' },
          orderBy: { responseSpeed: 'asc' },
          take: 10,
          include: { customer: true }
        });

        // Transform cho Frontend
        const leaderboard = topAnswers.map((ans: any, idx: number) => ({
          rank: idx + 1,
          name: ans.customer.tiktokAccount,
          answer: ans.userAnswer,
          speed: `${(ans.responseSpeed / 1000).toFixed(1)}s`,
          valid: true,
          avatar: ans.customer.tiktokAccount?.charAt(1).toUpperCase() || 'U'
        }));

        // Bắn Leaderboard mới nhất qua Socket
        this.gateway.broadcastLeaderboardUpdate(leaderboard);
      }
    }

    // Bắn luồng comment thô qua Socket (kèm theo trạng thái đúng/sai nếu có game)
    this.gateway.broadcastNewComment({
      id: comment.id,
      name: data.username,
      text: data.content,
      time: "Vừa xong",
      isCorrect
    });
  }
}
