import { staleEndTime } from './stale.js';

describe('staleEndTime', () => {
  const start = new Date('2026-11-26T08:00:00Z');
  it('không comment mới quá 30 phút → kết thúc tại comment cuối', () => {
    const last = new Date('2026-11-26T09:00:00Z');
    expect(staleEndTime(start, last, new Date('2026-11-26T09:31:00Z'))).toEqual(last);
  });
  it('vẫn còn comment trong 30 phút → chưa kết thúc', () => {
    expect(staleEndTime(start, new Date('2026-11-26T09:00:00Z'), new Date('2026-11-26T09:20:00Z'))).toBeNull();
  });
  it('chưa có comment → tính từ lúc bắt đầu', () => {
    expect(staleEndTime(start, null, new Date('2026-11-26T08:45:00Z'))).toEqual(start);
  });
});
