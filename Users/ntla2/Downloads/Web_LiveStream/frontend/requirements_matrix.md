# Yêu cầu Hệ thống Phân tích & Điều khiển TikTok LIVE (PRD)

Tài liệu này tổng hợp các yêu cầu nghiệp vụ từ anh Dũng và chị Uyên, đối chiếu với tiến độ hiện tại của hệ thống FPTU Live CRM.

## 1. Quản lý Luồng Comment (Real-time)
* **Yêu cầu:** Lấy Username/User ID, nội dung, timestamp. Hiển thị real-time, có tìm kiếm/lọc. Thu toàn bộ comment tự động.
* **Hiện trạng:** Đã có giao diện luồng comment real-time (tab "Luồng Comment").
* **Cần làm:** 
  - Tích hợp bộ lọc (Filter) và thanh tìm kiếm comment trong phòng Live.
  - Tích hợp API TikTok thật (hoặc tool crawl) để lấy Data thay vì giả lập.

## 2. Phân tích Câu hỏi & Nhu cầu (Keyword / FAQ Analysis)
* **Yêu cầu:** Tự nhận diện keyword (ngành học, học phí, học bổng...). Gom nhóm comment tương tự, đếm số lần xuất hiện.
* **Hiện trạng:** Đã có tab "Q&A đã ghim" để thao tác thủ công.
* **Cần làm:** 
  - Tích hợp AI (hoặc Keyword Matching) để tự động gắn tag comment (VD: `#HocPhi`, `#HocBong`).
  - Hiển thị Widget đếm Keyword đang hot nhất ngay trên màn hình Live để VJ biết đường trả lời.

## 3. Bắt Lead & Ưu tiên (Lead Prioritization)
* **Yêu cầu:** Đánh dấu comment có ý định (intent) cao (xin tư vấn, cho SĐT). Phân loại mức độ ưu tiên, theo dõi trạng thái chưa/đã xử lý.
* **Hiện trạng:** Đã làm bộ lọc tự động bắt SĐT và ném sang tab "Nhắc việc CSKH Real-time", có nút đổi trạng thái (Chưa gọi / Đã xử lý).
* **Cần làm:** 
  - Nâng cấp AI để bắt các câu "muốn đăng ký", "inbox em" dù KHÔNG CÓ số điện thoại.
  - Phân loại độ nóng (Hot, Warm, Cold).

## 4. Quản lý Minigame & Winner
* **Yêu cầu:** Nhập thời gian mở/đóng, cú pháp, đáp án. Tự động soi comment đúng cú pháp, đúng đáp án, trong thời gian. Xếp hạng nhanh nhất. Hiển thị Backup Winner. Đếm số lần user đã từng trúng quà.
* **Hiện trạng:** Đã có cơ chế bấm "Bắt đầu", đếm ngược timer, tự động dò chuỗi đáp án đúng, tự xếp hạng tốc độ mili-giây.
* **Cần làm:** 
  - Kiểm tra điều kiện "Cú pháp" (VD: `[Mã CH] [Đáp án]`).
  - Thêm danh sách "Dự bị" (Backup Winner).
  - Tra cứu lịch sử trúng quà của user đó trong Database.

## 5. Thống kê Hiệu quả (Timeline & Post-LIVE Report)
* **Yêu cầu:** Đo lường comment/viewer theo timeline kịch bản (Opening, Q&A, Minigame...). Báo cáo tổng kết sau Live (top câu hỏi, top keyword, số lead...).
* **Hiện trạng:** Có file kịch bản text, nhưng chưa map với timeline.
* **Cần làm:** 
  - Xây dựng giao diện **Dashboard Tổng Kết Phiên Live (Post-Live Report)** (biểu đồ line chart lượng tương tác theo từng mốc kịch bản).
  - Tính toán số liệu tổng (Total Leads, Total Viewers, Engagement Rate).
