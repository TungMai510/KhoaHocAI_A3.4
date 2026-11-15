# Bàn điều tra của Thám tử AI — Bản xem thử cục bộ

Đã sửa trong `D:\Student_HCMUE\E-Learning\KhoaHocAI_A3.4`. Trước khi sửa, Git sạch, nhánh `main` đồng bộ `origin/main`, commit `2001ee1`. Bản nâng cấp đã được người dùng duyệt để đưa lên GitHub. **Chưa cập nhật Azota**.

## Mở để duyệt

Mở **http://127.0.0.1:8340/** khi máy chủ đang chạy. Có thể cần Ctrl+F5 để bỏ cache bản trước.

Nếu chưa chạy, nhấp đúp `XEM_THU.cmd`, hoặc chạy tại thư mục repo:

```powershell
python -m http.server 8340 --bind 127.0.0.1
```

Giữ terminal mở, vào địa chỉ trên; Ctrl+C để dừng máy chủ. Nếu cổng 8340 đã được dùng, thử mở địa chỉ trước khi chạy thêm máy chủ. Web không cần npm, build hay CDN.

- Trang đầu: `http://127.0.0.1:8340/`
- Quầy của Sóc: `http://127.0.0.1:8340/hl1_kham_pha.html`
- Vật chứng 3D: `http://127.0.0.1:8340/hl2_mo_phong.html`
- Thử ảnh thay thế: `http://127.0.0.1:8340/hl2_mo_phong.html?view=2d`
- Q1 trực tiếp: `http://127.0.0.1:8340/hl3_luyen_tap.html#q1`

## Những gì đã đổi

- Giao diện bàn điều tra: nền kem ấm, xanh lá, vàng; Sóc và đồ vật minh hoạ riêng bằng SVG. Có quầy món ăn, ảnh vật chứng trên bàn, mô hình lớn ở trung tâm và hướng dẫn ngắn theo từng trạng thái.
- **Quầy Sóc:** chọn một trong ba thẻ tiếng Anh; bấm Thử dịch mới thấy bản dịch có sẵn; chọn hình để kiểm tra. Sai được gợi ý thử lại; đúng nhận câu chốt. Đổi câu xoá cả kết quả lẫn trạng thái trước đó.
- **Vật chứng:** dự đoán trước rồi mới hiện AI mô phỏng gợi ý “Chai”, không giải thích sớm. Xin thêm manh mối mở mô hình WebGL thật. Kéo hoặc vuốt ngang để xoay; nút mũi tên thay góc nhìn. Chạm chi tiết chưa đủ rõ được gợi ý; tìm đúng chi tiết trên nắp mới mở bước chốt chai/lon. Chỉ khi chốt lon mới giải thích khoen kéo và đối chiếu với gợi ý ban đầu.
- **Ảnh thay thế:** tự mở nếu WebGL không có hoặc bị mất; có nút chuyển thủ công. Ảnh có vùng chạm trên nắp, thân, đáy và nút chọn tương đương bằng bàn phím. Vẫn hoàn thành được cả nhiệm vụ.
- **Tự luyện:** hai tình huống mới (AI hỗ trợ phát âm; kiểm tra gợi ý nhận diện cây). Mỗi lựa chọn có giải thích ngay; có điểm /2 và làm lại.
- **Q1:** giữ hai ô viết ứng dụng AI trong học tập/đời sống kèm việc hỗ trợ, sao chép và link Azota. Không tự gửi điểm hoặc bài sang Azota.

Tên cả bốn trang HTML và đường dẫn `hl3_luyen_tap.html#q1` giữ nguyên. Thanh tiến trình cho biết vị trí trong bài, không xác nhận đã nộp Q1.

## Các file sửa / thêm

Sửa: `index.html`, `hl1_kham_pha.html`, `hl2_mo_phong.html`, `hl3_luyen_tap.html`, `styles.css`, `app.js`, `tests/browser-qa.mjs`, `XEM_THU.md`.

Thêm: `evidence-model.js`, `assets/squirrel.svg`, `assets/apple.svg`, `assets/banana.svg`, `assets/milk.svg`, `assets/detective-desk.svg`.

Mô hình dựng bằng WebGL trực tiếp, không tải thư viện bên ngoài; chỉ vẽ lại khi xoay hoặc đổi kích thước. Hình ảnh SVG dùng cục bộ, không cần kết nối dịch vụ AI.

## Kiểm thử thực tế 15/11/2026

