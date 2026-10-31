import { QuizService, answerTime } from './quiz.service.js';
import { QuestionService } from '../minigame/question.service.js';

function makeQuiz(question: any) {
  const answers: any[] = [];
  const prisma: any = {
    question: { findFirst: vi.fn(async () => question) },
    answer: {
      findFirst: vi.fn(async ({ where }) => answers.find((a) => a.customerId === where.customerId) || null),
      create: vi.fn(async ({ data }) => { answers.push(data); return data; }),
    },
  };
  const emit = vi.fn();
  const gateway: any = { server: { to: () => ({ emit }) } };
  return { quiz: new QuizService(prisma, gateway), answers, emit };
}

const comment = (customerId: string, content: string, serverTimestamp: Date) => ({ id: `c-${customerId}`, customerId, username: customerId, content, serverTimestamp });

describe('QuizService.processQuizAnswer', () => {
  const startedAt = new Date('2026-10-31T10:00:00Z');
  const question = { id: 'q1', code: 'Q1', correctAnswer: 'B', timeLimit: 30, startedAt };
  const at = (s: number) => new Date(startedAt.getTime() + s * 1000);

  it('chấm đúng/sai, tốc độ theo giờ extension thấy comment, mỗi người 1 lần', async () => {
    const { quiz, answers, emit } = makeQuiz(question);
    await quiz.processQuizAnswer('s1', comment('an', '1.B', at(5)), at(3.25));
    await quiz.processQuizAnswer('s1', comment('binh', 'a', at(6)), at(4));
    await quiz.processQuizAnswer('s1', comment('an', 'C', at(7)), at(6));

    expect(answers).toHaveLength(2);
    expect(answers[0]).toMatchObject({ customerId: 'an', userAnswer: 'B', status: 'CORRECT', responseSpeed: 3250 });
    expect(answers[1]).toMatchObject({ customerId: 'binh', userAnswer: 'A', status: 'INCORRECT' });
    expect(emit).toHaveBeenCalledWith('quiz:answer', expect.objectContaining({ isCorrect: true, responseSpeed: 3250 }));
  });

  it('hết giờ (quá timeLimit + 2s) thì không chấm', async () => {
    const { quiz, answers } = makeQuiz(question);
    await quiz.processQuizAnswer('s1', comment('an', 'B', at(33)), at(33));
    expect(answers).toHaveLength(0);
  });

  it('không có câu ACTIVE thì bỏ qua', async () => {
    const { quiz, answers } = makeQuiz(null);
    await quiz.processQuizAnswer('s1', comment('an', 'B', at(1)), at(1));
    expect(answers).toHaveLength(0);
  });
});

describe('answerTime', () => {
  const server = new Date('2026-10-31T10:00:10Z');
  it('dùng giờ extension khi hợp lý, giờ server khi lệch quá xa', () => {
    expect(answerTime(server.getTime() - 2000, server)).toBe(server.getTime() - 2000);
    expect(answerTime(server.getTime() + 5000, server)).toBe(server.getTime());
    expect(answerTime(server.getTime() - 60_000, server)).toBe(server.getTime());
    expect(answerTime(undefined, server)).toBe(server.getTime());
  });
});

describe('QuestionService.start', () => {
  it('đóng câu đang chạy khác, mở câu mới và báo đúng phòng của phiên', async () => {
    const q = { id: 'q2', liveSessionId: 's1', code: 'Q2', timeLimit: 20, status: 'PENDING' };
    const prisma: any = {
      question: {
        findUnique: vi.fn(async () => q),
        updateMany: vi.fn((args) => ({ op: 'closeOthers', args })),
        update: vi.fn((args) => ({ op: 'start', args })),
      },
      $transaction: vi.fn(async (ops: any[]) => [{ count: 1 }, { ...q, status: 'ACTIVE' }]),
    };
    const emit = vi.fn();
    const to = vi.fn(() => ({ emit }));
    const service = new QuestionService(prisma, { server: { to } } as any);

    const res = await service.start('q2');

    expect(prisma.question.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { liveSessionId: 's1', status: 'ACTIVE', id: { not: 'q2' } },
    }));
    expect(prisma.question.update.mock.calls[0][0].data).toMatchObject({ status: 'ACTIVE', closedAt: null });
    expect(res.status).toBe('ACTIVE');
    expect(to).toHaveBeenCalledWith('s1');
    expect(emit).toHaveBeenCalledWith('gameStarted', expect.objectContaining({ questionId: 'q2', timeLimit: 20 }));
  });

  it('từ chối đáp án ngoài A–D', async () => {
    const service = new QuestionService({ question: { count: vi.fn(async () => 0) } } as any, {} as any);
    await expect(service.create({ liveSessionId: 's1', correctAnswer: 'E' })).rejects.toThrow('A, B, C hoặc D');
  });
});
