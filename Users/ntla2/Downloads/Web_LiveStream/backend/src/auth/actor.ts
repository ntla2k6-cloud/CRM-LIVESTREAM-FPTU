// Người thao tác lấy từ header proxy Next.js gửi (chỉ tin khi có x-internal-key đúng — RolesGuard đã kiểm)
export type RequestActor = { id?: string; name?: string; role: string };

export const actorOf = (h: Record<string, any>): RequestActor => ({
  id: typeof h['x-user-id'] === 'string' ? h['x-user-id'] : undefined,
  name: typeof h['x-user-name'] === 'string' ? decodeURIComponent(h['x-user-name']) : undefined,
  role: typeof h['x-user-role'] === 'string' ? h['x-user-role'] : 'GUEST',
});
