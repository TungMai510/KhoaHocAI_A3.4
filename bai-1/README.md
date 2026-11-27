# Bài 1 – Ứng dụng AI quanh em

**Phụ trách** Bùi Minh Tân. Tên trong BT4.1 §3.2 và BT4.2 §3.1. Học liệu mở đầu hiển thị “Thám tử AI quanh em”.

| Thứ tự triển khai | Học liệu và hoạt động | Tệp nguồn trong gói |
| --- | --- | --- |
| 1 | [Bắt đầu cuộc điều tra](https://tungmai510.github.io/KhoaHocAI_A3.4/index.html) · khởi động Q1 · Moodle 52 | `index.html` |
| 2 | [Cùng Sóc khám phá AI](https://tungmai510.github.io/KhoaHocAI_A3.4/bai1_hoc_lieu.html#h1) · Q1 và Q2 · Moodle 45 | `bai1_hoc_lieu.html#h1` đến `#h6` |
| 3 | [Quầy món ngon của Sóc](https://tungmai510.github.io/KhoaHocAI_A3.4/quay-mon-ngon/index.html?flow=lesson1) · luyện kiểm tra kết quả dịch · Moodle 66 | `quay-mon-ngon/`, `Moodle/Quay_mon_ngon_SCORM12.zip` |
| 4 | [Bí ẩn sau ảnh mờ](https://tungmai510.github.io/KhoaHocAI_A3.4/hl2_mo_phong.html) · dự đoán, kiểm tra vật chứng và kết luận · Moodle 57 | `hl2_mo_phong.html`, `evidence-model.js` |
| 5 | [Tự luyện cùng Sóc – Vụ án AI nhầm lẫn](https://nhom7ai-hcmue.moodlecloud.com/mod/h5pactivity/view.php?id=81) · H5P Interactive Video, phản hồi tự luyện | `bai-1/soc-vu-an-ai/Soc_Tham_Tu_Vu_an_AI_nham_lan.h5p` |
| 6 | [Tổng kết cùng Sóc](https://tungmai510.github.io/KhoaHocAI_A3.4/bai1_tong_ket.html?classroom=moodle) · video 05 | `bai1_tong_ket.html` |
| 7 | [Đánh giá và chia sẻ](https://nhom7ai-hcmue.moodlecloud.com/course/section.php?id=35#module-53) · đề 53, hai bài nộp 59 và 60, chia sẻ 62 | Mục 07 trong ZIP |
| Xem thêm | [Giúp Sóc làm bảng món ăn](https://tungmai510.github.io/KhoaHocAI_A3.4/hl1_kham_pha.html) · mô phỏng dịch và đối chiếu bằng ảnh · Moodle 56 (ẩn) | `hl1_kham_pha.html` |

Trong vở học liệu, thứ tự là **H1** tình huống Lan và Nam → **H2** kiểm tra kết quả → **H3** ghi hai ví dụ Q1 và đọc gợi ý ngắn về Mai luyện phát âm tiếng Anh → **H4** trải nghiệm dịch → **H5** trải nghiệm phân loại → **H6** đọc và sao chép nhật ký Q2. BT4.2 bản đối chiếu Moodle dùng [Google Dịch](https://translate.google.com/?sl=en&tl=vi&op=translate) và [AI for Oceans](https://code.org/oceans). Hai công cụ cần Internet.

Đề ôn tập 53, bài nộp Q1 59, bài nộp Q2 60 và chia sẻ 62 thuộc [phân mục Moodle](https://nhom7ai-hcmue.moodlecloud.com/course/section.php?id=35). Bản nguồn câu hỏi ôn tập của nhóm lưu riêng trong hồ sơ thiết kế. Các liên kết Moodle cần tài khoản phù hợp.

Giải nén gói, chạy `python -m http.server 8340 --bind 127.0.0.1` và mở `http://127.0.0.1:8340/index.html`. Bản web dùng `app.js`, `bai1-hoc-lieu.*`, `bai1-moodle.js`, `styles.css`, `azota-embed.*` và các SVG trong `assets/`. Gói SCORM 1.2 chứa đủ sáu tệp để chạy trong LMS hỗ trợ SCORM. Bản xem web của trò chơi chạy riêng và lượt làm web chỉ dùng để luyện tập.

Mô hình vật chứng dùng WebGL. Có thể mở `hl2_mo_phong.html?view=2d` hoặc chọn trực tiếp bằng chuột, chạm và bàn phím. Cử chỉ tay là tùy chọn, cần camera, quyền của trình duyệt/iframe và Internet để tải MediaPipe.

### Video Sóc Thám Tử

Năm video hoạt hình được tạo bằng Google Flow. Mỗi video nằm giữa một màn hình dẫn 16:9 với ảnh chờ lấy từ video và một nút chuyển tiếp. Học sinh có thể phát, tạm dừng, chỉnh âm lượng hoặc bấm tiếp ngay. Khi bấm tiếp, nội dung kế tiếp mới hiện ra.

| Thứ tự | Video trong bai-1/video | Vị trí và mục đích |
| --- | --- | --- |
| 1 | HL01_Khoi_dong.mp4 | Trang mở đầu. Sóc giới thiệu cuộc điều tra trước khi em bấm Bắt đầu. |
| 2 | HL02_Kham_pha.mp4 | Đầu H1. Sóc gợi hỏi về khả năng nghe và nhận dạng ảnh của máy. |
| 3 | HL03_Quay_mon_ngon.mp4 | Phần dẫn Quầy món ngon trong bản web và SCORM 66. Sóc giới thiệu nhiệm vụ ngay trước khi em vào quầy. |
| 4 | HL04_Bi_an_anh_mo.mp4 | Trước lượt dự đoán chai hay lon. Em chuẩn bị kiểm tra gợi ý của máy bằng vật chứng. |
| 5 | HL05_Tong_ket.mp4 | Sau khi hoàn tất H5P. Sóc nhắc em kiểm tra gợi ý của AI trước khi em chuyển sang phần đánh giá. |

Trong Moodle, cuối H6 dẫn thẳng tới hoạt động SCORM 66. Video 03 chỉ xuất hiện ở màn hình dẫn của trò chơi, dù học sinh đến từ H6 hay mở SCORM trực tiếp. Phần giới thiệu SCORM tải video từ GitHub Pages và vẫn cho vào quầy nếu video không tải được.

### Tự luyện H5P

Sau khi kết luận ở vụ chai–lon, bấm **Tiếp tục** để mở H5P bằng tài khoản khóa học. Video dài 65,6 giây, có 18 đoạn phụ đề tiếng Việt. Ở bốn điểm ngắt lời thoại, video tạm dừng để em chọn đáp án, đọc giải thích, thử lại hoặc tiếp tục. Ở cuối video, bấm **Hoàn tất tự luyện**, rồi chọn **Xem video tổng kết** để tới video 05 và đề ôn tập.

Trong Moodle, H5P theo dõi lượt tự luyện và kết quả trong báo cáo lượt làm riêng. Điểm đánh giá Bài 1 tiếp tục lấy từ đề ôn tập 20%, phiếu hai ví dụ 45% và nhật ký hai lượt thử 35%. SCORM vẫn hiển thị riêng trên thang 100. Moodle lưu hoạt động tự luyện cũ số 58 và lịch sử tương ứng. Mã nguồn tự luyện cũ vẫn có ở `hl3_luyen_tap.html`.

Gói H5P có sẵn video, phụ đề và thư viện cần thiết. Có thể kiểm tra bằng Lumi hoặc nhập vào kho nội dung Moodle. Tám cảnh Flow gốc được lưu tại máy phát triển. Bản nộp M9 gồm bảy thư mục theo thứ tự hoạt động. Tài nguyên dùng chung giữ nguyên vị trí để các trang HTML chạy sau khi giải nén.

### Chơi lại Quầy món ngon của Sóc

Ở màn hình kết quả, chọn **Chơi lại** để luyện tập từ đơn thứ nhất hoặc **Tiếp tục** để sang nhiệm vụ kế tiếp. Lượt luyện tập chỉ đổi bộ đếm trên màn hình. Moodle giữ kết quả chính thức của lượt đã lưu. Bản web cũng hỗ trợ chơi lại.

Hoạt động SCORM 66 tiếp tục dùng cùng gói SCORM 1.2, định danh SCO và đường dẫn sang nhiệm vụ kiểm tra vật chứng.
