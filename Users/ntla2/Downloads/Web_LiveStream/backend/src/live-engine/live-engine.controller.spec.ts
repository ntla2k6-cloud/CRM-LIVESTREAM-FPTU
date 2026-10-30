import { LiveEngineController } from './live-engine.controller.js';

describe('LiveEngineController.handleExtensionComments', () => {
  it('xử lý song song khác người, tuần tự cùng người, lỗi 1 comment không hỏng cả lô', async () => {
    const order: string[] = [];
    let running = 0;
    let maxRunning = 0;
    const pipeline = {
      processComment: vi.fn(async (_id: string, p: any) => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        await new Promise((r) => setTimeout(r, 10));
        order.push(`${p.username}:${p.content}`);
        running--;
        if (p.content === 'lỗi') throw new Error('db');
      }),
    };
    const service = { assertLiveSessionExists: vi.fn().mockResolvedValue(undefined) };
    const controller = new LiveEngineController(service as any, pipeline as any);

    const comments = [
      { username: 'a', content: '1' }, { username: 'b', content: 'x' }, { username: 'a', content: '2' },
      { username: 'c', content: 'lỗi' }, { username: 'a', content: '3' }, { username: 'd', content: '' },
    ].map((c, i) => ({ ...c, platformCommentId: `id${i}`, timestamp: Date.now() }));

    const res = await controller.handleExtensionComments({ liveSessionId: 's1', comments });

    expect(res).toEqual({ success: true, processed: 4, failed: 1 });
    expect(maxRunning).toBeGreaterThan(1);
    expect(order.filter((o) => o.startsWith('a:'))).toEqual(['a:1', 'a:2', 'a:3']);
  });
});
