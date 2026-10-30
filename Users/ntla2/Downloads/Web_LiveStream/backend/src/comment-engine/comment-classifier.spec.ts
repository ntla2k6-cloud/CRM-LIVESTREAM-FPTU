import { classifyComment, extractPhone, extractMajor, HOT_LEAD_SCORE } from './comment-classifier.js';

describe('extractPhone', () => {
  it.each([
    ['sdt em 0912345678 nha', '0912345678'],
    ['zalo 091 234 5678', '0912345678'],
    ['0912.345.678', '0912345678'],
    ['+84912345678', '0912345678'],
    ['84 912 345 678 ạ', '0912345678'],
    ['038-123-4567', '0381234567'],
  ])('%s → %s', (input, expected) => {
    expect(extractPhone(input)).toBe(expected);
  });

  it.each(['0212345678', '091234567', 'học phí 2024 bao nhiêu', '1A', ''])('không nhận nhầm: %s', (input) => {
    expect(extractPhone(input)).toBeNull();
  });
});

describe('extractMajor', () => {
  it('nhận diện ngành', () => {
    expect(extractMajor('em muốn học ngành ai ạ')).toBe('Trí tuệ nhân tạo');
    expect(extractMajor('cntt ra trường làm gì')).toBe('Công nghệ thông tin');
    expect(extractMajor('thiết kế đồ họa có thi vẽ không')).toBe('Thiết kế đồ họa');
  });

  it('không nhầm đại từ "ai" / chữ "sẽ" không dấu', () => {
    expect(extractMajor('ai biết không')).toBeNull();
    expect(extractMajor('em se xem live tiep')).toBeNull();
  });
});

describe('classifyComment', () => {
  it.each(['A', '1A', '1.a', '2-b', '3 c'])('đáp án minigame: %s', (input) => {
    expect(classifyComment(input).category).toBe('QUIZ');
  });

  it('comment có SĐT là lead nóng', () => {
    const r = classifyComment('Cho em xin tư vấn ngành CNTT, sđt 0987654321');
    expect(r.category).toBe('LEAD');
    expect(r.intent).toBe('ADMISSION_PHONE');
    expect(r.phone).toBe('0987654321');
    expect(r.major).toBe('Công nghệ thông tin');
    expect(r.score).toBeGreaterThanOrEqual(HOT_LEAD_SCORE);
  });

  it('hỏi tư vấn không có SĐT vẫn là LEAD', () => {
    expect(classifyComment('cho em xin tư vấn với ạ')).toMatchObject({ category: 'LEAD', intent: 'ADMISSION_CONTACT' });
  });

  it('hỏi học phí là ADMISSION', () => {
    expect(classifyComment('học phí 1 năm bao nhiêu ạ')).toMatchObject({ category: 'ADMISSION', intent: 'ADMISSION_TUITION' });
  });

  it('không bắt nhầm chữ chứa "it"/"dk" bên trong từ khác', () => {
    expect(classifyComment('hôm nay vui quá').category).toBe('CHAT');
    expect(classifyComment('kidk kitty').category).toBe('CHAT');
  });

  it('spam link', () => {
    expect(classifyComment('xem tại https://abc.com').category).toBe('SPAM');
  });

  it('câu hỏi chung', () => {
    expect(classifyComment('mc tên gì vậy?').category).toBe('QUESTION');
  });
});
