import { createHmac } from 'crypto';

// Cùng định dạng với backend/src/auth/extension-token.ts: `fx1.<payload base64url>.<HMAC-SHA256 bằng INTERNAL_API_KEY>`.
// Backend kiểm chữ ký + hạn, rồi tra vai trò hiện tại của user (chỉ LIVE_MANAGER được đẩy comment).
export const EXTENSION_ROLE = 'LIVE_MANAGER';
export const EXTENSION_TOKEN_TTL_DAYS = 90;

export function signExtensionToken(userId: string, key: string, ttlSeconds = EXTENSION_TOKEN_TTL_DAYS * 86400, now = Date.now()) {
  const exp = Math.floor(now / 1000) + ttlSeconds;
  const body = Buffer.from(JSON.stringify({ u: userId, exp })).toString('base64url');
  const sig = createHmac('sha256', key).update(`fx1.${body}`).digest('base64url');
  return { token: `fx1.${body}.${sig}`, expiresAt: new Date(exp * 1000).toISOString() };
}
