## Mục tiêu hệ thống
- **Bài toán**: Điểm danh sinh viên bằng khuôn mặt, kèm **mã QR kép** để chống gian lận (điểm danh hộ, ảnh chụp màn hình từ xa, v.v.).
- **Công nghệ**:
  - **Frontend**: ReactJS
  - **Backend**: Java Spring Boot (JPA/ORM)
  - **Nhận diện khuôn mặt**: Dịch vụ Python độc lập (đã sẵn), API trả về chuỗi `mssv_HoVaTen` và độ tin cậy
  - **CSDL**: PostgreSQL (khuyến nghị) hoặc MySQL

## Kiến trúc tổng thể
- **Client (React)**:
  - Không cần đăng nhập cho sinh viên; dùng camera hệ thống quét QR để mở link điểm danh (chứa token), chụp ảnh khuôn mặt (selfie tại lớp), gửi lên backend.
- **Server (Spring Boot)**:
  - Quản lý sinh viên, phiên điểm danh, kiểm tra QR kép, gọi dịch vụ nhận diện khuôn mặt, lưu bản ghi điểm danh.
- **Face Recognition API (Python)**:
  - Endpoint nhận ảnh, phản hồi `label` (ví dụ: `110122050_TranMinhDien`) + `confidence`.
- **Database**:
  - Bảng tối thiểu: `students`, `attendances` (như yêu cầu hiện tại).
  - Có thể mở rộng thêm `attendance_sessions` trong các giai đoạn sau.

## Khái niệm mã QR kép (anti-cheat)
- **QR A (session QR - cố định theo buổi)**: Sinh ra khi giảng viên tạo buổi học; giữ nguyên trong suốt buổi.
- **QR B (rotating QR - luân phiên nhanh)**: Thay đổi mỗi `T` giây (ví dụ 15–30s) theo HMAC time-step, tránh chụp màn hình/forward từ xa.
- **Luật hợp lệ**: Bản ghi điểm danh chỉ hợp lệ nếu cặp `{sessionToken, rotatingToken}` cùng thuộc cùng một buổi và rotating token nằm trong khoảng thời gian hợp lệ (kèm leeway nhỏ 1 bước thời gian).
- **Cách sử dụng**:
  - Trên màn hình giảng đường hiển thị 2 QR cạnh nhau. Sinh viên cần có mặt tại lớp để đọc được cả hai (hoặc phía client đọc text QR, hoặc gửi ảnh chứa cả hai QR để backend decode – khuyến nghị client decode bằng JS).

## Luồng nghiệp vụ chính
1. **Giảng viên tạo buổi điểm danh**
   - Backend sinh `sessionId`, `sessionToken` (QR A) và cấu hình HMAC key/period cho rotating.
   - Frontend hiển thị QR A (cố định) và luân phiên QR B theo thời gian thực.
2. **Sinh viên điểm danh**
   - Client quét 2 QR (A & B) + chụp ảnh khuôn mặt (selfie)
   - Gửi `sessionToken`, `rotatingToken`, `image` lên Backend
   - Backend gọi Face API → nhận `label` và `confidence`
   - Tách `mssv` từ `label`, đối chiếu DB → lưu `attendance`
   - Trả kết quả thành công/thất bại cho Client
3. **Xem kết quả**
   - Giảng viên xem danh sách điểm danh theo buổi, xuất CSV nếu cần.

## Mô hình dữ liệu (giai đoạn 1 - tối thiểu)
- `students` (bắt buộc)
  - `mssv` (PK, string)
  - `ma_lop` (string)
  - `ho_ten` (string)
  - `created_at` (timestamp, default now)
- `attendances` (bắt buộc)
  - `id` (PK, UUID)
  - `qr_code_value` (string)  // Lưu giá trị QR A hoặc ghép cặp A|B; khuyến nghị lưu hash
  - `mssv` (FK → students.mssv)
  - `captured_at` (timestamp, default now)
  - `image_url` (string, optional)  // Vị trí lưu ảnh (nếu cần lưu)
  - `face_label` (string, optional) // `mssv_HoVaTen` do Face API trả về
  - `face_confidence` (numeric, optional)
  - `status` (enum: ACCEPTED/REVIEW/REJECTED)
  - `meta` (jsonb, optional) // thông tin thiết bị, ip, rotating step, signature, v.v.

Gợi ý mở rộng (giai đoạn 2): `attendance_sessions` để quản lý buổi học, thời gian bắt đầu/kết thúc, khóa HMAC cho rotating.

