# Bài 2 – Em tập cho máy phân loại ảnh

**Phụ trách** Nguyễn Minh Đại. Tên trong BT4.1 §3.2 và BT4.2 §3.2. Học liệu tương tác hiện mang tên “Vườn học của Mít”.

| Thứ tự và đối chiếu | Học liệu | Tệp nguồn trong gói |
| --- | --- | --- |
| 1 · trước khi thao tác Q3 | [Thẻ bốn bước và hướng dẫn giáo viên](https://tungmai510.github.io/KhoaHocAI_A3.4/bai-2/huong-dan.html) | `bai-2/huong-dan.html` |
| 2 · Q3 | [Vườn học của Mít](https://tungmai510.github.io/KhoaHocAI_A3.4/bai-2/index.html) · đặt tên hai nhóm, thêm ảnh, cho máy học, thử bằng ảnh mới | `bai-2/index.html`, CSS/JS, `mit.glb`, `audio/`, `fonts/` |
| 3 · Q4 | Lặp đủ bốn thao tác với dữ liệu khác và mô tả từng bước. Bài nộp trên Moodle | Cùng ứng dụng, bộ ảnh tại `bai-2/samples/` |
| Dùng trong Q3 và Q4 | Bộ ảnh học, ảnh thử, dữ liệu ảnh ngoài nhóm và nguồn ảnh | `samples/anh-hoc.zip`, `samples/anh-thu.zip`, [giấy phép và tác giả](https://tungmai510.github.io/KhoaHocAI_A3.4/bai-2/samples/credits.html) |

BT4.2 bản lưu ghi [Teachable Machine](https://teachablemachine.withgoogle.com/) và bộ Chai–Lon cho Q3. Web Mít triển khai quy trình bằng MobileNet V2 và bộ phân loại kNN, có các bộ ảnh mẫu riêng. Chi tiết về khác biệt đã được ghi trong `HO-SO-BAI-2.md` tại repository.

Giải nén gói, chạy `python -m http.server 8340 --bind 127.0.0.1` tại thư mục chứa README và mở `http://127.0.0.1:8340/bai-2/`. Tệp dùng chung gồm `assets/favicon.svg` và `azota-embed.*`. Cần Internet để tải TensorFlow.js, MobileNet và Three.js. Camera tùy chọn. Có thể dùng ảnh mẫu và ảnh tải từ máy.
