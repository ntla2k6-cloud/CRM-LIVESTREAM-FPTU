import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EventsGateway } from '../websocket/events.gateway.js';

const QUIZ_GRACE_SECONDS = 2;
const MAX_CLIENT_LAG_MS = 30_000;

// Giờ extension lệch quá xa giờ server (máy sai giờ / lô gửi trễ) → dùng giờ server
export function answerTime(seenAt: Date | number | undefined, serverTimestamp?: Date, now = Date.now()) {
  const server = serverTimestamp ? new Date(serverTimestamp).getTime() : now;
  const client = seenAt === undefined ? NaN : new Date(seenAt).getTime();
  if (!Number.isFinite(client) || client > server + 1000 || server - client > MAX_CLIENT_LAG_MS) return server;
  return client;
}

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /** seenAt = lúc extension thấy comment trên khung chat (xếp hạng tốc độ chính xác hơn giờ server nhận lô). */
  async processQuizAnswer(liveSessionId: string, comment: any, seenAt?: Date | number) {
    try {
      const activeQuestion = await this.prisma.question.findFirst({
        where: {
          liveSessionId,
          status: 'ACTIVE',
        }
      });

      if (!activeQuestion) return;

      // Hết giờ (kèm 2s trễ mạng) → không chấm, kể cả khi MC chưa bấm Kết thúc
      const commentAt = answerTime(seenAt, comment.serverTimestamp);
      const startedAt = activeQuestion.startedAt?.getTime() ?? commentAt;
      if (commentAt - startedAt > (activeQuestion.timeLimit + QUIZ_GRACE_SECONDS) * 1000) return;

      const existingAnswer = await this.prisma.answer.findFirst({
        where: {
          questionId: activeQuestion.id,
          customerId: comment.customerId,
        }
      });

      if (existingAnswer) return;

      const normalizedComment = comment.content.toLowerCase().replace(/[^a-d0-9]/g, '');
      const parsedAnswer = normalizedComment.slice(-1).toUpperCase(); 

      if (!['A', 'B', 'C', 'D'].includes(parsedAnswer)) return;

      const isCorrect = parsedAnswer === activeQuestion.correctAnswer.toUpperCase();
      const responseSpeed = Math.max(0, commentAt - startedAt);
      
      const answerStatus = isCorrect ? 'CORRECT' : 'INCORRECT';

      const answer = await this.prisma.answer.create({
        data: {
          questionId: activeQuestion.id,
          customerId: comment.customerId,
          commentId: comment.id,
          userAnswer: parsedAnswer,
          status: answerStatus,
          responseSpeed,
          isWinner: false, 
        },
        include: {
          customer: true
        }
      });

      this.eventsGateway.server.to(liveSessionId).emit('quiz:answer', {
        username: comment.displayName || comment.username,
        questionCode: activeQuestion.code,
        answer: parsedAnswer,
        isCorrect,
        responseSpeed,
      });

    } catch (e) {
      this.logger.error('Lỗi khi chấm điểm Quiz', e);
    }
  }
}
