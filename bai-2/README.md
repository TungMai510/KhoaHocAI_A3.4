# Bài 2 – Em tập cho máy phân loại ảnh

**Phụ trách** Nguyễn Minh Đại. Tên trong BT4.1 §3.2 và BT4.2 §3.2. Học liệu tương tác hiện mang tên “Vườn học của Mít”.

| Thứ tự và đối chiếu | Học liệu | Tệp nguồn trong gói |
| --- | --- | --- |
| 1 · trước khi thao tác Q3 | [Thẻ bốn bước và hướng dẫn giáo viên](https://tungmai510.github.io/KhoaHocAI_A3.4/bai-2/huong-dan.html) | `bai-2/huong-dan.html` |
| 2 · Q3 | [Vườn học của Mít](https://tungmai510.github.io/KhoaHocAI_A3.4/bai-2/index.html) · đặt tên hai nhóm, thêm ảnh, cho máy học, thử bằng ảnh mới | `bai-2/index.html`, CSS/JS, `mit.glb`, `audio/`, `fonts/` |
| 3 · Q4 | Chọn bộ dữ liệu khác Lượt 1, lặp đủ bốn thao tác và mô tả từng bước. Bài nộp trên Moodle | Cùng ứng dụng, 4 bộ ảnh thật (149 ảnh) tại `bai-2/samples/` |
| Dùng trong Q3 và Q4 | Bộ ảnh học, ảnh thử, dữ liệu ảnh ngoài nhóm và nguồn ảnh | `samples/datasets.json`, `samples/anh-hoc.zip`, `samples/anh-thu.zip`, [giấy phép và tác giả](https://tungmai510.github.io/KhoaHocAI_A3.4/bai-2/samples/credits.html) |

Bản BT4.1–BT4.2 đã cập nhật của nhóm sử dụng **Vườn học của Mít** (MobileNet V2 + bộ phân loại kNN $k=3$ chuẩn hóa $L_2$) với bộ **Hoa cúc – Hoa hướng dương** cho Q3 (`4.C5.MR1`), bộ dữ liệu khác cho Q4 (`4.C5.MR2`), và tổ chức nộp bài trên **Moodle** (`HO-SO-BAI-2.md`, `KIEM-THU-MO-HINH.md`).

Giải nén gói, chạy `python -m http.server 8340 --bind 127.0.0.1` tại thư mục chứa README và mở `http://127.0.0.1:8340/bai-2/` (hỗ trợ nhúng gọn trên Moodle qua `?embed=moodle`). Tệp dùng chung gồm `assets/favicon.svg`. Cần Internet để tải TensorFlow.js, MobileNet và Three.js. Camera tùy chọn; có thể dùng 4 bộ ảnh mẫu có sẵn hoặc ảnh tải từ máy.
