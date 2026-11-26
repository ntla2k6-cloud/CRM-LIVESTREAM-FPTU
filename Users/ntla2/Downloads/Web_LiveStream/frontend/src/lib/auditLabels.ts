// Diễn giải dòng nhật ký (method + đường dẫn API) thành câu tiếng Việt cho trang /audit. Hàm thuần.

const MODULES: Array<[RegExp, string]> = [
  [/^\/equipment\/categories/, 'Danh mục thiết bị'],
  [/^\/equipment/, 'Kho thiết bị'],
  [/^\/order/, 'Đơn quà / vận đơn'],
  [/^\/gift/, 'Kho quà'],
  [/^\/lead/, 'Lead / CSKH'],
  [/^\/question/, 'Minigame'],
  [/^\/live-session|^\/live-engine/, 'Phiên LIVE'],
  [/^\/shift/, 'Lịch ca'],
  [/^\/staff/, 'Nhân sự'],
  [/^\/task/, 'Taskly'],
  [/^\/admin\/users/, 'Phân quyền tài khoản'],
  [/^\/profile/, 'Hồ sơ cá nhân'],
  [/^\/extension\/token/, 'Mã kết nối extension'],
];

// Hành động cụ thể theo đuôi đường dẫn (ưu tiên hơn Thêm/Sửa/Xóa chung)
const SUB_ACTIONS: Array<[RegExp, string]> = [
  [/\/handover$/, 'Bàn giao'],
  [/\/return-lender$/, 'Trả đồ mượn'],
  [/\/return$/, 'Thu hồi'],
  [/\/restore$/, 'Khôi phục'],
  [/\/status$/, 'Đổi tình trạng'],
  [/\/start$/, 'Bắt đầu câu hỏi'],
  [/\/end$/, 'Kết thúc câu hỏi'],
  [/\/bulk-status$/, 'Chuyển trạng thái hàng loạt'],
  [/\/bulk-tracking$/, 'Nhập mã vận đơn'],
  [/\/congrats$/, 'Gửi mail chúc mừng'],
  [/\/script$/, 'Sửa kịch bản'],
  [/\/extension-session$/, 'Tạo/gắn phiên LIVE'],
  [/\/disconnect$/, 'Ngắt kết nối'],
  [/\/assign$/, 'Phân công ca'],
  [/^\/extension\/token$/, 'Lấy mã'],
];

const VERB: Record<string, string> = { POST: 'Thêm', PATCH: 'Sửa', PUT: 'Sửa', DELETE: 'Xóa' };

export const ACTION_TYPES: Record<string, string> = {
  '': 'Mọi thao tác', login: 'Đăng nhập', failed: 'Đăng nhập sai', logout: 'Đăng xuất',
  create: 'Thêm / thao tác', update: 'Sửa', delete: 'Xóa',
};

export function describeAudit(row: { action: string; path?: string | null; detail?: any }) {
  if (row.action === 'LOGIN') return { tone: 'login', text: `Đăng nhập${row.detail?.method === 'google' ? ' (Google)' : row.detail?.method === 'password' ? ' (tài khoản)' : ''}` };
  if (row.action === 'LOGIN_FAILED') return { tone: 'danger', text: `Đăng nhập sai${row.detail?.username ? ` — tài khoản "${row.detail.username}"` : ''}` };
  if (row.action === 'LOGOUT') return { tone: 'muted', text: 'Đăng xuất' };
  const path = (row.path || '').split('?')[0];
  const mod = MODULES.find(([re]) => re.test(path))?.[1] || path;
  const sub = SUB_ACTIONS.find(([re]) => re.test(path))?.[1];
  const verb = sub || VERB[row.action] || row.action;
  if (path === '/admin/users' && row.detail?.role) {
    const r = row.detail.role;
    return { tone: 'warn', text: `Đổi vai trò ${row.detail.target || ''}: ${r.from} → ${r.to}` };
  }
  return { tone: row.action === 'DELETE' ? 'danger' : 'default', text: `${verb} · ${mod}` };
}
