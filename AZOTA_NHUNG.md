# Xem thử hoạt động độc lập trong iframe Azota

Trước khi sửa: Git sạch trên `main`, commit `e27f98f`. Không có `A34-tach-hoat-dong-Azota.patch` hoặc `azota-embed.js` trong repo; đã thêm helper mới. Người dùng đã duyệt đưa bản hỗ trợ nhúng lên GitHub; chưa sửa khoá Azota.

## Mở bản thử

Chạy `XEM_THU.cmd` hoặc `python -m http.server 8340 --bind 127.0.0.1` tại repo.

- Khung desktop cao 540 px: http://127.0.0.1:8340/azota-preview.html
- URL cũ không có tham số trong iframe: http://127.0.0.1:8340/azota-preview.html?legacy=1
- Nút “Đổi desktop / điện thoại” giới hạn khung về 390 px; iframe vẫn cao 540 px và tự cuộn.
- Mở rộng riêng hoạt động: http://127.0.0.1:8340/hl1_kham_pha.html?embed=azota
- Web trực tiếp với điều hướng cũ: http://127.0.0.1:8340/khoa_hoc.html

Chọn hoạt động ở ô đầu trang thử để kiểm tra ảnh mờ, tự luyện, Bài 3 và Bài 4. Đây là **khung thử cục bộ, không phải iframe thật của Azota**.

## Cách hoạt động

`azota-embed.js` chạy trước mã bài học. Khi có `?embed=azota` hoặc trang nằm trong iframe, nó bật bố cục gọn và chặn liên kết sang trang/bài khác, kể cả liên kết được tạo sau khi thao tác. Liên kết hash trong cùng trang (như tự luyện → Q1) và nút chuyển bước vẫn dùng được. Khi mở trực tiếp không có tham số, giao diện/điều hướng cũ giữ nguyên.

Nút “Mở rộng hoạt động ↗” là liên kết tab mới đến đúng pathname, tham số và hash hiện tại, thêm `embed=azota`; tab mới vẫn ẩn điều hướng sang bài khác. Nó mở lại hoạt động, không mang các lựa chọn chưa lưu của lượt trong iframe sang tab mới. Không truy cập DOM cha, không gửi yêu cầu đổi chiều cao khung, không dùng thư viện mạng.

Bài 4 bỏ qua hoàn toàn việc đọc phiếu Bài 3 trong chế độ nhúng. Các màn có bài nộp nhắc chọn đúng mục Q1/Q5/Q7 trên Azota; điểm chính thức do Azota ghi nhận, không phải điểm web tự gửi.

## File sửa và thêm

- Thêm `azota-embed.js`, `azota-embed.css`, `azota-preview.html`, `tests/embed-qa.mjs`, hướng dẫn này.
- Năm trang hoạt động tải helper và CSS: `hl1_kham_pha.html`, `hl2_mo_phong.html`, `hl3_luyen_tap.html`, `bai3_y_tuong.html`, `bai4_cai_tien.html`.
- `app.js`: hiệu ứng đúng nhẹ trong chế độ nhúng.
- `lesson4.js`: không đọc phiếu Bài 3 khi nhúng.
- `tests/course-qa.mjs`: chờ trang điều hướng tải xong trước kiểm tra nút mục lục.
- Bài của Đại không sửa, không thêm link mới.

## Kiểm thử

Chạy tuần tự với HTTP 8340 và Chrome QA CDP 9340 như hướng dẫn `XEM_THU.md`:

```
node tests/browser-qa.mjs
node tests/course-qa.mjs
node tests/embed-qa.mjs
```

Hai bộ cũ đã chạy lại đạt: Bài 1 có 284 xác nhận, Bài 3–4 có 162 xác nhận, không lỗi trình duyệt. Bộ nhúng kiểm tra desktop 1000×540 và điện thoại 390×540, cả query và URL cũ; vị trí ba thẻ/nút Thử dịch nằm trong 540 px; chọn đúng/sai, làm lại, xoay mô hình, tìm chi tiết, Q5 hai ý tưởng, Q6 bốn ô, sáu lượt T1–T6 và báo cáo Q7; kiểm tra chặn chuyển trang và tab mở rộng giữ chế độ độc lập. Kết quả cuối: `.preview/embed-test-results.json`.

Ảnh chụp khung: `.preview/embed-desktop-before.png`, `embed-desktop-after.png`, `embed-mobile-before.png`, `embed-mobile-after.png`. Xem thử đã không thay đổi chiều cao iframe.

## Còn cần xác nhận trên Azota thật

Không mở được khoá Azota bằng công cụ web; không có phiên điều khiển trình duyệt Azota đã đăng nhập. Vì vậy **chưa xác nhận nút mở rộng trong iframe thật của Azota**. Kiểm thử tab mới hiện chỉ thực hiện ở iframe cục bộ.

Khi duyệt bằng tài khoản có quyền xem khoá học, bấm nút ngay trong khung thật và xác nhận tab mới mở đúng hoạt động, vẫn không có liên kết sang bài khác. Nếu iframe Azota có `sandbox`, nó phải cho phép mở popup/tab mới (ví dụ `allow-popups`); mã trong trang con không thể tự cấp quyền hoặc vượt chính sách đó. Cần kiểm tra thêm trên điện thoại thật và trình duyệt học sinh. Không cần và không tự thay đổi khoá Azota trong lượt sửa này.