## Thiết kế QR token
- **QR A (sessionToken)**: `SESSION-{sessionId}.{issuedAt}.{sig}`
- **QR B (rotatingToken)**: `STEP-{sessionId}.{timeStep}.{sig}`
- **Attendance Link** (nội dung mã hóa trong QR hiển thị cho sinh viên):
  - `https://{FE_HOST}/attend?session={sessionToken}&rot={rotatingToken}`
  - Như vậy QR hiển thị đã chứa cả 2 token; sinh viên chỉ cần quét bằng camera hệ thống để mở link.
- **sig**: HMAC-SHA256 trên phần dữ liệu trước đó với secret per session.
- **timeStep**: floor((now - sessionStart)/T)
- **Xác thực phía backend**:
  - Check chữ ký HMAC của từng token.
  - Check `sessionId` trùng nhau.
  - Check `timeStep` gần hiện tại (|Δ| ≤ 1) và trong khung thời gian buổi học.

## API contract (draft)
- Giảng viên: có thể dùng JWT/Bearer (giai đoạn sau; tạm thời nội bộ).
- Sinh viên: không cần đăng nhập; endpoint điểm danh là public, bảo vệ bằng cặp QR + rate limit + origin/CORS.

- Tạo buổi học (session)
  - `POST /api/sessions`
  - Body: `{ "maLop": "22DTHA1", "startAt": "2025-08-08T08:00:00Z", "endAt": "2025-08-08T09:45:00Z", "rotateSeconds": 20 }`
  - Response:
    ```json
    {
      "sessionId": "f3d2...",
      "sessionToken": "SESSION-f3d2...",
      "rotateSeconds": 20,
      "qrUrlTemplate": "https://{FE_HOST}/attend?session={sessionToken}&rot={rotatingToken}",
      "expiresAt": "2025-08-08T09:45:00Z"
    }
    ```

- Lấy rotating token hiện hành (cho màn hình giảng viên hiển thị QR B)
  - `GET /api/sessions/{sessionId}/rotating-token`
  - Response: `{ "rotatingToken": "STEP-...", "timeStep": 12345, "validForMs": 20000, "qrUrl": "https://{FE_HOST}/attend?session=SESSION-...&rot=STEP-..." }`

- Import sinh viên (tối thiểu)
  - `POST /api/students:bulk`
  - Body:
    ```json
    { "students": [
      { "mssv": "110122050", "maLop": "22DTHA1", "hoTen": "Tran Minh Dien" }
    ]}
    ```

- Điểm danh
  - `POST /api/attendances`
  - Multipart form-data:
    - `sessionToken`: text
    - `rotatingToken`: text
    - `image`: file (jpeg/png)
  - Response (thành công):
    ```json
    {
      "status": "ACCEPTED",
      "mssv": "110122050",
      "hoTen": "Tran Minh Dien",
      "capturedAt": "2025-08-08T08:35:12Z",
      "confidence": 0.982
    }
    ```

- Truy vấn kết quả theo buổi
  - `GET /api/attendances?sessionId=...`
  - Response: danh sách bản ghi (paging).

## Tích hợp Face API (giả định đã có)
- Gọi dịch vụ:
  - `POST {FACE_API_URL}/recognize`
  - Multipart: `image`
  - Response mẫu:
    ```json
    { "label": "110122050_TranMinhDien", "confidence": 0.982 }
    ```
- Xử lý phía backend:
  - Parse `mssv` từ `label` bằng cách tách trước dấu `_`.
  - Đối chiếu `students` theo `mssv`.
  - Áp ngưỡng `confidence` (ví dụ: ≥ 0.9 → ACCEPTED; 0.7–0.9 → REVIEW; < 0.7 → REJECTED) – ngưỡng điều chỉnh theo thực tế.

## Quy tắc xác thực và chống gian lận
- Ảnh gửi lên phải kèm cặp token hợp lệ (QR A & B). Không cho phép dùng lại rotating token cũ vượt quá leeway.
- Giới hạn 1 bản ghi/1 sinh viên/1 buổi (cho phép cập nhật nếu lần sau tốt hơn, lưu lịch sử nếu cần).
- Log địa chỉ IP, user agent, thời điểm chính xác (server time), độ lệch đồng hồ client.
- Rate limit endpoint điểm danh để tránh spam.
- Tùy chọn: bắt buộc ảnh có chứa cả hai QR trong khung hình (nếu dùng backend decode QR từ ảnh) – tăng chống gian lận vật lý.

