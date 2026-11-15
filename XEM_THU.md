# Khóa học AI lớp 4 — Bản xem thử Bài 1, 3 và 4

Làm tại `D:\Student_HCMUE\E-Learning\KhoaHocAI_A3.4`. Trước khi sửa: nhánh `main` sạch và đồng bộ `origin/main`, commit `d2256fb`. **Người dùng đã duyệt đưa Bài 3–4 lên GitHub. Chưa cập nhật Azota.**

## Mở bản xem thử

Nhấp đúp `XEM_THU.cmd`, giữ cửa sổ mở rồi vào **http://127.0.0.1:8340/khoa_hoc.html**.

Hoặc chạy tại thư mục repo:

```powershell
python -m http.server 8340 --bind 127.0.0.1
```

Nếu cổng 8340 đã được dùng, thử mở địa chỉ trên trước khi chạy thêm máy chủ. Ctrl+C để dừng. Khi còn giao diện cũ, dùng Ctrl+F5. Web tĩnh, không cần cài npm, build hoặc CDN.

| Trang | Đường dẫn khi máy chủ đang chạy |
| --- | --- |
| Mục lục mới | `http://127.0.0.1:8340/khoa_hoc.html` |
| Bài 1 — giữ nguyên | `http://127.0.0.1:8340/index.html` |
| Q1 — giữ nguyên | `http://127.0.0.1:8340/hl3_luyen_tap.html#q1` |
| Bài 3 — Khang | `http://127.0.0.1:8340/bai3_y_tuong.html` |
| Bài 4 — anh Tùng | `http://127.0.0.1:8340/bai4_cai_tien.html` |

Mục lục dành vị trí Bài 2 cho sản phẩm của Đại nhưng không gắn link cho đến khi nhóm xác nhận đúng bản. Các trang Bài 1 có thêm nút về mục lục; đường dẫn và luồng cũ giữ nguyên.

## Hai bài mới

**Bài 3 — Em thiết kế trợ lý AI cho lớp mình:** Q5 có ba bước chọn vấn đề, dữ liệu và việc AI hỗ trợ. Có tình huống mẫu chai/lon và góc sách; lựa chọn sai có giải thích để thử lại. Sau Q5, học sinh có thể chuyển thẳng sang Bài 4. Q6 là mở rộng tự chọn: sửa hoặc viết ba phần riêng, xem lại, sửa và sao chép Phiếu ý tưởng AI.

Phiếu Q5/Q6 lưu tại trình duyệt với khóa `ai4.idea.v1`, chỉ gồm ba nội dung ý tưởng. Nút làm lại Bài 3 xoá phiếu đã lưu. Không lưu được vẫn sao chép và học tiếp được. Phiếu không tự nộp; bài tự viết cần giáo viên/bạn góp ý, web không tự chấm tính khả thi của ý tưởng.

**Bài 4 — Trợ lý AI đoán nhầm ở đâu?:** mở độc lập bằng trợ lý mẫu phân loại chai/lon. Học sinh kiểm tra từng ảnh, giải thích chi tiết ở lượt sai, chọn một thay đổi rồi bấm thử lại lần lượt trên **đúng bốn ảnh cũ, cùng thứ tự**. Cuối bài xem số lượt AI đúng trước/sau và viết một lỗi, một thay đổi, một kết quả; có xem, sửa, sao chép báo cáo và làm lại từ đầu.

Đây là mô phỏng bằng gợi ý đã viết sẵn, không huấn luyện/chạy AI thật. Mẫu ban đầu đúng 2/4 ảnh. Thêm ảnh rõ nhiều góc, tên đúng → 3/4; thêm lịch học hoặc chỉ ảnh màu xanh → vẫn 2/4. Số lượt đúng được đếm từ từng gợi ý so với nhãn mẫu, **không phải điểm học sinh** và không bảo đảm kết quả của AI thật.

Bài 4 đọc phiếu Bài 3 như ngữ cảnh tuỳ chọn. Phiếu về sách/phát âm không làm bộ ảnh chai/lon thành phép thử cho chủ đề đó; trang luôn nói rõ đang kiểm tra trợ lý mẫu chai/lon. Không có phiếu, phiếu hỏng hoặc bị chặn lưu trữ vẫn làm được toàn bộ Bài 4.

## Đối chiếu kịch bản BT4.2

Chưa đọc được tài liệu được cung cấp do lỗi kết nối công cụ Google Docs và đường truy cập web/xuất văn bản. **Không xác định tài liệu bị giới hạn quyền hay không; không khẳng định bản thử khớp kịch bản.**

