import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EventsGateway } from '../websocket/events.gateway.js';

const ANSWERS = ['A', 'B', 'C', 'D'];

export type QuestionInput = {
  liveSessionId?: string;
  code?: string;
  content?: string;
  correctAnswer?: string;
  options?: Record<string, string>;
  timeLimit?: number;
};

/**
 * Câu hỏi minigame lưu DB. Chỉ câu đang ACTIVE mới được QuizService chấm từ comment,
 * nên MC bấm "Bắt đầu" phải đi qua start() (đặt ACTIVE + startedAt), "Kết thúc" → end().
 */
@Injectable()
export class QuestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  findBySession(liveSessionId: string) {
    return this.prisma.question.findMany({ where: { liveSessionId }, orderBy: { code: 'asc' } });
  }

  async create(input: QuestionInput) {
    if (!input.liveSessionId) throw new BadRequestException('Thiếu liveSessionId');
    const data = this.clean(input, true);
    const count = await this.prisma.question.count({ where: { liveSessionId: input.liveSessionId } });
    return this.prisma.question.create({
      data: {
        liveSessionId: input.liveSessionId,
        code: data.code || `Q${count + 1}`,
        content: data.content ?? '',
        correctAnswer: data.correctAnswer!,
        options: data.options,
        timeLimit: data.timeLimit ?? 30,
      },
    });
  }

  async update(id: string, input: QuestionInput) {
    const question = await this.get(id);
    if (question.status === 'ACTIVE') throw new BadRequestException('Câu hỏi đang chạy, kết thúc rồi mới sửa');
    return this.prisma.question.update({ where: { id }, data: this.clean(input, false) });
  }

  async remove(id: string) {
    const question = await this.get(id);
    if (question.status === 'ACTIVE') throw new BadRequestException('Câu hỏi đang chạy, kết thúc rồi mới xóa');
    const answers = await this.prisma.answer.count({ where: { questionId: id } });
    if (answers > 0) throw new BadRequestException('Câu hỏi đã có người trả lời, không xóa được');
    return this.prisma.question.delete({ where: { id } });
  }

  /** Mở câu hỏi: đóng câu đang chạy khác của phiên, đặt ACTIVE + startedAt, báo phòng của phiên. */
  async start(id: string) {
    const question = await this.get(id);
    const now = new Date();
    const [, started] = await this.prisma.$transaction([
      this.prisma.question.updateMany({
        where: { liveSessionId: question.liveSessionId, status: 'ACTIVE', id: { not: id } },
        data: { status: 'CLOSED', closedAt: now },
      }),
      this.prisma.question.update({
        where: { id },
        data: { status: 'ACTIVE', startedAt: now, closedAt: null },
      }),
    ]);
    this.eventsGateway.server.to(question.liveSessionId).emit('gameStarted', {
      questionId: started.id,
      questionCode: started.code,
      timeLimit: started.timeLimit,
      startedAt: now.getTime(),
    });
    return started;
  }

  async end(id: string) {
    const question = await this.get(id);
    const ended = await this.prisma.question.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: question.closedAt ?? new Date() },
    });
    this.eventsGateway.server.to(question.liveSessionId).emit('gameEnded', {
      questionId: ended.id,
      questionCode: ended.code,
    });
    return ended;
  }

  /** Người trả lời đúng, nhanh nhất trước (dựng lại bảng xếp hạng khi MC tải lại trang). */
  async leaderboard(id: string) {
    await this.get(id);
    const answers = await this.prisma.answer.findMany({
      where: { questionId: id },
      orderBy: { responseSpeed: 'asc' },
      include: { customer: { select: { tiktokAccount: true, fullName: true } } },
    });
    return {
      total: answers.length,
      correct: answers
        .filter((a) => a.status === 'CORRECT')
        .map((a) => ({ username: a.customer.fullName || a.customer.tiktokAccount, answer: a.userAnswer, responseSpeed: a.responseSpeed })),
    };
  }

  private async get(id: string) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi');
    return question;
  }

  private clean(input: QuestionInput, requireAnswer: boolean) {
    const correctAnswer = input.correctAnswer?.trim().toUpperCase();
    if ((requireAnswer || correctAnswer !== undefined) && !ANSWERS.includes(correctAnswer ?? '')) {
      throw new BadRequestException('Đáp án đúng phải là A, B, C hoặc D');
    }
    const timeLimit = input.timeLimit === undefined ? undefined : Math.round(Number(input.timeLimit));
    if (timeLimit !== undefined && !(timeLimit >= 5 && timeLimit <= 600)) {
      throw new BadRequestException('Thời gian trả lời phải từ 5 đến 600 giây');
    }
    const options = input.options
      ? Object.fromEntries(ANSWERS.map((k) => [k, String(input.options?.[k] ?? '').slice(0, 300)]))
      : undefined;
    return {
      ...(input.code !== undefined && { code: String(input.code).trim().slice(0, 20) }),
      ...(input.content !== undefined && { content: String(input.content).slice(0, 1000) }),
      ...(correctAnswer !== undefined && { correctAnswer }),
      ...(options && { options }),
      ...(timeLimit !== undefined && { timeLimit }),
    };
  }
}
