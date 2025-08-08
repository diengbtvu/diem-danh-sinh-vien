## Sprint 1 — MVP Điểm danh bằng khuôn mặt + QR kép
Thời gian: TBD (2 tuần khuyến nghị)

### Mục tiêu sprint
- Triển khai MVP cho phép giảng viên tạo buổi điểm danh, hiển thị 2 QR (cố định + luân phiên), sinh viên quét và chụp ảnh để điểm danh, backend xác thực token + gọi Face API và lưu bản ghi.

### Kết quả mong đợi (Deliverables)
- Backend Spring Boot (JPA) hoạt động với 2 bảng: `students`, `attendances`.
- API hoạt động: tạo session, lấy rotating token, import sinh viên, ghi nhận điểm danh, truy vấn theo buổi.
- Frontend React: màn hình tạo buổi/hiển thị QR, màn hình điểm danh (quét QR + chụp ảnh), màn hình xem kết quả.
- Mock Face API hoặc cấu hình endpoint thật (đã có) để test end-to-end.

### Định nghĩa Hoàn thành (Definition of Done)
- Code có test cơ bản, build pass, chạy được cục bộ (Docker Compose hoặc local dev).
- API có tài liệu nhanh (OpenAPI hoặc README tóm tắt endpoint).
- Flow E2E: tạo buổi -> hiển thị 2 QR -> sinh viên quét + gửi ảnh -> bản ghi `ACCEPTED/REVIEW/REJECTED` lưu DB -> giảng viên xem danh sách.

### User stories & tiêu chí chấp nhận
- [ ] US-01 (Giảng viên): Tạo buổi điểm danh có QR A và nhận QR B thay đổi mỗi T giây
  - AC: Gọi `POST /api/sessions` trả về `sessionId`, `sessionToken`, `rotateSeconds`; `GET /api/sessions/{id}/rotating-token` trả về token hợp lệ và thời gian còn lại.
- [ ] US-02 (Sinh viên): Quét 2 QR và chụp ảnh để điểm danh
  - AC: Không yêu cầu đăng nhập; sinh viên dùng camera hệ thống quét QR để mở link `/attend?session=...&rot=...`, trang tự nhận token từ URL, chụp ảnh, gửi form-data; nhận trạng thái `ACCEPTED/REVIEW/REJECTED`.
- [ ] US-03 (Giảng viên): Xem danh sách điểm danh theo buổi
  - AC: Gọi `GET /api/attendances?sessionId=...` trả danh sách paging; FE hiển thị bảng, lọc cơ bản.

### Công việc chi tiết (Backlog Sprint)

#### Khởi tạo & chuẩn bị
- [x] Tài liệu thiết kế hệ thống (`design-system.md`)
- [ ] Khởi tạo repo FE/BE, cấu trúc thư mục chuẩn
- [ ] Thiết lập Docker Compose (DB + BE; FE dev server)
- [ ] Thiết lập CI cơ bản (build + test)

#### Backend (Spring Boot + JPA)
- [ ] Khởi tạo project Spring Boot, cấu hình JPA, profile `dev`
- [ ] Entity `StudentEntity` (mssv, maLop, hoTen, createdAt)
- [ ] Entity `AttendanceEntity` (id, qrCodeValue, mssv, capturedAt, imageUrl, faceLabel, faceConfidence, status, meta)
- [ ] Repository cho `Student` và `Attendance`
- [ ] Migration SQL (Flyway/Liquibase) tạo bảng `students`, `attendances`
- [ ] Service `QrTokenService`: sinh/validate `sessionToken` và `rotatingToken` (HMAC, time-step)
- [ ] Controller `SessionController`: `POST /api/sessions`, `GET /api/sessions/{id}/rotating-token`
- [ ] Controller `StudentController`: `POST /api/students:bulk`
- [ ] Tích hợp Face API client (URL, timeout, parse `label` -> `mssv`)
- [ ] Service `AttendanceService`: xác thực cặp QR, gọi Face API, áp ngưỡng, lưu `attendances`
- [ ] Controller `AttendanceController`: `POST /api/attendances`, `GET /api/attendances`
- [ ] Rate limit cơ bản cho `POST /api/attendances`
- [ ] OpenAPI/Swagger UI bật ở profile dev
- [ ] Unit test: validate token (đúng/ sai chữ ký, lệch time-step), parse label
- [ ] Integration test: flow điểm danh (mock Face API)

#### Frontend (React)
- [ ] Khởi tạo dự án (Vite/CRA) + Router + React Query
- [ ] Component `QrViewer` (hiển thị QR chứa link `/attend?session=...&rot=...`; QR B cập nhật theo `rotateSeconds`)
- [ ] Trang giảng viên: tạo buổi (`POST /api/sessions`) và hiển thị 2 QR
- [ ] (Bỏ) Không cần `QrScanner`; dùng camera hệ thống mở link QR
- [ ] Component `CameraCapture` (chụp ảnh, preview, nén ảnh vừa phải)
- [ ] Hook API: `useCreateSession`, `useRotateToken`, `useSubmitAttendance`, `useListAttendance`
- [ ] Trang sinh viên (public): truy cập `/attend?session=...&rot=...`, chụp ảnh, gửi form-data
- [ ] Trang danh sách: hiển thị `attendances` theo `sessionId`
- [ ] Xử lý lỗi: timeout Face API, token hết hạn (hiển thị hướng dẫn thử lại)
- [ ] Ràng buộc UI: không dùng icon unicode; không dùng màu gradient; dùng màu phẳng và/hoặc SVG đơn giản

#### DevOps & cấu hình
- [ ] Dockerfile BE, FE; Compose cho DB (Postgres), BE, Face API mock (tùy chọn)
- [ ] Biến môi trường: `FACE_API_URL`, `HMAC_SECRET`, `ROTATE_SECONDS`
- [ ] Logging cơ bản (requestId, sessionId, mssv)

#### QA & Kiểm thử
- [ ] Kịch bản test thủ công: tạo buổi -> hiển thị QR -> quét & chụp ảnh -> xem kết quả
- [ ] Test trình duyệt cho QR scan & camera permission (Chrome/Edge/Android)
- [ ] Báo cáo test (ngắn) kèm ảnh màn hình

### Rủi ro & giảm thiểu
- Face API không ổn định/timeout → fallback `REVIEW`, cho phép nộp lại; mock để test
- Thiết bị không cho camera/QR → hỗ trợ nhập token bằng tay tạm thời
- Đồng hồ client lệch → luôn dùng server time, cho leeway 1 step

### Ước lượng (tham khảo)
- BE: 13–20 points
- FE: 13–21 points
- DevOps/QA: 5–8 points

### Theo dõi tiến độ
- Cập nhật dấu [x]/[ ] trực tiếp trong file hoặc sử dụng board ngoài. Mỗi PR tham chiếu dòng công việc tương ứng.
