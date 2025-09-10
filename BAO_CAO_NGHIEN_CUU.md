# BÁO CÁO NGHIÊN CỨU HỆ THỐNG ĐIỂM DANH SINH VIÊN THÔNG MINH

## TÓM TẮT DỰ ÁN

Hệ thống điểm danh sinh viên thông minh là một giải pháp toàn diện sử dụng công nghệ QR Code động kết hợp với nhận diện khuôn mặt AI để tự động hóa quy trình điểm danh trong môi trường giáo dục. Hệ thống được thiết kế với kiến trúc gồm 3 thành phần chính: Frontend (React/TypeScript), Backend (Spring Boot/Java), và AI Service (Python/Flask). Dự án giải quyết bài toán gian lận điểm danh thông qua cơ chế bảo mật đa lớp (QR động 2 lớp + xác thực khuôn mặt) và cung cấp cập nhật thời gian thực qua WebSocket.

## 1. GIỚI THIỆU

### 1.1. Bối cảnh
Điểm danh thủ công gây tốn thời gian, dễ gian lận (điểm danh hộ), khó tổng hợp số liệu. Ứng dụng QR Code động và AI nhận diện khuôn mặt giúp tự động hóa, tăng minh bạch và chống gian lận hiệu quả.

### 1.2. Mục tiêu
- Tự động hóa điểm danh với độ chính xác cao và thời gian xử lý nhanh (< 30 giây/sinh viên)
- Chống gian lận bằng QR Code động 2 lớp và nhận diện khuôn mặt
- Cung cấp dashboard và thống kê real-time cho giảng viên
- Đảm bảo bảo mật (JWT, HMAC) và quyền riêng tư

### 1.3. Phạm vi
- Điểm danh tại lớp học, môi trường đại học/cao đẳng
- Hỗ trợ trình duyệt di động (PWA) và máy tính

## 2. NỀN TẢNG VÀ CÔNG NGHỆ

- Frontend: React 18 + TypeScript, Vite, Material-UI, STOMP/WebSocket, PWA, jsqr (scan QR), qrcode (tạo QR)
- Backend: Spring Boot 3 (Web, Security, WebSocket, Validation, Data JPA), JWT (jjwt), MySQL, Lombok, SpringDoc OpenAPI
- AI Service: Flask + Flask-RESTX (Swagger), PyTorch, Ultralytics YOLOv8 (classification), facenet_pytorch MTCNN (detection), OpenCV, PIL
- Hạ tầng: Có thể reverse proxy qua Nginx; triển khai on-prem hoặc cloud

## 3. KIẾN TRÚC HỆ THỐNG

```
┌─────────────────────────────────────────────────────────┐
│                    Reverse Proxy (Nginx)                │
└─────────────┬───────────────────────┬───────────────────┘
              │                       │
              ▼                       ▼
┌──────────────────────┐  ┌──────────────────────────────┐
│   Frontend (React)   │  │     Backend API (Spring)     │
│   Vite dev: 5173     │  │     REST + WebSocket         │
│   Preview: 8000      │  │     Port: 8080               │
└──────────────────────┘  └──────────┬───────────────────┘
                                      │
                          ┌───────────┴───────────┐
                          │                       │
                          ▼                       ▼
            ┌──────────────────────┐  ┌──────────────────┐
            │  AI Service (Flask)  │  │  MySQL Database  │
            │  Port: 5000          │  │                  │
            │  YOLO + MTCNN        │  │                  │
            └──────────────────────┘  └──────────────────┘
```

