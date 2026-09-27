import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EventsGateway } from '../websocket/events.gateway.js';

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async processQuizAnswer(liveSessionId: string, comment: any) {
    try {
      const activeQuestion = await this.prisma.question.findFirst({
        where: {
          liveSessionId,
          status: 'ACTIVE',
        }
      });

      if (!activeQuestion) return;

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
      const responseSpeed = activeQuestion.startedAt ? Date.now() - activeQuestion.startedAt.getTime() : 0;
      
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
        username: comment.username,
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
