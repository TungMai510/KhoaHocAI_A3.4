# Kiểm thử mô hình & dữ liệu Bài 2 — Cập nhật 27/11/2026

## 1. Kết luận tổng quan
Không có mô hình AI nào đảm bảo nhận diện đúng mọi bức ảnh thực tế. Công cụ **Vườn học của Mít** sử dụng mạng trích xuất đặc trưng **MobileNetV2 (`alpha = 1.0`, Sandler et al., *CVPR* 2018)** chạy trực tiếp trên trình duyệt kết hợp bộ phân loại $k=3$ láng giềng gần nhất sau chuẩn hóa $L_2$ (Cover & Hart, 1967):
- **Bộ Hoa vườn (*Hoa cúc – Hoa hướng dương*, 100 ảnh trong kho mẫu; kiểm thử độc lập 40 ảnh cuối):** đạt **32/40 (80,0%)** (*Hoa cúc*: 17/20; *Hoa hướng dương*: 15/20).
- **Bộ Chai & Lon (*Chai nhựa – Lon nước*, 16 ảnh học / 12 ảnh thử / 3 ảnh lạ):** đạt **11/12 (91,7%)**.
- **Bộ Hoa quả (*Quả táo – Quả chuối*, 16 ảnh học / 12 ảnh thử / 3 ảnh lạ):** đạt **12/12 (100,0%)**.
- **Bộ Thú cưng (*Mèo – Chó*, 16 ảnh học / 12 ảnh thử / 3 ảnh lạ):** đạt **11/12 (91,7%)**.

Toàn bộ **193 tệp ảnh thật** trong thư mục `bai-2/samples/` (gồm **149 ảnh** nạp trực tiếp trong 4 rổ tương tác `datasets.json` và 44 ảnh kiểm thử mở rộng của bộ Hoa trong `manifest.json` / `anh-thu.zip`) đều có mã băm `SHA-256` duy nhất, không trùng tệp giữa tập học, tập thử và nhóm ảnh lạ ngoài 2 nhóm. Kết quả này dùng để minh bạch chất lượng học liệu mẫu, không đại diện cho mọi điều kiện ánh sáng/camera lớp học.

## 2. Nguồn gốc & cơ chế mô hình thật trên trình duyệt
- **Nguồn mô hình & thư viện mã nguồn mở:** Sử dụng `TensorFlow.js 4.22.0` (Smilkov et al., *MLSys* 2019) và gói chính thức `@tensorflow-models/mobilenet 2.1.1` (`MobileNetV2`, trọng số tiền huấn luyện trên ImageNet, phát hành theo giấy phép mở **Apache-2.0**). Toàn bộ quá trình suy luận diễn ra cục bộ trên trình duyệt học sinh, không gửi ảnh hay dữ liệu cá nhân ra máy chủ bên ngoài.
- **Quy trình huấn luyện tức thì theo mẫu của học sinh:** Khi bấm **“Dạy Mít học”**, hàm `net.infer(image, true)` trích xuất vector đặc trưng cho từng ảnh học sinh đã xếp vào Khay A và Khay B. Quy trình tương tác kế thừa mô hình sư phạm của *Teachable Machine 2.0* (Google Creative Lab, 2019) và hướng dẫn dạy AI bậc tiểu học của *ISTE* (2020), được rút gọn thành 4 bước phù hợp học sinh lớp 4.
- **Quy trình phân loại minh bạch:** Khi thử ảnh mới, `classifier.js` chuẩn hóa $L_2$ các vector đặc trưng, tính khoảng cách tới toàn bộ mẫu trong 2 khay và lấy đa số trên **3 ảnh mẫu giống nhất** ($k=3$), không gán sẵn nhãn theo tên tệp và không hiển thị phần trăm độ tin cậy giả tạo.
- Giao diện hiển thị rõ câu giải thích: *“X trong 3 ảnh giống nhất là …”* kèm nút trợ giúp `?` và đưa phần xem 3 ảnh mẫu tương tự vào mục mở rộng **“Xem thêm”** để màn hình chính gọn nhẹ cho học sinh lớp 4 (Mayer & Moreno, 2003).

## 3. Hành vi với ảnh ngoài hai nhóm đã dạy (Ảnh lạ)
- Mỗi bộ dữ liệu đều có ảnh thử ngoài hai nhóm (*Hoa hồng*, *Cốc sứ*, *Quả cam*, *Thỏ*).
- Do bộ phân loại chỉ có 2 nhãn đầu ra (Khay A hoặc Khay B), mọi ảnh ngoài nhóm đều bị ép về một trong hai nhóm (thậm chí có trường hợp cả 3/3 ảnh gần nhất cùng thuộc một khay).
- Để đảm bảo chính xác về mặt sư phạm: khi học sinh thử ảnh ngoài hai nhóm mà hệ thống đã biết (`isOutside = true`), giao diện **ẩn hai nút “Đúng rồi! / Chưa đúng”** (tránh việc học sinh bấm *Đúng rồi* và nhận lời khen sai bản chất) và thay bằng thẻ giải thích kèm câu hỏi suy ngẫm: *“Vì sao Mít không gọi đúng tên [vật ngoài nhóm]?”*.

## 4. Kiểm thử kỹ thuật & tích hợp Moodle đã xác nhận
- Kiểm thử tự động toàn luồng (`tests/bai2-qa.mjs`) trên cả khung nhìn Desktop (`1366×900`) và Mobile (`390×844`) với WebGL 3D (`mit.glb`), giọng nói tiếng Việt ngoại tuyến (`bai-2/audio/*.mp3`), kéo-thả tự do ảnh mẫu/ảnh thử, chặn ảnh trùng `SHA-256` khi đổi tên tệp, chặn dùng lại bộ dữ liệu Lượt 1 khi sang Lượt 2 (Q4), cảnh báo & xác nhận **“Làm phiếu mới”** khi trình duyệt còn giữ dữ liệu Phiếu Q4 từ phiên trước, và chế độ nhúng gọn trên **Moodle** (`?embed=moodle`).
- Nguồn gốc từng ảnh và giấy phép Creative Commons được liệt kê đầy đủ tại `bai-2/samples/credits.html`, `LICENSE.txt`, `datasets.json` và `manifest.json`.
