# Bài 2 — Hồ sơ sư phạm, tổ chức dạy học và đánh giá trên Moodle

Cập nhật: 27/11/2026 · Phụ trách Bài 2: **Nguyễn Minh Đại** (`4.C5.MR1` & `4.C5.MR2`).

## 1. Căn cứ chương trình & kịch bản BT4.1 – BT4.2 của Nhóm 7
- **Khung nội dung giáo dục AI lớp 4 (Quyết định 2422/QĐ-BGDĐT, trang 22–23):** Yêu cầu cần đạt mở rộng `4.C5.MR1` (trải nghiệm công cụ học máy theo mẫu hướng dẫn) và `4.C5.MR2` (tự chọn bộ dữ liệu khác, thực hiện lại quy trình 4 bước và mô tả thao tác).
- **Công cụ & học liệu chính thức của Bài 2:** Xưởng thực hành trực tuyến **Vườn học của Mít** (`bai-2/index.html`, sử dụng đặc trưng hình ảnh từ *MobileNetV2* kết hợp bộ phân loại láng giềng gần nhất $k=3$ chuẩn hóa $L_2$), **Thẻ hướng dẫn 4 bước & ghi chú giáo viên** (`bai-2/huong-dan.html`), **Giáo trình lớp 4 của Nhóm 7** (Bài 2 tr. 7–10; lời giải và bảng kiểm dành cho thầy cô tr. 21; nguồn học liệu tr. 24), và **4 bộ ảnh thật có giấy phép mở** (`bai-2/samples/datasets.json`, `credits.html` — 149 ảnh nạp trực tiếp trong rổ tương tác thuộc kho 193 ảnh thật đã tách riêng tập học, tập thử và ảnh ngoài hai nhóm).
- **Nền tảng quản lý học tập (LMS):** Triển khai tại khóa học **Em Khám Phá Và Ứng Dụng AI (`AI-L4`)** trên **MoodleCloud** (`https://nhom7ai-hcmue.moodlecloud.com/course/section.php?id=36`).

## 2. Phân phối thời lượng (70 phút · 2 tiết)
- **Tiết 1 — Lượt 1 (`Q3` · `4.C5.MR1` · 35 phút):**
  - 5 phút: Khởi động tình huống phân loại 4 bức ảnh hoa (Giáo trình tr. 7) & mở mục Bài 2 trên Moodle.
  - 5 phút: Xem *Thẻ 4 bước: Em làm người dạy máy* (`huong-dan.html`), chỉ ra bước dùng ảnh học và bước dùng ảnh thử riêng.
  - 5 phút: Giáo viên làm mẫu 4 bước với bộ **Hoa vườn** (*Hoa cúc – Hoa hướng dương*).
  - 16 phút: Học sinh thực hành theo cặp (2 em/máy, lần lượt đổi vai để **mỗi em tự tay làm trọn vẹn cả 4 bước**: đặt tên → kéo-thả ảnh mẫu vào 2 khay → bấm dạy Mít → kéo ảnh mới và ảnh ngoài nhóm `Hoa hồng` vào thử tài & kiểm tra; lưu ý đổi tên tệp ảnh cũ không biến nó thành ảnh thử mới).
  - 4 phút: Chốt quy trình 4 bước và đối chiếu bảng kiểm quan sát Q3.
- **Tiết 2 — Lượt 2 (`Q4` · `4.C5.MR2` · 35 phút):**
  - 4 phút: Chuyển sang chế độ **Lượt 2 (Q4)**; hệ thống khóa không cho dùng lại cặp dữ liệu của Lượt 1 và nhắc rõ nhiệm vụ chọn bộ dữ liệu mới (liên hệ tình huống *“Đổi nền, Mít có đổi ý?”* với *Bút chì – Thước kẻ* ở Giáo trình tr. 9 để học sinh chú ý chụp/chọn ảnh rõ, nhiều góc và khác nền).
  - 22 phút: Từng học sinh chọn **một bộ dữ liệu khác Lượt 1** (*Chai nhựa – Lon nước*, *Quả táo – Quả chuối*, *Mèo – Chó* hoặc chế độ *Tự tạo* chụp/tải ảnh đồ dùng học tập như *Bút chì – Thước kẻ*) và tự thực hiện lại đủ 4 bước; giáo viên đi quan sát từng em.
  - 6 phút: Mở **Phiếu Q4: Kể lại 4 bước** (bấm *Làm phiếu mới* nếu trình duyệt còn lưu nháp của bạn trước), tự viết mô tả ngắn gọn 4 bước và sao chép nộp vào hoạt động **Phiếu Q4 trên Moodle** (cho phép trình bày miệng hoặc nộp phiếu in với học sinh cần hỗ trợ).
  - 3 phút: Bạn cùng bàn hỏi 1 chỗ và em rà lại mô tả; rút ra bài học: *AI chỉ chọn giữa các nhóm đã học, số ảnh tương tự trong 3 ảnh gần nhất không phải độ chắc chắn tuyệt đối, nên con người luôn cần tự kiểm tra vật thật.*

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

