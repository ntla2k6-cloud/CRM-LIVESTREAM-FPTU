# Kế hoạch Tái cấu trúc Kiến trúc Hệ thống CRM-LIVESTREAM-FPTU

Dựa trên yêu cầu cực kỳ chính xác và mang tầm nhìn của một Product Owner/Tech Lead, kiến trúc hiện tại gồm 7 module rời rạc sẽ được đập đi xây lại thành một **Data Pipeline duy nhất và xuyên suốt**. 

## 1. Cấu trúc Database (Prisma Schema Updates)

Sự thay đổi cốt lõi nhất nằm ở Database, mọi dữ liệu phải có quan hệ ràng buộc (Relation) chặt chẽ với nhau:

- **LiveSession (Schedule & Live)**: Gộp chung `Shift` và `LiveSession` làm 1 Entity duy nhất. Một buổi Live sẽ chứa thông tin: `Ngày, Giờ, MC, Mod, CSKH, Camera` (Quan hệ n-n với bảng `Staff`).
- **Customer (TikTok User)**: Bất kỳ ai comment sẽ được định danh tại đây.
- **Comment Engine**: Bảng `LiveComment` sẽ hứng dữ liệu realtime.
- **Quiz & Answer (Winner)**: `Answer` sẽ lưu `responseSpeed` (timestamp) để chống race-condition. Sẽ thêm bảng `Winner` (hoặc cờ `isWinner` trong `Answer`) liên kết trực tiếp với bảng `Order/Shipment`.
- **Lead & CSKH (CRM)**: Thêm bảng `LeadHistory` (Lịch sử chăm sóc) liên kết n-1 với `Lead`. Mỗi hành động (Gọi, Gửi Zalo, Phản hồi) đều sinh ra 1 record log lại thời gian thực. Bổ sung các trường chi tiết cho Lead (Trường, Lớp, Khu vực, Ngành, Nguồn).
- **Inventory & Tracking**: Bảng `Order` (Đơn quà) sẽ đổi thành `Shipment` và bắt buộc Foreign Key tới `Winner/Customer` và `Gift`. Có đầy đủ 6 trạng thái State Machine (Nhập kho -> Đã giữ -> Đã trao -> Đã đóng gói -> Đã gửi -> Đã giao). 

## 2. Lộ trình triển khai (Implementation Pipeline)

### Phase 1: Core Engine & Realtime (/live)
- Viết lại module Socket.IO / TikTok Live Connector trên Backend.
- **Chống Race Condition**: Khi nhận comment, lập tức dập Timestamp tại Backend Queue (không dùng Timestamp của Frontend).
- **Thuật toán Winner**: Filter comment đúng cú pháp (VD: `1.A`, `1A`, `A`) -> Loại bỏ duplicate username -> Sort theo server-timestamp -> Chọn Top 1/Top 3. Lưu vào DB với cờ `VALID`, `DUPLICATE`, `INVALID`.

### Phase 2: CRM Thực thụ (/cskh)
- Thay thế mảng tĩnh bằng bảng `Lead` và `LeadHistory`.
- Pipeline trạng thái chuẩn (New -> Đã liên hệ -> Đang tư vấn -> Đã đăng ký -> Không quan tâm).
- Mỗi thao tác trên giao diện sinh ra 1 log trong Lịch sử chăm sóc với timestamp.

### Phase 3: Xâu chuỗi Kho & Vận chuyển (/inventory & /tracking)
- Cập nhật luồng tạo Đơn: Chỉ được tạo Đơn khi có ID của `Winner`.
- Giao diện tra cứu (`/tracking`): Mở tính năng tra cứu bằng TikTok Username -> Trích xuất Customer -> Trích xuất Shipment -> Hiển thị Timeline & Mã Vận Đơn thực tế.

### Phase 4: Business Analytics (/analytics)
- Thay thế Dashboard hiện tại bằng Query Aggregation phức tạp.
- Tính toán Cost/Lead (CPL), Cost/Conversion (CPC) dựa trên Budget của LiveSession.
- Tracking phễu chuyển đổi: Viewers -> Engagements -> Leads -> Conversions.

## 3. Review Required
- **Quyết định về TikTok Connector**: Hiện tại `tiktok-live-connector` bản miễn phí có thể bị delay vài giây. Nếu muốn *tuyệt đối Realtime*, chúng ta có cần giải pháp Webhook / Private API không?
- **Workflow CSKH**: Telesale sẽ nhập trực tiếp kết quả cuộc gọi trên hệ thống này, hay đẩy qua một hệ thống Call Center bên thứ ba (như Stringee)? 

---
*Vui lòng duyệt qua Blueprint này, nếu bạn đồng ý với hướng kiến trúc, chúng ta sẽ bắt đầu đập đi xây lại từng module, khởi đầu bằng việc cập nhật Prisma Schema và Core Engine cho `/live`.*
