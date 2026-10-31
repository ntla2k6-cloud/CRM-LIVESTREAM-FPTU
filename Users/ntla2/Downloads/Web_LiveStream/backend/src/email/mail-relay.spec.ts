import { relayTransport } from './mail-relay.js';

describe('relayTransport', () => {
  it('POST tới Vercel kèm x-internal-key, không gửi trường from', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    await relayTransport('https://x/api/internal/send-mail', 'k', fetchImpl as any)
      .sendMail({ from: 'a <a@b.c>', to: 'u@x.vn', subject: 'S', html: '<b>h</b>' });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://x/api/internal/send-mail');
    expect(init.headers['x-internal-key']).toBe('k');
    expect(JSON.parse(init.body)).toEqual({ to: 'u@x.vn', subject: 'S', html: '<b>h</b>' });
  });

  it('Vercel báo lỗi → throw kèm thông báo để Thủ kho thấy', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 502, json: async () => ({ message: 'Gửi mail lỗi: Invalid login' }) });
    await expect(relayTransport('u', 'k', fetchImpl as any).sendMail({ to: 'a@b.c', subject: 's', html: 'h' }))
      .rejects.toThrow('Invalid login');
  });
});
