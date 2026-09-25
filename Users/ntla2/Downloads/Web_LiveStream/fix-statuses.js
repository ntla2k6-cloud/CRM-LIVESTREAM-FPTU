const fs = require('fs');

const path = 'frontend/src/app/inventory/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace order statuses array
content = content.replace(
  /\{\["Chưa đóng gói", "Đã đóng gói", "Đã chuyển tới đơn vị vận chuyển", "Đơn vị đang vận chuyển", "Hoàn tất", "Hoàn hàng"\]\.map\(s =>/g,
  '{["Đã tạo đơn", "Đang lấy hàng", "Đang vận chuyển", "Đang giao", "Đã giao", "Giao chưa thành công"].map(s =>'
);

content = content.replace(
  /\{\["Đã tiếp nhận", "Đã xử lý", "Đang vận chuyển", "Đã giao"\]\.map\(s =>/g,
  '{["Đã tạo đơn", "Đang lấy hàng", "Đang vận chuyển", "Đang giao", "Đã giao", "Giao chưa thành công"].map(s =>'
);

content = content.replace(
  /\{\["Tất cả", "Chưa đóng gói", "Đã đóng gói", "Đã chuyển tới đơn vị vận chuyển", "Đơn vị đang vận chuyển", "Hoàn tất", "Hoàn hàng"\]\.map\(\(filter\) =>/g,
  '{["Tất cả", "Đã tạo đơn", "Đang lấy hàng", "Đang vận chuyển", "Đang giao", "Đã giao", "Giao chưa thành công"].map((filter) =>'
);

fs.writeFileSync(path, content);
console.log('Done!');
