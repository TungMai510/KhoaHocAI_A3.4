# Em Khám Phá Và Ứng Dụng AI

Học liệu lớp 4 của Nhóm 7, học phần Đào tạo điện tử và ứng dụng, Trường Đại học Sư phạm TP.HCM. Tên bài trong bảng lấy từ BT4.1 mục 3.2 và BT4.2 mục 3.

| Hồ sơ học liệu | Phụ trách |
| --- | --- |
| [Bài 1 – Ứng dụng AI quanh em](bai-1/) | Bùi Minh Tân |
| [Bài 2 – Em tập cho máy phân loại ảnh](bai-2/) | Nguyễn Minh Đại |
| [Bài 3 – Từ vấn đề đến ý tưởng AI](bai-3/) | Giang Lê Khang |
| [Bài 4 – Kiểm tra để AI tốt hơn](bai-4/) | Mai Văn Tùng |

[Mục lục trên GitHub Pages](https://tungmai510.github.io/KhoaHocAI_A3.4/khoa_hoc.html) · [Khóa học Moodle](https://nhom7ai-hcmue.moodlecloud.com/course/view.php?id=10)

## Tổ chức và chạy học liệu

- `bai-1/`, `bai-2/`, `bai-3/`, `bai-4/` chứa mục lục từng bài và điểm vào trực tuyến. Bài 2 có mã nguồn ngay trong thư mục. Bài 4 có thêm thư mục `video/`.
- Các tệp đang được Moodle và Azota tải vẫn ở đường dẫn đã công bố. Các điểm vào mới của Bài 1, 3, 4 dùng `shared/mo-hoc-lieu.js` để mở học liệu ở cùng khung hoặc tab, giữ nguyên query và fragment. Bài 2 phục vụ trực tiếp.
- Tài nguyên web dùng chung gồm `styles.css`, `assets/favicon.svg`, `assets/squirrel.svg`, bộ nhúng `azota-embed.*` và `lesson-styles.css`. Ảnh `assets/can.svg` được Bài 1 và Bài 4 sử dụng. README từng bài liệt kê các tệp cần dùng.
- `tests/` chứa kiểm thử trình duyệt. Chạy `python -m http.server 8340 --bind 127.0.0.1` từ thư mục gốc rồi mở `http://127.0.0.1:8340/khoa_hoc.html`.

## Xuất gói học liệu

Chạy `python tools/dong_goi_hoc_lieu.py` với Python 3.9+ và Git. Bốn gói `Bai_1_Hoc_lieu.zip` đến `Bai_4_Hoc_lieu.zip` nằm tại `../Tai_lieu_su_pham/Hoc_lieu_nop/`. Có thể chọn thư mục khác bên ngoài repository bằng `--output`.

Mỗi gói có README, mã nguồn và các tài nguyên cục bộ cần thiết. Giải nén rồi chạy máy chủ HTTP tại thư mục chứa README. Liên kết điều hướng sang bài khác hoặc mục lục khóa học mở trên GitHub Pages. Các tệp video được Git theo dõi trong thư mục `video/` của từng bài được lấy vào gói tương ứng.

Hồ sơ BT4.0, BT4.1, BT4.2 và bảng tự đối chiếu sư phạm lưu riêng. Nhóm chưa đối chiếu mẫu M9.
