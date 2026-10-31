import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard.js';

function makeContext(headers: Record<string, string>, meta: Record<string, unknown> = {}) {
  const reflector = { getAllAndOverride: (key: string) => meta[key] };
  const context = {
    getType: () => 'http',
    getHandler: () => null,
    getClass: () => null,
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  };
  return { guard: new RolesGuard(reflector as any), context: context as any };
}

describe('RolesGuard', () => {
  const env = { ...process.env };
  beforeEach(() => {
    process.env.INTERNAL_API_KEY = 'internal-secret';
    process.env.EXTENSION_TOKEN = 'ext-secret';
  });
  afterEach(() => { process.env = { ...env }; });

  it('chặn gọi thẳng không có khóa, kể cả khi tự gửi x-user-role: ADMIN', () => {
    const { guard, context } = makeContext({ 'x-user-role': 'ADMIN' });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('cho proxy có khóa đúng + người đã đăng nhập', () => {
    const { guard, context } = makeContext({ 'x-internal-key': 'internal-secret', 'x-user-role': 'BIEN_TAP' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('khóa đúng nhưng chưa đăng nhập (GUEST) → chặn', () => {
    const { guard, context } = makeContext({ 'x-internal-key': 'internal-secret', 'x-user-role': 'GUEST' });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('@Roles: sai vai trò → 403, ADMIN luôn qua', () => {
    const meta = { roles: ['PRODUCER'] };
    const staff = makeContext({ 'x-internal-key': 'internal-secret', 'x-user-role': 'BIEN_TAP' }, meta);
    expect(() => staff.guard.canActivate(staff.context)).toThrow(ForbiddenException);
    const admin = makeContext({ 'x-internal-key': 'internal-secret', 'x-user-role': 'ADMIN' }, meta);
    expect(admin.guard.canActivate(admin.context)).toBe(true);
  });

  it('@Public không cần gì', () => {
    const { guard, context } = makeContext({}, { isPublic: true });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('@ExtensionAccess: token đúng qua, sai token → chặn, proxy đã đăng nhập vẫn qua', () => {
    const meta = { extensionAccess: true };
    const ok = makeContext({ 'x-extension-token': 'ext-secret' }, meta);
    expect(ok.guard.canActivate(ok.context)).toBe(true);
    const bad = makeContext({ 'x-extension-token': 'nope' }, meta);
    expect(() => bad.guard.canActivate(bad.context)).toThrow(UnauthorizedException);
    const proxy = makeContext({ 'x-internal-key': 'internal-secret', 'x-user-role': 'ADMIN' }, meta);
    expect(proxy.guard.canActivate(proxy.context)).toBe(true);
  });

  it('chưa đặt env → chế độ cũ: tin x-user-role, extension không cần token', () => {
    delete process.env.INTERNAL_API_KEY;
    delete process.env.EXTENSION_TOKEN;
    const user = makeContext({ 'x-user-role': 'ADMIN' });
    expect(user.guard.canActivate(user.context)).toBe(true);
    const ext = makeContext({}, { extensionAccess: true });
    expect(ext.guard.canActivate(ext.context)).toBe(true);
  });
});