Chrome 157 headless trên Windows, WebGL qua SwiftShader. Kích thước desktop **1366×900** và điện thoại giả lập **390×844**. Kịch bản `tests/browser-qa.mjs` đã chạy hoàn tất **284 lượt xác nhận** (bao gồm kiểm tra từng nút thao tác và trạng thái). Không ghi nhận lỗi JavaScript/lỗi tải tài nguyên. Đã xem ảnh chụp để rà bố cục.

- Đi từ trang đầu qua quầy Sóc, vật chứng, tự luyện đến Q1.
- Thử đủ ba câu dịch; chọn sai/đúng từng món; đổi câu đặt lại hoàn toàn; bản dịch không hiện khi chỉ chọn thẻ.
- Không tiết lộ khoen kéo hoặc lời giải lúc AI gợi ý từ ảnh mờ. Kiểm tra lại với cả dự đoán Lon, Chai và Chưa chắc qua các lượt.
- Mô hình thực sự tạo WebGL ở cả hai kích thước. Dùng sự kiện chuột kéo và sự kiện cảm ứng vuốt, xác nhận góc xoay thay đổi. Phím mũi tên cũng xoay được mô hình.
- **Chạm/nhấp đúng vị trí chi tiết trên mô hình 3D** thực sự mở bước chốt; không chỉ gọi hàm chọn trong mã.
- **Vuốt dọc bắt đầu trên mô hình thực sự cuộn được trang điện thoại.**
- Chuyển thủ công 3D → ảnh → 3D. Chủ động làm mất context WebGL: trang tự chuyển ảnh và vẫn hoàn thành bằng bàn phím.
- Ép ảnh thay thế bằng `?view=2d`: chọn vùng thân để xem gợi ý sai, chọn vùng chi tiết trên nắp, chốt lon; hoàn thành lại bằng bàn phím. Thử cả kết luận sai và đúng.
- Làm lại toàn bộ thử thách khôi phục ảnh mờ, xoá gợi ý, manh mối, kết luận và lời giải cũ.
- Thử cả ba lựa chọn của hai tình huống tự luyện, điểm 2/2 và 0/2, làm lại. Sang Q1 rồi quay lại vẫn giữ kết quả của lần đang mở.
- Q1 trống được nhắc điền hai ví dụ. Sao chép và đọc clipboard thật để xác nhận đủ hai câu trả lời. Mô phỏng quyền bị chặn: hiện nội dung được chọn sẵn để sao chép thủ công. Kiểm tra đúng URL Azota và mở thẻ mới.
- Cả bốn trang và Q1 không tràn ngang ở desktop/mobile; nút thấy được cao ít nhất 44px ở bước đầu. Kiểm tra thêm chiều rộng 320px cho trang đầu, quầy, ảnh mờ và Q1.
- `node --check` đạt cho `app.js`, `evidence-model.js`, `tests/browser-qa.mjs`; `git diff --check` đạt.

Chi tiết: `.preview/test-results.json`. Ảnh: `.preview/desktop-home.png`, `mobile-home.png`, `mobile-food-start.png`, `mobile-blur-start.png`, `desktop-3d.png`, `mobile-3d.png`, cùng các ảnh kết quả khác. `.preview/` được Git bỏ qua.

### Chạy lại kịch bản

Chạy máy chủ cổng 8340. Mở Chrome kiểm thử riêng bằng PowerShell (profile cục bộ; không dùng profile tài khoản cá nhân):

```powershell
& 'C:/Program Files/Google/Chrome/Application/chrome.exe' --headless=new --no-sandbox --in-process-gpu --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --no-first-run --remote-debugging-port=9340 --user-data-dir="$PWD/.preview/chrome-qa" about:blank
```

Trong terminal khác, tại repo: `node tests/browser-qa.mjs` (Node 24). Đóng Chrome kiểm thử sau khi chạy. Các cờ phần mềm ở trên chỉ phục vụ QA; học sinh xem bằng trình duyệt bình thường, không cần các cờ này.

## Những gì còn cần kiểm tra thực tế

- Điện thoại thật, đặc biệt Safari/iOS và khả năng WebGL trên máy học sinh. Kiểm thử hiện tại là Chrome giả lập kích thước/cảm ứng, không thay thế thiết bị thật.
- Dùng tài khoản học sinh Azota để xác nhận vào được khoá học, bài Q1 được giao và còn hạn, dán đủ hai ví dụ, nộp và thấy trạng thái thành công.
- Khi quyết định xuất bản: kiểm tra các đường dẫn tài nguyên dưới GitHub Pages và hành vi cuộn/clipboard trong khung nhúng Azota. Dùng sao chép thủ công khi khung nhúng chặn clipboard.

Chưa đăng nhập hoặc thay đổi khoá học Azota. Nội dung nhập và điểm chỉ tồn tại trong trang đang mở, không tự lưu sau khi tải lại.
