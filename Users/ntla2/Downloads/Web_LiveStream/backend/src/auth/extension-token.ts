import { createHmac, timingSafeEqual } from 'node:crypto';

// Mã kết nối extension: CRM (Next.js, /api/extension/token) ký cho từng tài khoản bằng INTERNAL_API_KEY.
// Dạng `fx1.<payload base64url>.<HMAC-SHA256>`, payload = { u: userId, exp: epoch giây }.
// Backend kiểm chữ ký + hạn ở đây, rồi guard tra vai trò HIỆN TẠI của user trong DB (đổi vai trò → mã cũ hết tác dụng).
export const EXTENSION_ROLE = 'LIVE_MANAGER';
const PREFIX = 'fx1';

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const sign = (body: string, key: string) => createHmac('sha256', key).update(`${PREFIX}.${body}`).digest('base64url');

export function signExtensionToken(userId: string, key: string, ttlSeconds: number, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ u: userId, exp: Math.floor(now / 1000) + ttlSeconds })).toString('base64url');
  return `${PREFIX}.${body}.${sign(body, key)}`;
}

/** Trả userId nếu mã hợp lệ và còn hạn, ngược lại null. */
export function verifyExtensionToken(token: unknown, key: string, now = Date.now()): string | null {
  if (typeof token !== 'string') return null;
  const [prefix, body, sig] = token.trim().split('.');
  if (prefix !== PREFIX || !body || !sig || !same(sig, sign(body, key))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof payload?.u !== 'string' || typeof payload?.exp !== 'number') return null;
    return payload.exp * 1000 > now ? payload.u : null;
  } catch {
    return null;
  }
}
