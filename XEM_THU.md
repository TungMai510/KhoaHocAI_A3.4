# Bản xem thử A3.4 — Thám tử AI quanh em

Đã nâng cấp tại `D:\Student_HCMUE\E-Learning\KhoaHocAI_A3.4`.
Git ban đầu: nhánh `main`, theo dõi `origin/main`, không có thay đổi cục bộ; commit gốc `1780992`.
Chưa commit, push GitHub hay cập nhật Azota.

## Mở bản xem thử

Nhấp đúp `XEM_THU.cmd`, giữ cửa sổ đó mở rồi truy cập **http://127.0.0.1:8340/**.
Hoặc chạy trong terminal VS Code tại thư mục này:

```powershell
python -m http.server 8340 --bind 127.0.0.1
```

Nếu báo cổng đã được dùng, thử mở địa chỉ trên; hoặc đổi `8340` thành `8341` trong lệnh và địa chỉ. Nhấn Ctrl+C để dừng máy chủ.
Web tĩnh, không cần npm hay bước build. Nên xem qua HTTP để kiểm tra sao chép đúng hành vi của trình duyệt.

## Luồng đã triển khai

- `index.html`: trang nhận nhiệm vụ với một nút bắt đầu chính.
- `hl1_kham_pha.html`: hai tình huống dịch câu và phân loại chai/lon. Mỗi tình huống nêu thông tin đầu vào, việc AI hỗ trợ và cách kiểm tra kết quả; có câu hỏi và phản hồi ngay.
- `hl2_mo_phong.html`: dự đoán trước khi mở gợi ý, xem ảnh mờ rồi ảnh rõ của cùng chiếc lon, so sánh cả hai dự đoán của học sinh và hai gợi ý mô phỏng, giải thích các chi tiết gây nhầm, trả lời câu hỏi kiểm tra gợi ý AI; có nút làm lại.
- `hl3_luyen_tap.html`: giữ 4 câu hỏi gốc, hiển thị lần lượt, giải thích riêng cho từng lựa chọn, có điểm và nút làm lại. Phần `#q1` chứa hai ô viết ví dụ, sao chép và mở Azota. Có thể vào Q1 trực tiếp từ thanh tiến trình.

Thanh tiến trình thể hiện **vị trí đang học**, không xác nhận đã nộp Q1. Dữ liệu nhập và điểm chỉ tồn tại trong trang đang mở; không tự gửi hoặc lưu điểm sang Azota.

## Tệp thay đổi

Sửa 4 trang HTML nêu trên, giữ nguyên tên và đường dẫn.

Thêm:

- `styles.css`: giao diện chung và bố cục responsive.
- `app.js`: điều hướng tiến trình, khám phá, mô phỏng, tự luyện, sao chép.
- `assets/can.svg`: hình minh hoạ chiếc lon, dùng chung cho ảnh mờ và rõ.
- `assets/favicon.svg`: biểu tượng kính lúp.
- `.gitignore`: bỏ qua dữ liệu kiểm thử, hồ sơ trình duyệt và node_modules.
- `XEM_THU.cmd`, `XEM_THU.md`: mở bản xem thử và hướng dẫn.
- `tests/browser-qa.mjs`: kịch bản kiểm thử Chrome qua CDP, dùng Node.js có WebSocket tích hợp.

## Kiểm thử thực tế ngày 15/11/2026

Chrome 157 headless trên Windows, kích thước desktop **1366×900** và giả lập điện thoại **390×844**. Tổng cộng **228 lượt xác nhận tự động**, gồm kiểm tra nút có thể thao tác, trạng thái và kết quả. Không ghi nhận lỗi JavaScript hoặc lỗi tải tài nguyên trong lần chạy hoàn tất.

- Đi hết luồng từ trang đầu → hai tình huống khám phá → ảnh mờ → ảnh rõ → giải thích → 4 câu tự luyện → Q1.
- Thử đúng/sai ở cả hai tình huống; thử tất cả 3 lựa chọn của từng câu tự luyện và từng lựa chọn câu hỏi giải thích ảnh mờ.
- Xác nhận không mở được gợi ý AI trước khi dự đoán; vòng ảnh rõ yêu cầu dự đoán mới; so sánh giữ đúng lựa chọn của học sinh.
- Làm lại thử thách xoá cả hai lượt, ẩn so sánh và đưa ảnh về trạng thái mờ.
- Làm lại tự luyện xoá câu trả lời, phản hồi và điểm. Tính điểm đúng **4/4** và **0/4**. Đi Q1 rồi quay lại vẫn xem được kết quả; có thể luyện lại tiếp.
- Q1 bỏ trống có hướng dẫn điền đủ hai ví dụ. Sao chép thành công và đọc lại clipboard để xác nhận đủ cả hai câu trả lời thực tế.
- Chủ động mô phỏng quyền sao chép bị từ chối: hiện nội dung và chọn sẵn để sao chép thủ công.
- Bấm Mở Azota tạo thẻ mới với URL `https://azota.vn/vi/khoa-hoc/ireehs`.
- Kiểm tra link trực tiếp `hl3_luyen_tap.html#q1` và quay lại bài luyện chưa làm.
- Cả 4 trang và phần Q1 không tràn ngang tại desktop/mobile; nút hành động và thanh tiến trình cao ít nhất 44px. Thêm một kiểm tra không tràn ngang ở trang thử thách tại chiều rộng 320px.
- Đã xem ảnh chụp desktop/mobile để rà bố cục. `node --check app.js` và `git diff --check` đạt.

Kết quả chi tiết nằm trong `.preview/test-results.json`; ảnh chụp nằm trong `.preview/` (các tệp này chỉ dùng cục bộ, Git bỏ qua).
Kịch bản `tests/browser-qa.mjs` cần máy chủ cổng 8340 và Chrome kiểm thử riêng mở CDP cổng 9340, sau đó chạy `node tests/browser-qa.mjs`.

Đây là kiểm thử trình duyệt với kích thước giả lập điện thoại, chưa phải kiểm thử trên thiết bị điện thoại thật, Safari hoặc bên trong khung nhúng Azota.

## Cần tài khoản học sinh để xác nhận trên Azota

1. Đăng nhập và truy cập được khoá học từ link đã cung cấp.
2. Xác nhận đúng bài Q1 được giao, còn hạn và có ô nhận câu trả lời bằng văn bản.
3. Dán đủ hai ví dụ, bấm nộp và kiểm tra trạng thái nộp thành công bằng tài khoản học sinh.
4. Nếu nhúng web: kiểm tra cả 4 đường dẫn sau khi tải lên GitHub, cuộn trang trong khung nhúng và quyền clipboard trên máy/trình duyệt học sinh. Khi clipboard bị chặn, dùng hướng dẫn sao chép thủ công.

Chưa đăng nhập, chỉnh sửa khoá học hoặc nộp bài trên Azota. Nút mở Azota chỉ mở khoá học, không tự đánh dấu đã nộp.
