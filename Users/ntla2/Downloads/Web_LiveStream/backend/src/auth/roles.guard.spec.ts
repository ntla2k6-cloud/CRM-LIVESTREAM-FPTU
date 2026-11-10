import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard.js';
import { signExtensionToken, verifyExtensionToken } from './extension-token.js';

const USERS: Record<string, string> = { live: 'LIVE_MANAGER', cskh: 'CSKH' };

function makeContext(headers: Record<string, string>, meta: Record<string, unknown> = {}) {
  const reflector = { getAllAndOverride: (key: string) => meta[key] };
  const prisma = { user: { findUnique: vi.fn(async ({ where }) => (USERS[where.id] ? { role: USERS[where.id] } : null)) } };
  const context = {
    getType: () => 'http',
    getHandler: () => null,
    getClass: () => null,
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  };
  return { guard: new RolesGuard(reflector as any, prisma as any), context: context as any };
}

describe('RolesGuard', () => {
  const env = { ...process.env };
  beforeEach(() => {
    process.env.INTERNAL_API_KEY = 'internal-secret';
    process.env.EXTENSION_TOKEN = 'ext-secret';
  });
  afterEach(() => { process.env = { ...env }; });

  it('chặn gọi thẳng không có khóa, kể cả khi tự gửi x-user-role: ADMIN', async () => {
    const { guard, context } = makeContext({ 'x-user-role': 'ADMIN' });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('cho proxy có khóa đúng + người đã đăng nhập', async () => {
    const { guard, context } = makeContext({ 'x-internal-key': 'internal-secret', 'x-user-role': 'BIEN_TAP' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('khóa đúng nhưng chưa đăng nhập (GUEST) → chặn', async () => {
    const { guard, context } = makeContext({ 'x-internal-key': 'internal-secret', 'x-user-role': 'GUEST' });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('@Roles: sai vai trò → 403, ADMIN luôn qua', async () => {
    const meta = { roles: ['SAN_XUAT'] };
    const staff = makeContext({ 'x-internal-key': 'internal-secret', 'x-user-role': 'BIEN_TAP' }, meta);
    await expect(staff.guard.canActivate(staff.context)).rejects.toThrow(ForbiddenException);
    const admin = makeContext({ 'x-internal-key': 'internal-secret', 'x-user-role': 'ADMIN' }, meta);
    await expect(admin.guard.canActivate(admin.context)).resolves.toBe(true);
  });

  it('@Public không cần gì', async () => {
    const { guard, context } = makeContext({}, { isPublic: true });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('@ExtensionAccess: chỉ mã của tài khoản Quản lý Phiên Live được qua', async () => {
    const meta = { extensionAccess: true };
    const ok = makeContext({ 'x-extension-token': signExtensionToken('live', 'internal-secret', 3600) }, meta);
    await expect(ok.guard.canActivate(ok.context)).resolves.toBe(true);
    // Mã hợp lệ nhưng tài khoản không phải LIVE_MANAGER (hoặc đã bị đổi vai trò)
    const cskh = makeContext({ 'x-extension-token': signExtensionToken('cskh', 'internal-secret', 3600) }, meta);
    await expect(cskh.guard.canActivate(cskh.context)).rejects.toThrow(ForbiddenException);
    // Mã ký bằng khóa khác / token dùng chung cũ → chặn
    const forged = makeContext({ 'x-extension-token': signExtensionToken('live', 'other', 3600) }, meta);
    await expect(forged.guard.canActivate(forged.context)).rejects.toThrow(UnauthorizedException);
    const legacy = makeContext({ 'x-extension-token': 'ext-secret' }, meta);
    await expect(legacy.guard.canActivate(legacy.context)).rejects.toThrow(UnauthorizedException);
    // Trang CRM gọi qua proxy (không có mã extension) vẫn qua
    const proxy = makeContext({ 'x-internal-key': 'internal-secret', 'x-user-role': 'ADMIN' }, meta);
    await expect(proxy.guard.canActivate(proxy.context)).resolves.toBe(true);
  });

  it('chưa đặt env → chế độ cũ: tin x-user-role, extension không cần token', async () => {
    delete process.env.INTERNAL_API_KEY;
    delete process.env.EXTENSION_TOKEN;
    const user = makeContext({ 'x-user-role': 'ADMIN' });
    await expect(user.guard.canActivate(user.context)).resolves.toBe(true);
    const ext = makeContext({}, { extensionAccess: true });
    await expect(ext.guard.canActivate(ext.context)).resolves.toBe(true);
  });
});

describe('extension token', () => {
  it('hết hạn hoặc bị sửa payload → không hợp lệ', () => {
    const t = signExtensionToken('live', 'k', 60, 1_000_000);
    expect(verifyExtensionToken(t, 'k', 1_000_000)).toBe('live');
    expect(verifyExtensionToken(t, 'k', 1_000_000 + 61_000)).toBeNull();
    const [p, , sig] = t.split('.');
    const tampered = `${p}.${Buffer.from(JSON.stringify({ u: 'admin', exp: 9e9 })).toString('base64url')}.${sig}`;
    expect(verifyExtensionToken(tampered, 'k')).toBeNull();
  });
});
