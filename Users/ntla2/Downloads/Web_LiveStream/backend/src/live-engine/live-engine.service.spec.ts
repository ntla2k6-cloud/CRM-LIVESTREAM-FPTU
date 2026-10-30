import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LiveEngineService } from './live-engine.service.js';

function makeService(prismaOverrides: any = {}) {
  const prisma: any = {
    liveSession: {
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'new-id', ...data })),
      update: vi.fn().mockResolvedValue({}),
      ...prismaOverrides,
    },
  };
  return { service: new LiveEngineService(prisma, {} as any, {} as any), prisma };
}

describe('LiveEngineService.resolveExtensionSession', () => {
  it('link TikTok chưa có phiên → tạo phiên LIVE_NOW cho @user', async () => {
    const { service, prisma } = makeService();
    const r = await service.resolveExtensionSession('https://www.tiktok.com/@annhientutai/live?enter_from=x');
    expect(r).toMatchObject({ id: 'new-id', created: true });
    expect(prisma.liveSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ creatorUsername: 'annhientutai', status: 'LIVE_NOW', platform: 'tiktok' }),
    });
  });

  it('link TikTok đã có phiên gần đây → dùng lại, không tạo mới', async () => {
    const { service, prisma } = makeService({
      findFirst: vi.fn().mockResolvedValue({ id: 's1', title: 'Uống Gì Chưa #3', status: 'SCHEDULED', startTime: null }),
    });
    const r = await service.resolveExtensionSession('https://www.tiktok.com/@fptu/live');
    expect(r).toEqual({ id: 's1', title: 'Uống Gì Chưa #3', created: false });
    expect(prisma.liveSession.create).not.toHaveBeenCalled();
    expect(prisma.liveSession.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: expect.objectContaining({ status: 'LIVE_NOW' }),
    });
  });

  it('link trang CRM .../live/<id> → phiên đó', async () => {
    const { service, prisma } = makeService({
      findUnique: vi.fn().mockResolvedValue({ id: 'abc-123', title: 'Phiên A' }),
    });
    const r = await service.resolveExtensionSession('https://crm-livestream-fptu.vercel.app/live/abc-123?tab=1');
    expect(prisma.liveSession.findUnique).toHaveBeenCalledWith({ where: { id: 'abc-123' } });
    expect(r).toEqual({ id: 'abc-123', title: 'Phiên A', created: false });
  });

  it('ID không tồn tại → 404 có hướng dẫn', async () => {
    const { service } = makeService();
    await expect(service.resolveExtensionSession('sai-id')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('input rỗng → 400', async () => {
    const { service } = makeService();
    await expect(service.resolveExtensionSession('  ')).rejects.toBeInstanceOf(BadRequestException);
  });
});
