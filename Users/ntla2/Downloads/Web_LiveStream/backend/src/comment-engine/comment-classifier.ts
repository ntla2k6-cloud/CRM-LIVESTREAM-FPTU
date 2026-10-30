// Phân loại comment livestream: QUIZ / LEAD / ADMISSION / SPAM / QUESTION / CHAT,
// đồng thời bóc tách SĐT và ngành quan tâm. Hàm thuần để test được.

export interface CommentClassification {
  category: string;
  intent: string | null;
  score: number;
  phone: string | null;
  major: string | null;
}

// Điểm >= 80 được coi là lead nóng (CSKH hiển thị "HOT")
export const HOT_LEAD_SCORE = 80;

// Ranh giới từ cho tiếng Việt: \b của JS không hiểu chữ có dấu
const W = (body: string) => new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${body})(?=$|[^\\p{L}\\p{N}])`, 'iu');

const LEAD_PATTERNS: Array<{ regex: RegExp; intent: string; score: number }> = [
  { regex: W('số điện thoại|so dien thoai|sđt|sdt|zalo|liên hệ|lien he|tư vấn|tu van|inbox|ib'), intent: 'ADMISSION_CONTACT', score: 50 },
  { regex: W('đăng ký|dang ky|đăng kí|dang ki|dk|đk|nộp hồ sơ|nop ho so'), intent: 'ADMISSION_REGISTER', score: 30 },
  { regex: W('học phí|hoc phi|tiền học|tien hoc|bao nhiêu tiền|bao nhieu tien|học bổng|hoc bong'), intent: 'ADMISSION_TUITION', score: 20 },
  { regex: W('điều kiện|dieu kien|xét tuyển|xet tuyen|học bạ|hoc ba|điểm chuẩn|diem chuan'), intent: 'ADMISSION_REQUIREMENT', score: 10 },
  { regex: W('ký túc xá|ky tuc xa|ktx'), intent: 'ADMISSION_DORM', score: 10 },
  { regex: W('ngành|nganh'), intent: 'ADMISSION_MAJOR', score: 10 },
];

const MAJORS: Array<{ regex: RegExp; name: string }> = [
  // "ai" trần là đại từ ("ai biết...") nên chỉ nhận khi đi kèm ngữ cảnh ngành học
  { regex: W('trí tuệ nhân tạo|tri tue nhan tao|ngành ai|nganh ai|học ai|hoc ai|ai-iot|a\\.i'), name: 'Trí tuệ nhân tạo' },
  { regex: W('kỹ thuật phần mềm|ky thuat phan mem|ktpm|software'), name: 'Kỹ thuật phần mềm' },
  { regex: W('an toàn thông tin|an toan thong tin|attt|cyber ?security'), name: 'An toàn thông tin' },
  { regex: W('cntt|công nghệ thông tin|cong nghe thong tin|it'), name: 'Công nghệ thông tin' },
  { regex: W('thiết kế đồ họa|thiet ke do hoa|đồ họa|do hoa|design|tkđh'), name: 'Thiết kế đồ họa' },
  { regex: W('marketing|digital marketing'), name: 'Digital Marketing' },
  { regex: W('quản trị kinh doanh|quan tri kinh doanh|qtkd|kinh doanh|kinh tế|kinh te|business'), name: 'Quản trị kinh doanh' },
  { regex: W('ngôn ngữ anh|ngon ngu anh|tiếng anh|tieng anh'), name: 'Ngôn ngữ Anh' },
  { regex: W('ngôn ngữ nhật|ngon ngu nhat|tiếng nhật|tieng nhat'), name: 'Ngôn ngữ Nhật' },
  { regex: W('ngôn ngữ hàn|ngon ngu han|tiếng hàn|tieng han'), name: 'Ngôn ngữ Hàn' },
  { regex: W('truyền thông|truyen thong|đa phương tiện|da phuong tien|media'), name: 'Truyền thông đa phương tiện' },
  { regex: W('logistics|chuỗi cung ứng|chuoi cung ung'), name: 'Logistics' },
  { regex: W('ô tô|o to|vi mạch|vi mach|bán dẫn|ban dan|iot'), name: 'Kỹ thuật (Ô tô/Vi mạch/IoT)' },
];

const PHONE_SCORE = 80;

/** Tìm SĐT di động Việt Nam (0xx/+84xx, cho phép dấu cách/chấm/gạch). Trả về dạng 0xxxxxxxxx. */
export function extractPhone(text: string): string | null {
  const candidates = text.match(/(?:\+?84|0)[\s.\-]?\d(?:[\s.\-]?\d){8}/g);
  if (!candidates) return null;
  for (const raw of candidates) {
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('84')) digits = '0' + digits.slice(2);
    if (/^0[35789]\d{8}$/.test(digits)) return digits;
  }
  return null;
}

export function extractMajor(text: string): string | null {
  return MAJORS.find((m) => m.regex.test(text))?.name ?? null;
}

export function classifyComment(text: string): CommentClassification {
  const none = { phone: null, major: null };
  if (!text) return { category: 'CHAT', intent: null, score: 0, ...none };
  const normalized = text.toLowerCase().trim();

  // Đáp án minigame: "A", "1A", "1.A", "2-b"
  if (/^([1-9][0-9]?[.\-\s]?)?[a-d]$/i.test(normalized)) {
    return { category: 'QUIZ', intent: 'ANSWER', score: 0, ...none };
  }

  const phone = extractPhone(normalized);
  const major = extractMajor(normalized);

  let score = 0;
  let intent: string | null = null;
  for (const p of LEAD_PATTERNS) {
    if (p.regex.test(normalized) && p.score > score) {
      score = p.score;
      intent = p.intent;
    }
  }
  if (!intent && major) {
    score = 10;
    intent = 'ADMISSION_MAJOR';
  }

  if (phone) {
    return { category: 'LEAD', intent: 'ADMISSION_PHONE', score: Math.max(PHONE_SCORE, score), phone, major };
  }

  if (intent) {
    return { category: score >= 30 ? 'LEAD' : 'ADMISSION', intent, score, phone: null, major };
  }

  if (/(https?:\/\/|www\.|\.com\b|\.vn\b)/.test(normalized)) {
    return { category: 'SPAM', intent: null, score: 0, ...none };
  }

  if (/\?\s*$/.test(normalized)) {
    return { category: 'QUESTION', intent: null, score: 0, ...none };
  }

  return { category: 'CHAT', intent: null, score: 0, ...none };
}