## 6. Nguồn căn cứ xác minh thiết kế bài dạy, mô hình AI và học liệu (APA 7)
1. **Căn cứ chương trình giáo dục phổ thông:**
   - Bộ Giáo dục và Đào tạo. (2026). *Khung nội dung giáo dục trí tuệ nhân tạo cho học sinh phổ thông* (Ban hành kèm theo Quyết định số 2422/QĐ-BGDĐT và hướng dẫn triển khai tại Công văn số 5588/BGDĐT-GDPT). Phần Lớp 4 – Chủ đề C5 (*Làm quen với công cụ trải nghiệm học máy*), tr. 22–23 (`4.C5.MR1`, `4.C5.MR2`).
2. **Căn cứ sư phạm về dạy học máy ở tiểu học và thiết kế học liệu số:**
   - International Society for Technology in Education [ISTE]. (2020). *Hands-on AI projects for the classroom: A guide for elementary teachers* (Project 2: *What AI does well and does not do as well*, pp. 20–28). https://iste.org/ai
   - Google Creative Lab & Phillips, K. (2019). *Teachable Machine 2.0: A fast, easy way to create machine learning models for your sites, no coding required*. Google. https://teachablemachine.withgoogle.com/
   - Code.org. (2019). *AI for Oceans – Teacher lesson plan*. https://code.org/oceans
   - Biggs, J. (1996). Enhancing teaching through constructive alignment. *Higher Education*, *32*(3), 347–364. (Cơ sở đối chiếu YCCĐ – hoạt động thực hành 4 bước – đánh giá theo thao tác và giải thích, không chấm điểm học sinh theo tỷ lệ máy đoán đúng).
   - Mayer, R. E., & Moreno, R. (2003). Nine ways to reduce cognitive load in multimedia learning. *Educational Psychologist*, *38*(1), 43–52. (Cơ sở rút gọn chữ trên thẻ hướng dẫn, chia 4 bước tuần tự và ẩn gợi ý bổ trợ vào nút `?`).
3. **Căn cứ mô hình nhận dạng ảnh và thư viện mã nguồn mở:**
   - Sandler, M., Howard, A., Zhu, M., Zhmoginov, A., & Chen, L.-C. (2018). MobileNetV2: Inverted residuals and linear bottlenecks. *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR)*, 4510–4520. https://doi.org/10.1109/CVPR.2018.00474
   - Smilkov, D., Thorat, N., Assogba, Y., Yuan, A., Kreeger, N., Yu, P., Zhang, K., Cai, S., Nielsen, E., Soergel, D., Bileschi, S., Terry, M., Nicholson, C., Gupta, S. N., Sirajuddin, S., Sculley, D., Monga, R., Corrado, G., Viégas, F. B., & Wattenberg, M. (2019). TensorFlow.js: Machine learning for the web and beyond. *Proceedings of Machine Learning and Systems (MLSys)*, *1*, 309–321. (`@tensorflow/tfjs@4.22.0` & `@tensorflow-models/mobilenet@2.1.1`, giấy phép Apache-2.0, xử lý trực tiếp trên trình duyệt người học).
   - Cover, T., & Hart, P. (1967). Nearest neighbor pattern classification. *IEEE Transactions on Information Theory*, *13*(1), 21–27. (Thuật toán phân loại $k=3$ láng giềng gần nhất sau chuẩn hóa $L_2$ trong `bai-2/classifier.js`).
4. **Nguồn dữ liệu hình ảnh và tài nguyên mở:**
   - The TensorFlow Team. (2019). *Flowers dataset (`tf_flowers`)* [Data set]. TensorFlow Datasets (Giấy phép Creative Commons Attribution 2.0 — CC BY 2.0). https://www.tensorflow.org/datasets/catalog/tf_flowers
   - Wikimedia Commons & Openverse. (n.d.). *Các bộ ảnh chụp mở Chai nhựa – Lon nước, Quả táo – Quả chuối, Mèo – Chó* (Giấy phép CC0 / Public Domain / CC BY / CC BY-SA; danh mục tác giả và liên kết gốc từng tệp tại `bai-2/samples/credits.html` và `bai-2/samples/LICENSE.txt`).
   - Adams, V., Cyreal, & Jacques Le Bailly. (n.d.). *Nunito Font Family* (Giấy phép mở *SIL Open Font License 1.1*, lưu tại `bai-2/fonts/OFL.txt`).
