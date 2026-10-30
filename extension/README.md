# FPTU LIVE Capture — Chrome Extension

Đọc comment TikTok LIVE ngay trên Chrome của người vận hành (TikTok không chặn như khi server tự kết nối) và đẩy realtime về CRM.

```
TikTok LIVE (Chrome) → content.js (đọc khung chat, lọc rác, chống trùng)
  → background.js (gom lô 2s/lần, tự thử lại khi lỗi mạng)
  → POST {backend}/live-engine/extension-comments
  → backend comment-engine: lưu LiveComment → phân loại → Lead / Minigame / Dashboard
```

## Cài đặt (1 lần)
1. Mở `chrome://extensions`, bật **Developer mode**.
2. **Load unpacked** → chọn thư mục `extension/` của repo.
3. Ghim icon extension lên thanh công cụ.

## Dùng trong buổi live
1. Mở trang TikTok LIVE của trường trên Chrome (`tiktok.com/@.../live`).
2. Bấm icon extension → **BẮT ĐẦU THU THẬP**. Ô nhập có thể:
   - **để trống** → dùng link của tab TikTok đang mở,
   - dán **link TikTok LIVE**, hoặc
   - dán **link/ID phiên trên CRM** (`.../live/<id>`) nếu muốn ghi vào một phiên đã lên lịch.
   Với link TikTok, CRM tự dùng phiên đang diễn ra của tài khoản đó (trong 12h gần nhất) hoặc tự tạo phiên mới. Popup hiện "Đang ghi vào phiên CRM: …".
3. "Đã bắt" = comment đọc được, "Đã gửi" = CRM đã nhận. Dòng đỏ = lỗi (server Render đang khởi động…), extension tự thử lại.
4. **RESET** (bấm 2 lần để xác nhận): dừng, đưa số đếm về 0, xóa comment chưa gửi và phiên đang chọn. Tạm dừng rồi bắt đầu lại thì số đếm được giữ nguyên.

Mặc định gửi về `https://crm-livestream-fptu.onrender.com`. Đổi trong **Cài đặt server CRM** (vd. `http://localhost:3001` khi chạy local).

## CRM làm gì với comment
| Comment | Kết quả |
|---|---|
| Có SĐT (`0912345678`, `091 234 5678`, `+84…`) | Lead nóng (điểm ≥ 80), SĐT lưu vào hồ sơ khách |
| "tư vấn", "zalo", "đăng ký"… | Lead |
| Hỏi học phí, xét tuyển, KTX, ngành | Lead mức quan tâm (ADMISSION), ghi nhận ngành quan tâm |
| `A`, `1A`, `1.A` | Đáp án minigame |
| Link | Spam |

Lead hiện ở trang **CSKH** với nguồn = tên phiên live, kèm lịch sử comment.

## Lưu ý
- TikTok hay đổi giao diện. Nếu "Đã bắt" đứng yên dù chat đang chạy → cập nhật selector trong `content.js` (`COMMENT_SELECTOR`, `USERNAME_SELECTORS`, `TEXT_SELECTORS`).
- Khi TikTok không có link profile trong dòng chat, tài khoản = tên hiển thị.