### 3.1. Bảo mật và phân quyền (Backend)
- JWT HS256 với secret cấu hình (JwtService: HS256, jwt.secret, jwt.expiration)
- SecurityConfig: Cho phép công khai một số endpoint:
  - /api/auth/** (đăng nhập, verify, logout)
  - /api/attendances (gửi điểm danh, multipart/form-data)
  - /api/sessions/validate, /api/sessions/current
  - /api/sessions/{id}/activate-qr2, /api/sessions/{id}/validate-qr
  - Admin: /api/admin/**, /api/users/** (ROLE_ADMIN)
  - Giảng viên: /api/sessions/**, /api/teacher/**, /api/analytics/**, /api/integrations/** (ROLE_ADMIN, ROLE_GIANGVIEN)
- WebSocketConfig: STOMP endpoint /ws, broker /topic, app prefix /app

### 3.2. Luồng điểm danh End-to-End
1) Giảng viên tạo phiên (CreateSession) → sinh sessionId, sessionToken (QR A)
2) Sinh viên mở /attend?session={SESSION-...}
3) Frontend gọi POST /api/sessions/{sessionId}/activate-qr2 để kích hoạt QR B (cửa sổ thời gian cấu hình)
4) Nhận rotatingToken qua WebSocket topic /topic/session/{sessionId} hoặc polling GET /api/sessions/{sessionId}/status
5) Frontend chụp ảnh khuôn mặt (AdvancedCamera: face detection, quality assessment) → gửi POST /api/attendances với FormData {sessionToken, rotatingToken, image}
6) Backend xác thực token, forward ảnh sang AI Service, nhận label + confidence → ghi AttendanceEntity và phát notification real-time

## 4. THÀNH PHẦN CHI TIẾT

### 4.1. Frontend (Vite + React + MUI)
- Routing (main.tsx): các route /, /attend, /login, /teacher-dashboard, /admin-dashboard, ...
- AttendPage.tsx:
  - Bước: Quét QR A → Bật camera → Chờ/Quét QR B → Chụp ảnh → Gửi điểm danh
  - WebSocket subscribe /topic/session/{sessionId} để lấy rotatingToken khi QR B được kích hoạt; fallback polling /status
  - Gửi FormData lên /api/attendances; hiển thị kết quả (ACCEPTED/REVIEW/REJECTED, mssv, họ tên, confidence)
- Components nâng cao: AdvancedCamera, LivenessChecker (tùy chọn), QualityAssessment, QRScanner
- PWA: manifest, sw.js (khả năng cài đặt, offline cơ bản)

### 4.2. Backend (Spring Boot)
- JwtAuthenticationFilter: bỏ qua kiểm tra cho các endpoint công khai; xác thực Bearer token cho phần còn lại; nạp user và authority ROLE_*
- SessionController (trích yếu):
  - POST /api/sessions: tạo phiên; trả sessionId, sessionToken, rotateSeconds, qrUrlTemplate
  - POST /api/sessions/{sessionId}/activate-qr2: bật QR B theo windowSeconds; gửi WebSocket QR_B_ACTIVATED kèm rotatingToken
  - GET /api/sessions/{sessionId}/status: trả trạng thái QR B và rotatingToken nếu đang active
  - GET /api/sessions/{sessionId}/rotating-token: tạo rotatingToken và TTL
- AttendanceController:
  - POST /api/attendances (multipart/form-data): xác thực sessionToken + rotatingToken; gọi AI; map confidence → status
    - ≥ 0.9: ACCEPTED; 0.7–0.9: REVIEW; < 0.7: REJECTED
    - Lưu AttendanceEntity; bắn WebSocket NEW_ATTENDANCE và GLOBAL UPDATE
  - GET /api/attendances?sessionId={id}: phân trang bản ghi điểm danh
- Domain: StudentEntity (mssv, hoTen, maLop), ClassEntity (maLop, tenLop, ...), AttendanceEntity, UserEntity, ...

### 4.3. AI Service (Flask + RESTX)
- Endpoints:
  - POST /api/v1/face-recognition/predict/file (multipart image)
  - POST /api/v1/face-recognition/predict/base64 (JSON: {image: base64})
  - GET /api/v1/face-recognition/health
- Pipeline (api_server.py):
  - MTCNN detect faces → crop → resize 160x160 → YOLOv8 classification
  - Trả danh sách detections: face_id, class (label), confidence, bounding_box
- Cấu hình: MODEL_PATH=best.pt; DEVICE=cpu/cuda; CONF_THRESHOLD=0.5 (cần cung cấp model đã train)
- Ghi log DEBUG chi tiết giúp quan sát pipeline và lỗi
- Lưu ý: Notebook face_recognition.ipynb nghiên cứu hướng dùng DeepFace/ArcFace như phương án nâng cao (R&D), dịch vụ hiện hành dùng YOLOv8 + MTCNN

## 5. API CHI TIẾT (TRÍCH YẾU)

### 5.1. Auth
- POST /api/auth/login → {success, message, user, token}
- POST /api/auth/verify → {success, user}
- POST /api/auth/logout → {success}

### 5.2. Sessions
- POST /api/sessions → {sessionId, sessionToken, rotateSeconds, qrUrlTemplate, expiresAt}
- POST /api/sessions/{sessionId}/activate-qr2 → {sessionId, qr2Active, validForMs, sessionToken, rotatingToken}
- POST /api/sessions/{sessionId}/validate-qr → 200 nếu rotatingToken hợp lệ, 401/410 nếu không
- GET  /api/sessions/{sessionId}/status → {sessionId, qr2Active, validForMs, sessionToken, rotatingToken?}
- GET  /api/sessions/{sessionId}/rotating-token → {sessionToken, rotatingToken, timeStep, validForMs}

### 5.3. Attendance
- POST /api/attendances (multipart/form-data: sessionToken, rotatingToken, image)
  → {status, mssv?, hoTen?, capturedAt, confidence?}
- GET  /api/attendances?sessionId={id} → Page<AttendanceEntity>

### 5.4. AI Recognition
- POST /api/v1/face-recognition/predict/file (image)
- POST /api/v1/face-recognition/predict/base64 ({image})
- GET  /api/v1/face-recognition/health

Ví dụ cURL:

```bash
# Đăng nhập
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"admin","password":"admin123"}'

# Tạo phiên
curl -X POST http://localhost:8080/api/sessions \
  -H "Authorization: Bearer {{JWT_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{"maLop":"CS101","rotateSeconds":20}'

# Gọi AI (file)
curl -X POST http://localhost:5000/api/v1/face-recognition/predict/file \
  -F "image=@face.jpg"
```

## 6. BẢO MẬT, RIÊNG TƯ VÀ HIỆU NĂNG

- Token & Chữ ký:
  - JWT HS256, secret cấu hình (JwtService)
  - QR token ký HMAC; rotating token theo step để chống replay
- Phân quyền: ROLE_ADMIN, ROLE_GIANGVIEN; endpoints công khai giới hạn
- Dữ liệu: Bcrypt password, tránh lộ thông tin nhạy cảm; CORS có whitelist nguồn
- Hiệu năng:
  - Frontend: Vite, PWA cache; code-splitting
  - Backend: JPA paging, tránh N+1; WebSocket broker nội bộ
  - AI: GPU (CUDA) khi sẵn có; preprocess ảnh; model caching

## 7. CƠ SỞ DỮ LIỆU (KHÁI QUÁT)

- Users(id, username, email, password_hash, role, is_active, last_login_at)
- Classes(ma_lop, ten_lop, mo_ta, created_by_username, created_at, updated_at)
- Students(mssv, ma_lop, ho_ten, created_at)
- Sessions(session_id, ma_lop, start_at, end_at, rotate_seconds, is_active)
- Attendances(id, session_id, mssv, face_label, face_confidence, status, created_at)

Quan hệ: Class–Student (1–N), Class–Session (1–N), Session–Attendance (1–N), Student–Attendance (1–N).

## 8. TRIỂN KHAI VÀ CHẠY THỬ

### 8.1. Development
```bash
# Frontend
cd frontend
npm install
npm run dev  # http://localhost:5173

# Backend
cd backend
mvn spring-boot:run  # http://localhost:8080

# AI Service (cần Python 3.10+, CUDA nếu có)
pip install flask flask-restx facenet-pytorch ultralytics opencv-python pillow torch torchvision torchaudio
python api_server.py  # http://localhost:5000
```
Lưu ý: MODEL_PATH (best.pt) cần được đặt cạnh api_server.py hoặc cấu hình đường dẫn đúng.

### 8.2. Production (gợi ý)
- Frontend: npm run build → npm run preview hoặc serve qua Nginx (port 8000)
- Backend: mvn clean package → chạy JAR; cấu hình DB và JWT via environment
- AI: chạy api_server.py có giám sát (systemd/pm2), bật CUDA nếu có GPU
- Nginx reverse proxy theo route / (frontend), /api (backend), /ws (websocket), /ai (AI proxy – tùy chọn)

## 9. KIỂM THỬ
- Unit (Backend): Spring Boot Test cho service/repo
- Integration: Postman/Insomnia cho REST, STOMP client cho WebSocket
- E2E (Frontend): Cypress/Playwright
- AI: đo accuracy, precision/recall, thời gian dự đoán; tinh chỉnh threshold 0.7–0.9

## 10. KẾT QUẢ, HẠN CHẾ, HƯỚNG PHÁT TRIỂN

- Kết quả: Hoàn thiện luồng điểm danh end-to-end, chống gian lận bằng QR động + AI; dashboard giảng viên; real-time notification; PWA hỗ trợ thiết bị di động
- Hạn chế:
  - Độ chính xác AI phụ thuộc chất lượng ảnh/ánh sáng; khó phân biệt sinh viên rất giống nhau
  - Cần model đã huấn luyện phù hợp dữ liệu địa phương
  - Một số môi trường chặn WebSocket → fallback polling
- Hướng phát triển:
  - Liveness detection nâng cao; thiết bị & vị trí (device fingerprint, GPS)
  - Nâng cấp mô hình (ArcFace/DeepFace) theo notebook R&D
  - Tối ưu trải nghiệm offline và cơ chế đồng bộ
  - Tích hợp LMS (Moodle/Canvas), SSO

## 11. PHỤ LỤC

### 11.1. Cấu trúc thư mục (rút gọn)
```
frontend/
  src/components, pages, hooks, services, theme, config
  package.json, vite.config.ts
backend/
  src/main/java/com/diemdanh/{api,config,domain,repo,service,dto}
  pom.xml
api_server.py
face_recognition.ipynb
```

### 11.2. Gợi ý Nginx
```nginx
# Ví dụ reverse proxy (tùy chỉnh domain/port phù hợp)
server {
  listen 80;
  server_name your-domain.example;

  location / {
    proxy_pass http://127.0.0.1:8000; # frontend built preview
  }

  location /api {
    proxy_pass http://127.0.0.1:8080; # backend
  }

  location /ws {
    proxy_pass http://127.0.0.1:8080; # websocket
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }

  # Optional: proxy AI dưới /ai nếu muốn hợp nhất domain
  location /ai {
    proxy_pass http://127.0.0.1:5000; # ai service
  }
}
```

—

Tác giả: Nhóm phát triển hệ thống điểm danh thông minh
Phiên bản: 1.0.0
Ngày cập nhật: 2025-09-10
License: MIT
