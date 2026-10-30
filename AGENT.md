# AGENT.md — Hướng dẫn cho AI agent (đọc TRƯỚC khi làm)

> AI không nhớ gì giữa các lần prompt. File này + `PROGRESS.md` là "bộ nhớ" của dự án.
>
> **Quy trình bắt buộc mỗi task:**
> 1. Đọc hết `AGENT.md` (file này) và `PROGRESS.md`. Task tính năng mới → đọc thêm `docs/VISION.md` (định hướng, 5 trụ cột).
> 2. Kiểm tra mục **Đang làm / Việc tiếp theo** và **Vấn đề đã biết** trong `PROGRESS.md` — có liên quan task không.
> 3. Làm task theo **Quy ước** bên dưới.
> 4. Làm xong: thêm 1 dòng vào **Nhật ký** trong `PROGRESS.md`, cập nhật Đang làm/Việc tiếp theo. Nếu thay đổi cấu trúc/deploy/quy ước → sửa luôn `AGENT.md`.
> 5. Nếu có issue `🚨 Deploy failed` / `🚨 CI failed` đang mở trên GitHub → ưu tiên fix trước.

## 1. Repo chứa gì

Remote: `https://github.com/ntla2k6-cloud/CRM-LIVESTREAM-FPTU` — nhánh chính `main`.

### 1.1 CRM Livestream (app chính) — `Users/ntla2/Downloads/Web_LiveStream/`
Đường dẫn lồng này là do lỡ commit đường dẫn tuyệt đối của máy — **đây vẫn là app đang phát triển chính**. Viết tắt bên dưới: `WL = Users/ntla2/Downloads/Web_LiveStream`.

- `WL/frontend/` — Next.js 14 (App Router, `src/app`), next-auth (Google), Prisma 5 → Postgres (Neon), Tailwind + shadcn, socket.io-client.
  - Build: `prisma generate && next build`.
  - `next.config.mjs` **tắt** ESLint và TS errors khi build → lỗi type không chặn deploy, phải tự kiểm tra.
  - Mọi call từ browser đi qua proxy `src/app/api/backend/[...slug]/route.ts` → `BACKEND_URL` (mặc định `https://crm-livestream-fptu.onrender.com`).
  - Trang: `admin, analytics, claim, cskh, inventory, live, login, play, profile, schedule, settings, staff, taskly, tracking`.
- `WL/backend/` — NestJS 12 (ESM), Prisma, socket.io, nodemailer, tiktok-live-connector. Deploy trên **Render**. Test: vitest. Lint: oxlint.
  - Module: auth, comment-engine, dashboard, email, gift, lead, live-engine, live-session, minigame, order, shift, staff, task, websocket.
- Có **2 `schema.prisma`** (frontend & backend) — sửa schema thì đồng bộ cả hai.
- Kế hoạch kiến trúc dài hạn: `WL/architecture_blueprint.md`.

### 1.2 `extension/` (root) — xem `extension/README.md`
Chrome extension MV3 đọc comment TikTok LIVE trên Chrome thật → `POST {backend}/live-engine/extension-comments` (mặc định backend Render, đổi được trong popup).
- `content.js`: đọc khung chat (selector ở đầu file — TikTok đổi giao diện thì sửa ở đây), lọc thông báo hệ thống, chống trùng, ID comment ổn định theo người+nội dung+phút.
- `background.js`: hàng đợi lưu `storage.session`, gửi lô 50 comment/2s, lỗi thì giữ lại thử lại.
- Quà tặng lưu chung bảng `LiveComment` với `category = 'GIFT'`, `rawPayload = {"giftName","giftCount"}` (không đổi schema DB). Mọi thống kê comment phải loại `GIFT`. Combo cùng người + cùng quà trong 90s được gộp (`PipelineService.processGift`).
- Backend: `comment-engine/comment-classifier.ts` (hàm thuần, có test) phân loại + bóc SĐT/ngành → `pipeline.service.ts` lưu `LiveComment`, cập nhật `Customer.phone/interestedMajor`, tạo/cập nhật `Lead` (SĐT ⇒ điểm ≥ 80 = lead nóng).

### 1.3 Vinsoul Academy (root repo, app cũ)
- Express 5 + HTML/JS thuần: `server.js` (export `app`), `index.html`, `app.js`, `auth.js`…
- `app_v3/v4/v5.js`, `index_clean.html`, `style_v4.css` là bản cũ.
- Dữ liệu lưu file JSON (`users.json`, `database.json`, `rbac.json`) → trên Vercel serverless **không lưu bền**.

## 2. Biến môi trường

| App | Biến |
|---|---|
| frontend | `DATABASE_URL`, `DIRECT_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `BACKEND_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`, `NEXT_PUBLIC_MOCK_MODE` |
| backend | `DATABASE_URL`, `DIRECT_URL`, `FRONTEND_URL`, `TRACKING_BASE_URL`, `SMTP_HOST/PORT/SECURE/USER/PASS/FROM_EMAIL/FROM_NAME` |
| root Vinsoul | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, `NODE_ENV` |

Đặt trên dashboard Vercel/Render. **Không bao giờ commit `.env`.**

## 3. Deploy & CI/CD

- **Vercel** tự deploy khi push lên `main` (frontend Next.js; root `vercel.json` cho app Vinsoul). **Render** deploy backend.
- GitHub Actions (`.github/workflows/`):
  - `ci.yml` — mỗi push/PR: build frontend, test (vitest) + build backend, kiểm tra cú pháp root + extension. Fail → GitHub gửi mail cho người push; trên `main` thì mở issue `🚨 CI failed`.
  - `deploy-monitor.yml` — nghe trạng thái deploy Vercel (`deployment_status`). Deploy lỗi hoặc URL deploy không trả 2xx/3xx → mở issue `🚨 Deploy failed` (GitHub gửi thông báo). Deploy sau thành công → tự đóng issue.
- Chỉ chạy được sau khi các workflow nằm trên `main`.
- CI dùng **Node 24 / npm 11** (giống máy dev). Lockfile tạo bằng npm 11 không qua được `npm ci` của npm 10 (Node 22) — đừng hạ Node trong CI.
- Kiểm tra trước khi push (giống CI):
  ```bash
  cd Users/ntla2/Downloads/Web_LiveStream/frontend && npm ci && npm run build
  cd Users/ntla2/Downloads/Web_LiveStream/backend && npm ci && npx prisma generate && npm run build
  ```

## 4. Quy ước

- Commit: `type(scope): mô tả` (vd. `feat(live): ...`, `fix(rbac): ...`).
- Làm trên nhánh riêng + PR; **không push thẳng `main`** (push `main` = deploy production). Không dùng `Day_Code_Len_Mang.bat` (`git add .` đẩy cả rác/secret).
- Không commit `.env`, `node_modules`, `dist`, `.log`, `.bak`, `.zip`.
- Text tiếng Việt: lưu file UTF-8 (đã từng bị lỗi Mojibake).
- Thông báo UI dùng toast, không dùng `alert/confirm`.
