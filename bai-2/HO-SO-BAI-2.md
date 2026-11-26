# Bài 2 — Hồ sơ sư phạm, tổ chức dạy học và đánh giá trên Moodle

Cập nhật: 25/11/2026 · Phụ trách Bài 2: **Nguyễn Minh Đại** (`4.C5.MR1` & `4.C5.MR2`).

## 1. Căn cứ chương trình & kịch bản BT4.1 – BT4.2 của Nhóm 7
- **Khung nội dung giáo dục AI lớp 4 (trang 23):** Yêu cầu cần đạt mở rộng `4.C5.MR1` (trải nghiệm công cụ học máy theo mẫu hướng dẫn) và `4.C5.MR2` (tự chọn bộ dữ liệu khác, thực hiện lại quy trình 4 bước và mô tả thao tác).
- **Công cụ & học liệu chính thức của Bài 2:** Xưởng thực hành trực tuyến **Vườn học của Mít** (`bai-2/index.html`, sử dụng đặc trưng hình ảnh từ *MobileNet V2* kết hợp bộ phân loại láng giềng gần nhất $k=3$ chuẩn hóa $L_2$), **Thẻ hướng dẫn 4 bước** (`bai-2/huong-dan.html`), và **4 bộ ảnh thật có giấy phép mở** (`bai-2/samples/datasets.json`, `credits.html` — tổng cộng 149 ảnh tách riêng tập học, tập thử và ảnh ngoài hai nhóm).
- **Nền tảng quản lý học tập (LMS):** Triển khai tại khóa học **Em Khám Phá Và Ứng Dụng AI (`AI-L4`)** trên **MoodleCloud** (`https://nhom7ai-hcmue.moodlecloud.com/course/section.php?id=36`).

## 2. Phân phối thời lượng (70 phút · 2 tiết)
- **Tiết 1 — Lượt 1 (`Q3` · `4.C5.MR1` · 35 phút):**
  - 5 phút: Khởi động tình huống phân loại ảnh & mở mục Bài 2 trên Moodle.
  - 5 phút: Xem *Thẻ 4 bước: Em làm người dạy máy* (`huong-dan.html`).
  - 5 phút: Giáo viên làm mẫu 4 bước với bộ **Hoa vườn** (*Hoa cúc – Hoa hướng dương*).
  - 16 phút: Học sinh thực hành theo cặp (2 em/máy, lần lượt đổi vai để **mỗi em tự tay làm trọn vẹn cả 4 bước**: đặt tên → kéo-thả ảnh mẫu vào 2 khay → bấm dạy Mít → kéo ảnh mới và ảnh ngoài nhóm `Hoa hồng` vào thử tài & kiểm tra).
  - 4 phút: Chốt quy trình 4 bước và đối chiếu bảng kiểm quan sát Q3.
- **Tiết 2 — Lượt 2 (`Q4` · `4.C5.MR2` · 35 phút):**
  - 4 phút: Chuyển sang chế độ **Lượt 2 (Q4)**; hệ thống khóa không cho dùng lại cặp dữ liệu của Lượt 1 và nhắc rõ nhiệm vụ chọn bộ dữ liệu mới.
  - 22 phút: Từng học sinh chọn **một bộ dữ liệu khác Lượt 1** (*Chai nhựa – Lon nước*, *Quả táo – Quả chuối*, *Mèo – Chó* hoặc *Tự chụp/tải ảnh đồ vật học tập*) và tự thực hiện lại đủ 4 bước; giáo viên đi quan sát từng em.
  - 6 phút: Mở **Phiếu thu hoạch 4 bước (Q4)** (bấm *Làm phiếu mới* nếu trình duyệt còn lưu nháp của bạn trước), tự viết mô tả ngắn gọn 4 bước và sao chép nộp vào hoạt động **Bài tập Q4 trên Moodle** (cho phép trình bày miệng với học sinh cần hỗ trợ).
  - 3 phút: Nhận xét, rút ra bài học: *AI chỉ chọn giữa các nhóm đã học, số ảnh tương tự trong 3 ảnh gần nhất không phải độ chắc chắn tuyệt đối, nên con người luôn cần tự kiểm tra.*

## 3. Cấu trúc học liệu trên MoodleCloud (`Section 36`)
1. **Khung tương tác nhúng trực tiếp (`?embed=moodle`):** Cho phép thực hành ngay trên trang khóa học Moodle hoặc bấm *Mở toàn màn hình ↗*.
2. **Trang học liệu (Moodle Page):** *Thẻ hướng dẫn 4 bước & Bảng kiểm tự đánh giá (`4.C5.MR1` & `4.C5.MR2`)*.
3. **Liên kết toàn màn hình (Moodle URL):** Mở xưởng thực hành 3D Vườn học của Mít ở tab độc lập cho màn hình nhỏ/máy tính bảng.
4. **Hoạt động nộp bài (Moodle Assignment):** *Nộp Phiếu thu hoạch 4 bước dạy Mít (`Câu 4 · 4.C5.MR2`)* — bật cả *Văn bản trực tuyến* và *Nộp tệp*.

## 4. Bảng kiểm quan sát Q3 (`4.C5.MR1`) — Giáo viên ghi nhận từng học sinh
Họ tên học sinh: …………………… · Ngày: …/…/2026 · Bộ dữ liệu Lượt 1: …………………… · Người quan sát: ……………………

| Tiêu chí quan sát thao tác cá nhân | Đạt / Cần hỗ trợ | Ghi chú |
|---|---|---|
| 1. Mở công cụ và đặt tên rõ ràng cho hai nhóm ảnh | | |
| 2. Tự kéo-thả / thêm ít nhất 3 ảnh mẫu đúng vào mỗi khay | | |
| 3. Bấm lệnh “Dạy Mít học!” để máy trích xuất và ghi nhớ mẫu | | |
| 4. Đưa ảnh mới chưa học (và ảnh ngoài hai nhóm) vào thử, tự kiểm tra kết quả | | |

- **Nguyên tắc đánh giá Q3:** Đạt khi học sinh tự thực hiện đủ cả 4 bước theo mẫu; hỗ trợ và cho làm bổ sung ngay bước còn thiếu. **Không lấy tỷ lệ máy đoán đúng làm điểm của học sinh.**

## 5. Yêu cầu & Tiêu chí đánh giá bài nộp Q4 (`4.C5.MR2`) trên Moodle
- **Nhiệm vụ giao trên Moodle:** Chọn một bộ hai nhóm ảnh **khác với Lượt 1**, tự thực hiện lại trọn vẹn 4 bước dạy Mít, sau đó mô tả ngắn gọn:
  1. Em đặt tên hai nhóm nào? Bộ ảnh này khác lượt đầu ra sao?
  2. Em đã chọn/chụp và xếp ảnh mẫu vào hai khay như thế nào?
  3. Em bấm nút nào để cho Mít học?
  4. Em dùng ảnh mới nào để thử? Mít đoán gì và em kiểm tra bằng mắt ra sao?
- **Tiêu chí đạt Q4:**
  - Chọn đúng bộ dữ liệu khác Lượt 1;
  - Giáo viên quan sát xác nhận em tự thực hiện đủ 4 bước ở Lượt 2;
  - Nêu đúng nội dung thao tác ở cả 4 bước trong Phiếu Q4 trên Moodle (hoặc trình bày miệng được giáo viên ghi nhận).
- **Phản hồi mẫu của giáo viên:** *“Em đã tự chọn bộ ảnh mới và thực hiện tốt bước …; ở bước … em cần lưu ý dùng ảnh mới chưa nằm trong khay học để kiểm tra khách quan hơn nhé.”*
