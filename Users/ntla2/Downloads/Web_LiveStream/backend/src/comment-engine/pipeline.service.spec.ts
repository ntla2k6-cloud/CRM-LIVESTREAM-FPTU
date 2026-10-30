import { PipelineService } from './pipeline.service.js';

// Giả lập bảng LiveComment trong bộ nhớ, đủ cho processGift
function makePipeline() {
  const rows: any[] = [];
  const prisma: any = {
    customer: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'cus1' }),
    },
    liveComment: {
      findFirst: vi.fn(async ({ where }) => {
        const giftName = JSON.parse(where.rawPayload.contains.split(':').slice(1).join(':'));
        return [...rows].reverse().find((r) => r.category === 'GIFT' && r.username === where.username && JSON.parse(r.rawPayload).giftName === giftName) || null;
      }),
      create: vi.fn(async ({ data }) => {
        const row = { id: `r${rows.length}`, serverTimestamp: new Date(), ...data };
        rows.push(row);
        return row;
      }),
      update: vi.fn(async ({ where, data }) => Object.assign(rows.find((r) => r.id === where.id), data)),
    },
  };
  const emit = vi.fn();
  const gateway: any = { server: { to: () => ({ emit }) } };
  return { pipeline: new PipelineService(prisma, {} as any, {} as any, gateway), rows, emit };
}

const gift = (username: string, giftName: string, giftCount: number) => ({
  platform: 'extension', platformCommentId: `${username}-${giftName}-${giftCount}`, username, content: '', timestamp: new Date(), giftName, giftCount,
});

describe('PipelineService.processGift', () => {
  it('gộp combo x1 → x2 → x5 thành 1 bản ghi x5', async () => {
    const { pipeline, rows } = makePipeline();
    for (const n of [1, 2, 5]) await pipeline.processGift('s1', gift('minh', 'Hoa hồng', n));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ category: 'GIFT', content: '🎁 Hoa hồng x5' });
    expect(JSON.parse(rows[0].rawPayload)).toEqual({ giftName: 'Hoa hồng', giftCount: 5 });
  });

  it('bản cập nhật cũ hơn (số nhỏ hơn) bị bỏ qua', async () => {
    const { pipeline, rows } = makePipeline();
    await pipeline.processGift('s1', gift('minh', 'Hoa hồng', 3));
    await pipeline.processGift('s1', gift('minh', 'Hoa hồng', 2));
    expect(rows).toHaveLength(1);
    expect(rows[0].content).toBe('🎁 Hoa hồng x3');
  });

  it('quà khác loại / người khác là bản ghi riêng', async () => {
    const { pipeline, rows } = makePipeline();
    await pipeline.processGift('s1', gift('minh', 'Hoa hồng', 1));
    await pipeline.processGift('s1', gift('minh', 'Kem', 1));
    await pipeline.processGift('s1', gift('lan', 'Hoa hồng', 1));
    expect(rows.map((r) => `${r.username}:${r.content}`)).toEqual(['minh:🎁 Hoa hồng x1', 'minh:🎁 Kem x1', 'lan:🎁 Hoa hồng x1']);
  });
});
