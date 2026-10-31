# PROGRESS.md — Tiến độ dự án

> Đọc cùng `AGENT.md` trước mỗi task. Làm xong task nào → cập nhật file này (mới nhất ở trên).

## Đang làm / Việc tiếp theo
- [ ] **Kho: in tem + mail chúc mừng đã lên production** (2026-10-31, đã thêm cột `Shipment.tiktokAccount/congratsSentAt`). Test E2E trên production bằng đơn test (đã xóa): tạo đơn + TikTok ID ✅, lọc/chọn in tem ✅, chuyển Hành chính chỉ đơn đang lọc ✅, nhập mã (dán Excel) → IN_TRANSIT + lịch sử ✅, `/tracking` bằng mã dự án và mã ĐVVC ✅, mail chúc mừng báo "chưa kết nối email" ✅. Còn: đặt SMTP_* trên Render rồi gửi thử 1 mail; in tem trên máy thật. 3 đơn cũ (DON-788, DON-003, DON-TEST999) có trạng thái kiểu cũ ("Đã tạo đơn", "Đang vận chuyển"…) không khớp bộ lọc.
- [ ] **Minigame đã lên production** (2026-10-31, `e3d8f7cb`, đã thêm cột `Question.options`; API `/question` test OK). Còn: test trên live thật — tạo câu → Bắt đầu → comment `A/B/C/D` → bảng xếp hạng. Trang `/play` vẫn nối `localhost:3001` (chưa chạy trên production).
- [ ] Chuyển repo GitHub sang Private + đổi mật khẩu Neon, Google OAuth secret, `NEXTAUTH_SECRET`, `JWT_SECRET` (AUDIT #3 — người dùng tự làm).
- [ ] **Vận đơn qua Hành chính đã lên production** (2026-10-31, `33bfa31d`; API bulk test OK, quyền BIEN_TAP bị 403). Còn: Thủ kho thử 1 vòng thật (Chuyển Hành chính → nhập file mã vận đơn → `/tracking`), xem giao diện trang Kho.
- [ ] **Xem `docs/AUDIT-2026-10-31.md`** — 31 việc đã xếp ưu tiên. P0 bảo mật: backend Render đang trả lead/staff/order (SĐT, email, địa chỉ) cho người không đăng nhập; repo GitHub public kèm secret cũ trong lịch sử; minigame không chấm điểm được (P1 #7).
- [ ] Test extension trên 1 buổi TikTok LIVE thật (selector DOM mới chỉ test bằng DOM giả lập) — nếu "Đã bắt" không tăng thì sửa selector trong `extension/content.js`.
- [ ] Deploy backend Render bản mới (bóc SĐT, API `/lead` trả comment) trước buổi live.
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
- Trang `/claim` (`api/claim/route.ts`) dùng `customer.name/username/email` — không có trong schema Customer → lỗi khi người trúng tự điền thông tin.
- Email chưa gửi được: Render chưa có `SMTP_HOST/USER/PASS`.
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
- 2026-10-31 — Chuẩn hóa 3 đơn trạng thái kiểu cũ trên DB production (không khớp bộ lọc nào): `DON-788` "Đơn vị đang vận chuyển" và `DON-TEST999` "Đang vận chuyển" → `IN_TRANSIT`, `DON-003` "Đã tạo đơn" → `UNPACKED`; có ghi lịch sử, không gửi mail. Bộ lọc trang Kho giờ đủ 6/6 đơn. `DON-788`, `DON-003` thiếu tên người nhận (dữ liệu test cũ).
- 2026-10-31 — In tem đổi sang iframe ẩn (trình duyệt chặn pop-up làm `window.open` trả null → không in được, phát hiện khi test E2E); thông báo trang Kho lên đầu màn hình (trước bị thanh menu dưới che).
- 2026-10-31 — Kho: **In tem giao hàng** mới (`frontend/src/lib/labels.ts`): cửa sổ lọc theo trạng thái (mặc định Chưa đóng gói) / phiên / tìm kiếm + tích chọn từng đơn; khổ A4 6 tem/trang hoặc 100×150 máy in nhiệt; tên/SĐT to, địa chỉ không bị cắt (tự thu nhỏ chữ), ô MÃ VẬN ĐƠN (mã dự án) nổi bật — đã kiểm tra bằng ảnh chụp Chrome headless. Word export bỏ emoji. **Mail chúc mừng trúng quà**: Shipment thêm `tiktokAccount`, `congratsSentAt`; form đơn có ô TikTok ID; cửa sổ "Gửi mail chúc mừng" tìm theo TikTok ID, nhập email, gửi (`POST /order/congrats`, THU_KHO) — mail gồm tên quà + mã vận đơn dự án + link tracking; không gửi lại trừ khi chọn. **Mã ĐVVC chỉ hiện cho khách từ IN_TRANSIT** (`/order/tracking` ẩn trước đó; email trạng thái cũng vậy); nhập file mã từ Hành chính → IN_TRANSIT. Sửa link tracking trong mail (tên miền cũ `crm.student.fptu.mobot.app` chết → `crm-livestream-fptu.vercel.app`). 4 test mới.
- 2026-10-31 — Vận đơn qua Hành chính (AUDIT #27): trạng thái mới `SENT_TO_ADMIN` "Đã chuyển Hành chính" (khách vẫn thấy "Đã xử lý", không gửi mail). Trang Kho: nút **Chuyển Hành chính (N)** xuất file CSV các đơn Đã đóng gói (cột ĐVVC/Mã vận đơn/Link trống cho HC điền) + chuyển trạng thái; nút **Nhập mã vận đơn** nhận file CSV hoặc dán từ Excel (tự nhận cột theo tiêu đề, xem trước từng dòng) → `POST /order/bulk-tracking` gắn ĐVVC + mã, đơn chưa giao → HANDED_OVER (lịch sử + mail khách). API `bulk-status`/`bulk-tracking` chỉ THU_KHO/ADMIN/MANAGER. `/tracking` tra được bằng mã vận đơn ĐVVC. 3 test mới.
- 2026-10-31 — Sửa minigame (AUDIT #7, #8): câu hỏi lưu DB qua API `/question` (tạo/sửa/xóa, `POST :id/start|end`, `GET :id/leaderboard`); Bắt đầu → câu ACTIVE + `startedAt` (đóng câu khác), Kết thúc/hết giờ → CLOSED; socket `gameStarted/gameEnded` phát theo phòng phiên (bỏ handler socket không xác thực); chấm điểm bỏ qua đáp án sau `timeLimit + 2s`, tốc độ tính theo giờ extension thấy comment (lệch >30s/tương lai → giờ server); trang Điều khiển LIVE bỏ MOCK_QUESTIONS, có "Tạo 3 câu mẫu", "+ Thêm câu hỏi", tải lại trang giữa câu → chạy tiếp đồng hồ + bảng xếp hạng. Schema thêm `Question.options Json?` (cả 2 file). 6 test mới.
- 2026-10-31 — Bật xác thực backend trên production: `INTERNAL_API_KEY` (Vercel + Render) và `EXTENSION_TOKEN` (Render) đã đặt; kiểm chứng: giả `x-user-role: ADMIN`/sai khóa → 401, CSKH đăng nhập tải lead bình thường, extension 1.3.0 có ô Mã truy cập.
- 2026-10-31 — P0 bảo mật (AUDIT #1, #2, #4, #6, #13): `RolesGuard` toàn cục yêu cầu `x-internal-key` (proxy Next.js gửi) và role đã đăng nhập cho mọi route trừ `@Public` (`/`, tra cứu đơn); route extension dùng `x-extension-token`; proxy bỏ qua phiên hết hạn; trang `live/[id]` gọi qua proxy thay vì thẳng Render; thêm `middleware.ts` chặn trang khi chưa đăng nhập; extension 1.3.0 có ô "Mã truy cập"; backend `listen(PORT)`. 7 test guard. Chỉ có hiệu lực sau khi đặt env. Chốt flow vận đơn qua Hành chính (#27). Chưa làm: #3 (repo private + đổi secret), #5 (RBAC vào DB), xác thực socket.
- 2026-10-31 — Extension 2 chế độ: **Khóa 1 phiên** (chỉ tab + kênh đã gắn; chuyển kênh/trang → tự dừng; quay lại → bắt tiếp) và **Nhiều tab** (mọi tab LIVE, mỗi kênh 1 phiên CRM riêng — trước đây dồn chung 1 phiên làm sai số liệu). Popup chọn chế độ, hiện kênh/phiên đang ghi, số "Bỏ qua". 404 phiên đã xóa → bỏ hàng đợi phiên đó, báo RESET.
- 2026-10-31 — Trang Kết nối LIVE bỏ kết nối TikTok phía server (bị rate limit Euler sign server), tạo phiên qua `/live-engine/extension-session`; số liệu thật từ `GET /live-session/overview`; danh sách phiên ở Thống kê hiện ngày/thời lượng/cmt/lead thật; extension bỏ huy hiệu "Hạng N". **Đã xóa toàn bộ 15 LiveSession cũ** theo yêu cầu (kể cả 5 ca lịch phân công + 6 lượt phân công), 616 comment, 14 lead từ live, 46 customer mồ côi — backup tại `C:/Users/ntla2/Downloads/CRM-backup/live_sessions_backup_2026-10-31.json` (ngoài repo, có SĐT khách, không commit). Còn lại 2 lead nhập tay.
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
