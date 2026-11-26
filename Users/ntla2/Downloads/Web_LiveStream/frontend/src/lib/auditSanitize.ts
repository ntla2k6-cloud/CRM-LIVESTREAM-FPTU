// Lọc dữ liệu trước khi ghi nhật ký (hàm thuần, không phụ thuộc DB)
// Không bao giờ lưu các trường nhạy cảm / nặng
const SECRET_KEYS = /pass|token|secret|key|invoiceImage|image|avatar|cookie/i;
const MAX_DETAIL_CHARS = 2000;

/** Lọc body trước khi lưu: bỏ trường nhạy cảm, cắt chuỗi dài, giới hạn kích thước */
export function sanitizeDetail(body: unknown): unknown {
  const clean = (v: any, depth: number): any => {
    if (v === null || v === undefined) return v;
    if (typeof v === 'string') return v.length > 200 ? v.slice(0, 200) + '…' : v;
    if (typeof v !== 'object') return v;
    if (depth > 3) return '[…]';
    if (Array.isArray(v)) return v.length > 20 ? [...v.slice(0, 20).map((x) => clean(x, depth + 1)), `… +${v.length - 20}`] : v.map((x) => clean(x, depth + 1));
    const out: Record<string, any> = {};
    for (const [k, val] of Object.entries(v)) out[k] = SECRET_KEYS.test(k) ? '[ẩn]' : clean(val, depth + 1);
    return out;
  };
  const result = clean(body, 0);
  const text = JSON.stringify(result ?? null);
  return text.length > MAX_DETAIL_CHARS ? { truncated: text.slice(0, MAX_DETAIL_CHARS) } : result;
}

export function parseBody(raw?: string | null): unknown {
  if (!raw) return undefined;
  try { return JSON.parse(raw); } catch { return { raw: raw.slice(0, 200) }; }
}

