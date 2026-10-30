# PROGRESS.md — Tiến độ dự án

> Đọc cùng `AGENT.md` trước mỗi task. Làm xong task nào → cập nhật file này (mới nhất ở trên).

## Đang làm / Việc tiếp theo
- [ ] Test extension trên 1 buổi TikTok LIVE thật (selector DOM mới chỉ test bằng DOM giả lập) — nếu "Đã bắt" không tăng thì sửa selector trong `extension/content.js`.
- [ ] Deploy backend Render bản mới (bóc SĐT, API `/lead` trả comment) trước buổi live.
- [ ] Endpoint `/live-engine/extension-comments` chưa có xác thực — cân nhắc thêm token cho extension.
- [ ] Trụ cột còn thiếu theo `docs/VISION.md`: đếm ngược 30s + xếp hạng mili-giây cho minigame, tạo vận đơn Viettel Post/GHTK, cột "Đã nhập học" trong Kanban, báo cáo ROI.
- [ ] Merge nhánh `claude/vercel-git-integration-078cd1` (AGENT.md, PROGRESS.md, CI/CD) vào `main` để workflow bắt đầu chạy.
- [ ] Rotate secrets đã lộ trong git history (Neon DB password, Google OAuth secret, `NEXTAUTH_SECRET`).
- [ ] Sửa `.gitignore` (đang UTF-16) và gỡ `node_modules`, `backend/dist`, log/bak/zip khỏi git.
- [ ] Nhánh `hotfix/tracking-fix` chưa merge — kiểm tra còn cần không.

## Vấn đề đã biết
- Secrets còn trong git history: commit `7b7fa53d`, `a974b826`, `0bc56a7e`.
- `.gitignore` root và `Web_LiveStream/.gitignore` mã hóa UTF-16 → git không đọc → ~17.6k file `node_modules` đã bị commit.
- `users.json` chứa email thật + password hash.
- Frontend build bỏ qua lỗi ESLint/TS (`next.config.mjs`).
- App Vinsoul root ghi file JSON → không lưu bền trên Vercel.

## Đã xong (tóm tắt theo module)
- **Live (TikTok)**: kết nối tiktok-live-connector + Mock Mode, dashboard realtime trong từng session, đếm tổng comment/unique users chính xác, nút thoát trang điều khiển, sửa lỗi Mojibake & PrismaClientValidationError.
- **Chrome extension**: bắt comment TikTok LIVE native, popup thống kê realtime, tự tách `liveSessionId`.
- **RBAC / Staff**: danh sách quyền đầy đủ, RoleGuard bảo vệ route, sidebar lọc theo quyền, DEFAULT_ROLES mặc định, role lấy realtime từ DB.
- **Schedule / Payroll**: đăng ký ca, điều hướng tháng, lưu payroll, Payroll chỉ ADMIN, MANAGER được sửa.
- **CSKH / Lead**: CRUD lead, modal xóa, toast, export CSV.
- **Inventory / Tracking / Logistics**: luồng trạng thái (gồm UNPACKED), tra cứu theo trackingCode/orderId/phone, xuất PDF, email thông báo.
- **Claim**: landing page cho người thắng điền thông tin giao hàng.
- **Mobile UI**: sửa overflow modal iOS (dvh), scrollbar responsive.
- **Deploy**: Vercel auto deploy từ `main`, backend trên Render.

## Nhật ký
- 2026-10-31 — Lọc comment CRM + lưu quà tặng: extension nhận dòng "đã gửi <quà> xN" thành sự kiện quà; backend lưu `LiveComment` category GIFT (gộp combo, 3 test), loại GIFT khỏi số liệu comment; `/dashboard/analytics/:id` trả nhãn tiếng Việt, cờ `isCrm`, danh sách quà + bảng xếp hạng người tặng. Trang Thống kê: tab "Comment CRM (đã lọc)" (mặc định), "Người tặng quà"; sửa tab Minigame trước giờ luôn rỗng (lọc theo nhãn backend không gán) và bỏ nhãn đúng/sai giả.
- Cần kiểm chứng trên live thật: định dạng dòng tặng quà của TikTok (mới test bằng DOM giả lập).
- 2026-10-31 — Test live thật lần 2: phiên tự tạo OK, 14 comment vào DB. Sửa: nội dung dính số huy hiệu cấp fan ("6Mô phật") do TikTok đổi sang class Tailwind → content.js đọc text node, bỏ ô huy hiệu 1–2 chữ số; backend xử lý lô comment song song theo người (8 luồng, ~1s/comment trước đây). Lưu ý: tên lấy được là tên hiển thị (dòng chat không có link @handle).
- 2026-10-31 — Test thật: extension bắt được comment nhưng lỗi 500 do dán link TikTok vào ô ID phiên CRM. Thêm `POST /live-engine/extension-session` (link TikTok → tìm/tạo phiên LIVE_NOW của @user; link/ID CRM → phiên đó; 5 test). Popup nhận link TikTok/để trống = tab đang mở, hiện tên phiên CRM; thêm nút RESET (xóa số đếm + hàng đợi). Icon logo FPT. CORS cho origin `chrome-extension://`.
- 2026-10-30 — Extension → CRM → Lead: sửa bug extension không gửi được comment (sai format message, cứng `localhost:3001`); bắt @handle/tên/avatar, lọc thông báo hệ thống, ID chống trùng, cấu hình server, tự inject vào tab đã mở. Backend: `comment-classifier.ts` bóc SĐT + ngành (24 test), lưu SĐT/ngành vào Customer, lead có SĐT = nóng, báo lỗi rõ khi sai ID phiên. `/lead` trả tên phiên live + 10 comment gần nhất; CSKH hiện nguồn, nhãn ý định tiếng Việt, lịch sử comment, giữ đúng status khi lưu. Thêm `docs/VISION.md`, `extension/README.md`; CI chạy thêm `npm test` backend.
- 2026-10-30 — Fix CI: backend `npm ci` lỗi trên Node 22/npm 10 ("Missing: typescript@5.9.3 from lock file") → chuyển CI sang Node 24, nâng action lên checkout@v5 / setup-node@v5 / github-script@v8 (hết cảnh báo Node 20 deprecated).
- 2026-10-30 — Thêm `AGENT.md`, `PROGRESS.md`, `CLAUDE.md` (trỏ tới 2 file trên); thêm GitHub Actions `ci.yml` + `deploy-monitor.yml` (theo dõi deploy Vercel, lỗi → mở issue thông báo).
- 2026-10-03 — Live dashboard realtime, Chrome extension, nút thoát trang live.
- 2026-10-02 — Tích hợp TikTok Live + Mock Mode; Payroll chỉ ADMIN; sửa mobile UI.
- 2026-10-01 — Hoàn thiện RBAC (RoleGuard, sidebar), sửa nhiều bug schedule.
- 2026-09-29 — Landing page Claim; bỏ mock data live.
- 2026-09-28 — Cấu hình Vercel auto deploy.
- 2026-09-26 — Logistics/tracking hoàn chỉnh, gỡ `.env` khỏi git.
- 2026-09-25 — Sửa CRUD toàn bộ trang, proxy API qua Next.js.