## Bảo mật & riêng tư
- Mã hóa secret HMAC theo buổi, lưu an toàn (ENV/secret manager).
- Không lưu ảnh gốc nếu không cần; nếu lưu, mã hóa at-rest, giới hạn truy cập, đặt TTL xóa.
- Ẩn thông tin khuôn mặt nhạy cảm; chỉ lưu minimal: `label`, `confidence`.
- HTTPS mọi nơi. Nếu không dùng cookie/session cho sinh viên, CSRF không bắt buộc; vẫn bật CORS whitelist theo domain FE.

## Frontend (React) – cấu trúc đề xuất
- Thư viện: React + React Router, React Query (dữ liệu), `react-hook-form`, Tailwind/Ant Design.
- Ràng buộc giao diện: không dùng icon unicode; không dùng màu gradient; ưu tiên màu phẳng, biểu tượng SVG tối giản hoặc text.
- Cấu trúc thư mục:
  - `src/pages` – màn hình: Tạo buổi, Hiển thị QR, Điểm danh (`/attend`), Kết quả
  - `src/components` – `QrViewer`, `CameraCapture`, `AttendanceList`
  - `src/api` – wrapper fetch, hook React Query (`useCreateSession`, `useRotateToken`, `useSubmitAttendance`)
  - `src/utils` – validate token, time formatting
- Luồng điểm danh trên client:
  1) Sinh viên dùng camera hệ thống quét QR hiển thị trên lớp → trình duyệt mở trang `/attend?session=...&rot=...`
  2) Trang `/attend` tự động nhận token từ query string, kiểm tra hợp lệ cơ bản (định dạng)
  3) Yêu cầu quyền camera, chụp ảnh → gửi multipart lên backend kèm token
  4) Hiển thị trạng thái (accepted/review/rejected)

## Backend (Spring Boot) – cấu trúc đề xuất
- Module: `api` (REST), `domain` (entity, repository), `service` (business), `infra` (integration Face API, HMAC), `config`.
- Entity tối thiểu:
  - `StudentEntity(mssv, maLop, hoTen, createdAt)`
  - `AttendanceEntity(id, qrCodeValue, mssv, capturedAt, imageUrl, faceLabel, faceConfidence, status, meta)`
- Repository: Spring Data JPA.
- Service:
  - `AttendanceService` (validate token, gọi Face API, lưu attendance)
  - `QrTokenService` (sinh/validate session/rotating token)
- Controller:
  - `SessionController`, `StudentController`, `AttendanceController`
- Cấu hình ENV:
  - `FACE_API_URL`, `FACE_API_TIMEOUT`
  - `JWT_SECRET` (nếu dùng), `HMAC_SECRET` (mặc định; có thể sinh theo buổi)
  - `ROTATE_SECONDS` (mặc định nếu không truyền khi tạo buổi)

## Quy ước logging & giám sát
- Log theo requestId, sessionId, mssv, timeStep, kết quả face.
- Metrics: tổng số điểm danh/giây, tỉ lệ ACCEPTED/REVIEW/REJECTED, độ trễ Face API.

## Kiểm thử
- Unit test: validate token, parse label, ngưỡng confidence.
- Integration test: flow điểm danh end-to-end (mock Face API).
- UI test: camera + QR scan trong môi trường giả lập.

## Triển khai & CI/CD
- Pipeline: build FE, build BE, run test, tạo image (Docker), deploy (dev/staging/prod).
- Biến môi trường tách theo môi trường (DB URL, Face API URL, secrets).

## Edge cases cần xử lý
- Face API timeout/lỗi → trả kết quả `REVIEW`, cho phép nộp lại trong cửa sổ thời gian.
- Confidence thấp nhưng mssv có trong DB → `REVIEW` thay vì `REJECTED`, yêu cầu giảng viên duyệt tay.
- Sinh viên gửi lại nhiều lần → cập nhật bản ghi (ghi lại lịch sử trong `meta` nếu cần).
- Đồng hồ client lệch → dựa server time, cho leeway 1 step.

## Lộ trình nâng cấp
- Bổ sung `attendance_sessions` để quản trị buổi học rõ ràng (môn, phòng, giảng viên, thời lượng, secret riêng).
- Ký số payload QR theo session key riêng biệt thay vì global.
- Thêm xác thực giảng viên (JWT/OAuth2) và RBAC.
- Dashboard thống kê, export CSV/Excel, webhook LMS.

## Tiêu chí chấp nhận (giai đoạn 1)
- Tạo được buổi học và hiển thị 2 QR.
- Sinh viên tại lớp có thể quét 2 QR + chụp ảnh, gửi lên và ghi nhận `ACCEPTED` nếu khuôn mặt khớp và token hợp lệ.
- Lưu bản ghi vào `attendances`, có tham chiếu `students`.
- Xem danh sách điểm danh theo buổi. 