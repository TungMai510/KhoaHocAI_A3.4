# Bài 1 – Ứng dụng AI quanh em

**Phụ trách** Bùi Minh Tân. Tên trong BT4.1 §3.2 và BT4.2 §3.1. Học liệu mở đầu hiển thị “Thám tử AI quanh em”.

| Thứ tự triển khai | Học liệu và hoạt động | Tệp nguồn trong gói |
| --- | --- | --- |
| 1 | [Bắt đầu cuộc điều tra](https://tungmai510.github.io/KhoaHocAI_A3.4/index.html) · khởi động Q1 · Moodle 52 | `index.html` |
| 2 | [Cùng Sóc khám phá AI](https://tungmai510.github.io/KhoaHocAI_A3.4/bai1_hoc_lieu.html#h1) · Q1 và Q2 · Moodle 45 | `bai1_hoc_lieu.html#h1` đến `#h6` |
| 3 | [Quầy món ngon của Sóc](https://tungmai510.github.io/KhoaHocAI_A3.4/quay-mon-ngon/index.html?flow=lesson1) · luyện kiểm tra kết quả dịch · Moodle 66 | `quay-mon-ngon/`, `Moodle/Quay_mon_ngon_SCORM12.zip` |
| 4 | [Bí ẩn sau ảnh mờ](https://tungmai510.github.io/KhoaHocAI_A3.4/hl2_mo_phong.html) · dự đoán, kiểm tra vật chứng và kết luận · Moodle 57 | `hl2_mo_phong.html`, `evidence-model.js` |
| 5 | [Tự luyện với hai tình huống](https://tungmai510.github.io/KhoaHocAI_A3.4/hl3_luyen_tap.html) · củng cố Q1 · Moodle 58 | `hl3_luyen_tap.html` và `#q1` |
| Xem thêm | [Giúp Sóc làm bảng món ăn](https://tungmai510.github.io/KhoaHocAI_A3.4/hl1_kham_pha.html) · mô phỏng dịch và đối chiếu bằng ảnh · Moodle 56 (ẩn) | `hl1_kham_pha.html` |

Trong vở học liệu, thứ tự là **H1** tình huống Lan và Nam → **H2** kiểm tra kết quả → **H3** ghi hai ví dụ Q1 → **H4** trải nghiệm dịch → **H5** trải nghiệm phân loại → **H6** đọc và sao chép nhật ký Q2. BT4.2 bản đối chiếu Moodle dùng [Google Dịch](https://translate.google.com/?sl=en&tl=vi&op=translate) và [AI for Oceans](https://code.org/oceans). Hai công cụ cần Internet.

Đề ôn tập 53, bài nộp Q1 59, bài nộp Q2 60 và chia sẻ 62 thuộc [phân mục Moodle](https://nhom7ai-hcmue.moodlecloud.com/course/section.php?id=35). Bản nguồn câu hỏi ôn tập của nhóm lưu riêng trong hồ sơ thiết kế. Các liên kết Moodle cần tài khoản phù hợp.

Giải nén gói, chạy `python -m http.server 8340 --bind 127.0.0.1` và mở `http://127.0.0.1:8340/index.html`. Bản web dùng `app.js`, `bai1-hoc-lieu.*`, `bai1-moodle.js`, `styles.css`, `azota-embed.*` và các SVG trong `assets/`. Gói SCORM 1.2 chứa đủ sáu tệp để chạy trong LMS hỗ trợ SCORM. Bản xem web của trò chơi chạy riêng và lượt làm web chỉ dùng để luyện tập.

Mô hình vật chứng dùng WebGL. Có thể mở `hl2_mo_phong.html?view=2d` hoặc chọn trực tiếp bằng chuột, chạm và bàn phím. Cử chỉ tay là tùy chọn, cần camera, quyền của trình duyệt/iframe và Internet để tải MediaPipe. Bài này có thể bổ sung video về sau bằng thư mục `bai-1/video/`.
