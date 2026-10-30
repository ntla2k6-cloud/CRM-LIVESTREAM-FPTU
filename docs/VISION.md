# Tầm nhìn hệ thống CRM "Uống Gì Chưa?" — Livestream Tuyển sinh FPTU

> Định hướng chiến lược do chủ dự án cung cấp (2026-10-30). Mọi tính năng mới phải phục vụ ít nhất một trụ cột bên dưới.

## I. Bản chất

Social CRM chuyên cho tuyển sinh đại học (Gen Z): biến buổi TikTok LIVE từ truyền thông một chiều thành **cỗ máy tự động thu thập và chuyển đổi thí sinh theo thời gian thực** (End-to-End Live Admission Engine).

Bài toán gốc:
- **Dữ liệu trôi mất**: comment, SĐT thí sinh để lại bị trôi; phải tua video nhặt tay.
- **Minigame thiếu minh bạch**: MC không biết ai trả lời đúng trước giữa hàng trăm comment/giây.
- **Đứt gãy chăm sóc**: người trúng quà / đặt câu hỏi không được liên hệ kịp.

## II. 4 nguyên lý

1. **Real-time first** — mọi comment, đáp án, SĐT hiện trên màn hình MC và CSKH với độ trễ < 1 giây; CSKH gọi ngay khi live còn đang diễn ra.
2. **Tự động bóc tách** — tự gắn nhãn: hỏi học phí, hỏi ngành (AI, CNTT, Thiết kế đồ họa…), lead nóng (có SĐT/Zalo), đáp án minigame, spam.
3. **Gamification làm phễu** — minigame nhận quà (balo, áo, bình nước); muốn nhận quà phải điền Họ tên, SĐT, Trường THPT, Ngành quan tâm → thành lead chất lượng cao.
4. **Khép kín vòng đời** — `Comment TikTok → Trúng minigame / Đặt câu hỏi → Lead CRM → Đơn gửi quà (Viettel Post/GHTK) → CSKH chăm sóc → Nộp hồ sơ nhập học`.

## III. 5 trụ cột chức năng

```
[1. STUDIO & CA KÍP] → [2. EXTENSION INGESTION] → [3. BỘ NÃO PHÂN LOẠI]
                                                          ↓
[5. TELESALE PIPELINE] ← [4. FULFILLMENT & QUÀ TẶNG] ←────┘
```

| # | Trụ cột | Nội dung | Code liên quan |
|---|---|---|---|
| 1 | Studio & Live Operations | Lịch phát sóng, kịch bản timeline cho MC; xếp ca, tính công, phân công (MC, kỹ thuật, điều phối, CSKH) | `frontend/src/app/schedule`, `backend/src/shift` |
| 2 | Realtime Ingestion | Chrome Extension đọc comment trên Chrome thật (tránh TikTok chặn bot/IP), lọc thông báo hệ thống, chống trùng, đẩy về CRM | `extension/`, `POST /live-engine/extension-comments` |
| 3 | Minigame & phân loại | MC kích hoạt câu hỏi → đếm ngược 30s → chấm đúng/sai từ comment → xếp hạng theo mili-giây; tách SĐT, phân loại ý định | `backend/src/comment-engine` (pipeline, classifier, quiz) |
| 4 | Fulfillment & quà | Tồn kho quà, tạo vận đơn, theo dõi giao hàng | `inventory`, `tracking`, `claim`, `backend/src/order`, `gift` |
| 5 | Lead pipeline & CSKH | Kanban: Mới → Đã liên hệ → Đang tư vấn → Đã nộp hồ sơ → Đã nhập học; lịch sử gọi/Zalo, trường THPT | `frontend/src/app/cskh`, `backend/src/lead` |

## IV. Đích đến

1. **Hiệu quả tuyển sinh** — thất thoát SĐT/thí sinh tiềm năng về 0%; thời gian từ lúc hỏi đến lúc được tư vấn rút xuống trong buổi live hoặc sáng hôm sau; đo được ROI (chi phí quà + nhân sự ↔ số hồ sơ nhập học).
2. **Vận hành** — số hóa 100% (bỏ Excel/sổ tay); MC/CSKH mới mở CRM là biết nói gì, ai trúng quà, cần gọi ai.
3. **Dữ liệu** — thống kê từ hàng trăm nghìn comment: ngành nào được hỏi nhiều, tỉnh nào quan tâm, phụ huynh lo gì (học phí, việc làm, học bổng, KTX) → điều chỉnh thông điệp tuyển sinh.
