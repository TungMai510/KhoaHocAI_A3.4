# Bài 1 – Ứng dụng AI quanh em

**Phụ trách** Bùi Minh Tân. Tên trong BT4.1 §3.2 và BT4.2 §3.1. Học liệu mở đầu hiển thị “Thám tử AI quanh em”.

| Thứ tự triển khai | Học liệu và hoạt động | Tệp nguồn trong gói |
| --- | --- | --- |
| 1 | [Bắt đầu cuộc điều tra](https://tungmai510.github.io/KhoaHocAI_A3.4/index.html) · khởi động Q1 · Moodle 52 | `index.html` |
| 2 | [Cùng Sóc khám phá AI – Vở học liệu](https://nhom7ai-hcmue.moodlecloud.com/mod/scorm/view.php?id=82) · Q1 và Q2 · Moodle SCORM 82 | `bai-1/vo-tu-luu/` và gói `Vo_hoc_lieu_Bai_1_SCORM12.zip` |
| 3 | [Quầy món ngon của Sóc](https://tungmai510.github.io/KhoaHocAI_A3.4/quay-mon-ngon/index.html?flow=lesson1) · luyện kiểm tra kết quả dịch · Moodle 66 | `quay-mon-ngon/`, `Moodle/Quay_mon_ngon_SCORM12.zip` |
| 4 | [Bí ẩn sau ảnh mờ](https://tungmai510.github.io/KhoaHocAI_A3.4/hl2_mo_phong.html) · dự đoán, kiểm tra vật chứng và kết luận · Moodle 57 | `hl2_mo_phong.html`, `evidence-model.js` |
| 5 | [Tự luyện cùng Sóc – Vụ án AI nhầm lẫn](https://nhom7ai-hcmue.moodlecloud.com/mod/h5pactivity/view.php?id=81) · H5P Interactive Video, phản hồi tự luyện | `bai-1/soc-vu-an-ai/Soc_Tham_Tu_Vu_an_AI_nham_lan.h5p` |
| 6 | [Tổng kết cùng Sóc](https://tungmai510.github.io/KhoaHocAI_A3.4/bai1_tong_ket.html?classroom=moodle) · video 05 | `bai1_tong_ket.html` |
| 7 | [Đánh giá và chia sẻ](https://nhom7ai-hcmue.moodlecloud.com/course/section.php?id=35#module-53) · đề 53, chia sẻ 62 | Mục 07 trong ZIP |
| Xem thêm | [Giúp Sóc làm bảng món ăn](https://tungmai510.github.io/KhoaHocAI_A3.4/hl1_kham_pha.html) · mô phỏng dịch và đối chiếu bằng ảnh · Moodle 56 (ẩn) | `hl1_kham_pha.html` |

### Làm bài và lưu minh chứng trên Moodle

Theo thứ tự, học sinh nghe chuyện Lan và Nam ở H1, kiểm tra gợi ý ở H2, ghi hai ví dụ ngắn hoặc kể với giáo viên ở H3, thử dịch ở H4, quan sát cách máy phân loại ở H5, rồi xem nhật ký tự tổng hợp và bấm **Hoàn thành** ở H6. Học sinh nhập và chọn ngay trong vở, sau đó đi tiếp tới Quầy món ngon. Nếu chọn kể, giáo viên nghe và ghi điểm Q1 vào cột tương ứng.

Ở H4, mở [Google Dịch](https://translate.google.com/?sl=en&tl=vi&op=translate), nhập câu mẫu và quay về vở để ghi kết quả quan sát. Ở H5, mở [AI for Oceans ở màn 2](https://studio.code.org/courses/oceans/units/1/lessons/1/levels/2), gắn cả nhãn **Fish** và **Not Fish**, bấm **Continue** để máy tự phân loại, xem hai nhóm kết quả rồi quay về vở ngay ở màn 2. Vở yêu cầu kết quả quan sát của cả hai lượt trước khi ghi hoàn thành. Bài kiểm tra gợi ý chai–lon vẫn nằm ở phần vật chứng.

**Giáo viên xem minh chứng** ở [Báo cáo mục tiêu SCORM 82](https://nhom7ai-hcmue.moodlecloud.com/mod/scorm/report.php?id=82&mode=objectives). Mở lượt của học sinh rồi chọn chi tiết để đọc Q1 và Q2 trong `cmi.suspend_data`. Trạng thái mục tiêu cho biết đã có sản phẩm. Giáo viên chấm và nhập điểm riêng vào hai cột Q1 và Q2 tương ứng với Assignment 59 và 60 trong [sổ điểm](https://nhom7ai-hcmue.moodlecloud.com/grade/report/grader/index.php?id=10). Hai Assignment cũ và phản hồi vẫn có trong mục lưu trữ của Chủ đề 1. Điểm câu trả lời mở do giáo viên quyết định.

Moodle là nơi lưu tiến trình và minh chứng chính thức. Nếu mất mạng, học sinh mở lại mạng và gửi lại trong vở. Có thể dựng gói chuẩn bằng `python bai-1/vo-tu-luu/build.py <thu-muc-dau-ra>`.

Giải nén gói, chạy `python -m http.server 8340 --bind 127.0.0.1` và mở `http://127.0.0.1:8340/index.html`. Bản web dùng `app.js`, `bai1-hoc-lieu.*`, `bai1-moodle.js`, `styles.css`, `azota-embed.*` và các SVG trong `assets/`. Hai gói SCORM 1.2 có tệp khai báo và tài nguyên cần thiết cho LMS. Trang HTML xem riêng phục vụ tham khảo. Bản xem web của trò chơi chạy riêng và lượt làm web chỉ dùng để luyện tập.

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

Trong Moodle, H5P theo dõi lượt tự luyện và kết quả trong báo cáo lượt làm riêng. Điểm Bài 1 lấy từ Q1 45%, Q2 35%, đề ôn tập 15% và H5P 5%. Trò Sóc giữ điểm luyện tập riêng trên thang 100, trọng số 0%. Vở SCORM lưu minh chứng với trọng số 0%. Bài 1 tối đa 130 và Moodle bỏ qua ô điểm trống. Moodle lưu hoạt động tự luyện cũ số 58 và lịch sử tương ứng. Mã nguồn tự luyện cũ vẫn có ở `hl3_luyen_tap.html`.

Gói H5P có sẵn video, phụ đề và thư viện cần thiết. Có thể kiểm tra bằng Lumi hoặc nhập vào kho nội dung Moodle. Tám cảnh Flow gốc được lưu tại máy phát triển. Bản nộp M9 gồm bảy thư mục theo thứ tự hoạt động. Tài nguyên dùng chung giữ nguyên vị trí để các trang HTML chạy sau khi giải nén.

### Chơi lại Quầy món ngon của Sóc

Ở màn hình kết quả, chọn **Chơi lại** để luyện tập từ đơn thứ nhất hoặc **Tiếp tục** để sang nhiệm vụ kế tiếp. Lượt luyện tập chỉ đổi bộ đếm trên màn hình. Moodle giữ kết quả chính thức của lượt đã lưu. Bản web cũng hỗ trợ chơi lại.

Hoạt động SCORM 66 tiếp tục dùng cùng gói SCORM 1.2, định danh SCO và đường dẫn sang nhiệm vụ kiểm tra vật chứng.
