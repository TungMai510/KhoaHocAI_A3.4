# Kiểm thử mô hình Bài 2 — 16/11/2026

## Kết luận
Không có bảo đảm nhận diện đúng mọi ảnh. Bản mới đạt **32/40 (80%)** trên 40 ảnh thử cuối, chưa dùng để học hoặc lựa chọn cách phân loại. Hoa cúc: 17/20; hướng dương: 15/20. Kết quả này không đại diện camera/ánh sáng lớp học hoặc mọi bộ dữ liệu do học sinh chọn.

## Mô hình thật
TensorFlow.js 4.22.0; @tensorflow-models/mobilenet 2.1.1; MobileNet V2 alpha 1.0, trọng số có sẵn. infer(image,true) lấy vector đặc trưng. Không huấn luyện lại toàn bộ mạng MobileNet. Học sinh cung cấp ảnh và nhãn; bộ phân loại k=3 lưu ví dụ và so sánh đặc trưng ảnh thử.
Bản cũ dùng khoảng cách Euclid trên vector thô. Bản mới chuẩn hóa L2 trước khi tính khoảng cách (thứ hạng tương đương cosine), rồi lấy đa số 3 láng giềng. Không dùng nhãn gốc của ảnh thử để tạo dự đoán. Kết quả không được gán sẵn.

## Quy trình và kết quả
1. Chọn ảnh bằng seed 340216, danh sách tên tệp gốc và SHA256 trong samples/manifest.json. Giữ nguồn/CC BY 2.0. Thu nhỏ tối đa 512 px và nén JPEG.
2. Kiểm tra bản cũ trên 24 ảnh riêng: 3 ảnh mỗi nhóm -> 14/24; 8 ảnh mỗi nhóm -> 18/24.
3. Thử chuẩn hóa L2 trên chính 24 ảnh kiểm tra sơ bộ đó với 8 ảnh học mỗi nhóm: 19/24. Vì đã dùng để chọn cách xử lý, 24 ảnh này là validation, KHÔNG dùng làm kết quả cuối.
4. Bổ sung trước kiểm thử cuối thành 16 ảnh mỗi nhóm. Chọn thêm 40 ảnh cuối khác tệp, không trùng 32 ảnh học hoặc 24 ảnh validation. Chạy một lần, không bỏ 8 ảnh sai để làm đẹp kết quả.
5. Kết quả cuối: 32/40. Ma trận hàng=nhãn thật, cột=dự đoán, thứ tự Hoa cúc/Hoa hướng dương: [[17,3],[5,15]].
6. 4 ảnh hoa hồng ngoài hai nhóm: cả 4 vẫn bị gán một trong hai nhóm. Một ca có cả 3 phiếu cùng nhóm mà vẫn không đúng về mặt đối tượng. Vì vậy số phiếu đồng ý không phải xác suất đúng, và không phải bộ phát hiện ảnh lạ.

Các thử nghiệm đầu/cuối khác số ảnh học và tập thử nên không dùng 75% -> 80% để khẳng định mức cải thiện nhân quả. Không kiểm soát trùng vật thể/phiên chụp giữa những tệp khác nhau; không loại trừ trùng dữ liệu tiền huấn luyện ImageNet. Chỉ xác nhận tệp tập học/validation/test không trùng theo SHA256.

## Kiểm thử đã chạy
- Suy luận thật trên Node.js, backend CPU, cùng phiên bản MobileNet và cùng hàm classifier.js với web. JPEG giải mã bằng jpeg-js; browser có thể có khác biệt nhỏ khi giải mã ảnh hoặc backend số học.
- Trong trình duyệt xem trước: tải 32 ảnh, đi qua bốn bước, chạy học thật, thử một ảnh cúc và một ảnh hướng dương mới; cả hai cho nhãn tương ứng. Đây là kiểm tra luồng, không phải thêm hai mẫu vào số 40.
- Tải lại ảnh đã học sau khi đổi tên tệp: web chặn và yêu cầu ảnh mới. Kiểm tra SHA256 chỉ chặn tệp giống byte; ảnh chụp lại/resize vẫn cần người học phân biệt.
- Mô hình 3D không hiển thị trong trình duyệt kiểm thử vì WebGL không khả dụng, dùng robot minh họa dự phòng; không kết luận đã kiểm chứng hoạt ảnh 3D hoặc camera thật ở lượt này.
- Chưa kiểm tra bản mới trong iframe Azota/thiết bị lớp học. GitHub đang chạy bản trước cho đến khi người dùng cập nhật thư mục bai-2.

## Thay đổi kèm theo
- Ảnh hoa trên mạng có nguồn và giấy phép; 32 ảnh học, 40 ảnh thử cuối, 24 validation lưu để tái lập, 4 ngoài nhóm.
- Hiển thị lời nhắc khi phiếu láng giềng khác nhóm; không hiện phần trăm tin cậy giả. Luôn nhắc máy chỉ chọn giữa hai nhóm.
- Chặn ảnh trùng byte trong khay hoặc ảnh học được đổi tên để đưa vào tập thử.
- Thẻ bốn bước, hướng dẫn tự thực hành, hai gói ảnh học/thử để học sinh tự xếp khay. Tự nạp mẫu chỉ để làm quen.
- HO-SO-BAI-2.md chứa bảng kiểm Q3, bài nộp Q4, phản hồi và chỗ cần thống nhất với BT4.2.

## Nguồn
- https://www.tensorflow.org/tutorials/load_data/images
- https://github.com/tensorflow/tfjs-models/tree/master/mobilenet
- https://github.com/tensorflow/tfjs-models/tree/master/knn-classifier
- Nguồn từng ảnh và giấy phép: bai-2/samples/credits.html, LICENSE.txt, manifest.json.