Đã triển khai theo yêu cầu trong cuộc trao đổi. Các mục tiêu diễn đạt, câu hỏi, đáp án, tiêu chí, bộ ảnh và kết quả mô phỏng cần nhóm duyệt. Xem [DOI_CHIEU_BT4_2.md](DOI_CHIEU_BT4_2.md) cho bảng Q5–Q7 và danh sách cần **Giang Lê Khang / Mai Văn Tùng** xác nhận. Hai bài mới chưa có đích nộp Azota; chỉ cho sao chép theo hướng dẫn giáo viên.

## Tệp thay đổi

Thêm: `khoa_hoc.html`, `bai3_y_tuong.html`, `lesson3.js`, `bai4_cai_tien.html`, `lesson4.js`, `lesson-styles.css`, năm ảnh SVG `assets/test-*.svg`, `tests/course-qa.mjs`, `DOI_CHIEU_BT4_2.md`.

Sửa: header điều hướng của bốn trang Bài 1, bổ sung kiểu nút mục lục trong `styles.css`, cập nhật `XEM_THU.cmd` và hướng dẫn này. `app.js` và `evidence-model.js` của Bài 1 không sửa.

## Kiểm thử thực tế ngày 15/11/2026

Chrome 157 headless trên Windows, desktop 1366×900 và điện thoại giả lập 390×844; bổ sung kiểm tra chiều rộng 320px. Không phải kiểm thử trên điện thoại thật/Safari.

- `tests/browser-qa.mjs`: **284 lượt xác nhận, không lỗi trình duyệt**, chạy lại toàn luồng Bài 1: quầy dịch, ảnh mờ, kéo/vuốt mô hình 3D, chọn bằng bàn phím, chạm chi tiết, ảnh thay thế khi mất WebGL, tự luyện, Q1 và clipboard thật/bị chặn.
- `tests/course-qa.mjs`: **563 lượt xác nhận, không lỗi trình duyệt**; kiểm tra điều hướng mục lục, ô chờ Bài 2, Q5 đúng/sai, đổi vấn đề xoá lựa chọn sau, Q5 sang Bài 4 không qua Q6; Q6 nhập/sửa/xem/sao chép; ký tự HTML được hiển thị như chữ; bộ nhớ hỏng/bị chặn vẫn học được.
- Bài 4: mở khi chưa làm Bài 3, nhận xét đúng/sai và lý do quan sát, thử cải tiến ảnh và lịch học, xác nhận cùng ID/đường dẫn/thứ tự của từng ảnh, cộng độc lập các lượt đúng để đối chiếu 3/4 và 2/4. Viết/sửa/sao chép báo cáo; làm lại xoá nội dung lượt trước. Phiếu Bài 3 khác chủ đề không đổi bộ ảnh mẫu.
- Clipboard được ghi và đọc thật; có kiểm tra tình huống quyền sao chép bị chặn để dùng bản sao chép thủ công. Các nút hoạt động được trên hai kích thước.
- Đã xem ảnh chụp bố cục desktop/mobile; kiểm tra tràn ngang cả các bước chọn, nhập và xem lại báo cáo. `node --check` và `git diff --check` đạt.

Kết quả chi tiết (kèm số xác nhận cuối cùng của bài mới): `.preview/test-results.json`, `.preview/course-test-results.json`; ảnh chụp `.preview/course-*.png`. Thư mục `.preview/` được Git bỏ qua.

### Chạy lại

Mở máy chủ cổng 8340. Mở Chrome QA riêng trong terminal PowerShell:

```powershell
& 'C:/Program Files/Google/Chrome/Application/chrome.exe' --headless=new --no-sandbox --in-process-gpu --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --no-first-run --remote-debugging-port=9340 --user-data-dir="$PWD/.preview/chrome-qa" about:blank
```

Chạy lần lượt trong terminal khác tại repo (Node 24):

```powershell
node tests/browser-qa.mjs
node tests/course-qa.mjs
```

Hai bộ kiểm thử dùng cùng một thẻ Chrome QA, cần chạy tuần tự. Các cờ Chrome chỉ dùng cho QA cục bộ. Học sinh mở trình duyệt bình thường. Đóng Chrome QA và dừng máy chủ khi không dùng.

## Chưa xác nhận bằng môi trường học sinh

- Độ phù hợp với mục tiêu, câu hỏi và tiêu chí chính thức của kịch bản; xem bảng đối chiếu riêng.
- Điện thoại thật, Safari/iOS, máy học sinh cấu hình khác và khung nhúng Azota.
- Nơi nộp Q5–Q7 và trạng thái nộp bài qua tài khoản học sinh. Chưa đăng nhập, sửa khoá học hoặc nộp bài Azota.
- Khi nhóm quyết định xuất bản: kiểm tra đường dẫn dưới GitHub Pages, quyền clipboard/lưu trữ trong khung nhúng. Bản thử hiện không tự gửi bài/điểm đi đâu.
