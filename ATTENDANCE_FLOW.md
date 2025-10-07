# 📋 FLOW ĐIỂM DANH - Quét QR và Gửi Ảnh

## 🎯 Tổng Quan

Hệ thống điểm danh sử dụng **2 lớp QR Code** để bảo mật:
- **QR A (Session Token)**: Mã QR tĩnh cho cả buổi học
- **QR B (Rotating Token)**: Mã QR động, thay đổi theo thời gian

---

## 🔄 FLOW HOÀN CHỈNH

### **BƯỚC 1: QUÉT QR A (Session Token)**

#### Frontend (Sinh viên quét QR A từ màn hình)
```
URL QR A: https://diemdanh.zettix.net/attend?session=SESSION-{sessionId}.{timestamp}.{signature}
```

**File**: `AttendPage.tsx` (line 31-32)
```typescript
const sessionToken = query.get('session') || ''
// sessionToken = "SESSION-c68c4796-8239-47b5-b43e-34a1c34e3685.1728312000.abc123..."
```

**Parsing sessionId** (line 17-23):
```typescript
function parseSessionIdFromSessionToken(token: string): string | null {
  // Format: SESSION-{sessionId}.{issuedAt}.{sig}
  const dash = token.indexOf('-')
  const dot = token.indexOf('.', dash + 1)
  return token.substring(dash + 1, dot) // Lấy sessionId
}
```

**Kích hoạt QR B** (line 96-123):
```typescript
// Gọi API để kích hoạt QR B cho session này
fetch(`/api/sessions/${sessionId}/activate-qr2`, { method: 'POST' })
```

---

### **BƯỚC 2: BẬT CAMERA**

**File**: `AttendPage.tsx` → `AdvancedCamera.tsx`

```typescript
const handleCameraReady = useCallback((ready: boolean) => {
  setCameraReady(ready)
  if (ready) {
    setCurrentStep(2) // Chuyển sang bước 2
  }
}, [])
```

---

### **BƯỚC 3: QUÉT QR B (Rotating Token)**

#### **3A. Nhận QR B qua WebSocket (Real-time)**

**File**: `AttendPage.tsx` (line 127-158)

```typescript
// Subscribe WebSocket topic
const topic = `/topic/session/${sessionId}`
subscribe(topic, (message) => {
  if (message.type === 'QR_B_ACTIVATED' && message.data) {
    const { qr2Active, rotatingToken: newRotatingToken } = message.data
    if (qr2Active && newRotatingToken) {
      setRotatingToken(newRotatingToken) // ✅ Nhận QR B tự động
      setCurrentStep(3)
    }
  }
})
```

**Backend**: Khi giảng viên kích hoạt QR B, server push message qua WebSocket

---

#### **3B. Quét QR B bằng Camera (Fallback)**

**File**: `QRScanner.tsx` (line 18-80)

**Quét từng frame video**:
```typescript
const scanFrame = useCallback(() => {
  // Vẽ frame video lên canvas
  ctx.drawImage(video, 0, 0, videoWidth, videoHeight)
  const imageData = ctx.getImageData(0, 0, videoWidth, videoHeight)
  
  // Dùng jsQR để detect QR code
  const code = jsQR(imageData.data, imageData.width, imageData.height)
  
  if (code?.data) {
    const raw = code.data.trim()
    
    // Parse token từ QR
    // Format 1: Pure token: "STEP-{sessionId}.{step}.{sig}"
    // Format 2: URL: "https://...?rot=STEP-{sessionId}.{step}.{sig}"
    let token: string | null = null
    if (raw.startsWith('STEP-')) {
      token = raw
    } else {
      const url = new URL(raw)
      const rotParam = url.searchParams.get('rot')
      if (rotParam?.startsWith('STEP-')) {
        token = rotParam
      }
    }
    
    if (token) {
      onQRDetected(token) // ✅ Callback lên AttendPage
    }
  }
  
  requestAnimationFrame(scanFrame) // Quét frame tiếp theo
}, [videoRef, isActive, onQRDetected])
```

**Validate QR B** (`AttendPage.tsx` line 263-281):
```typescript
const validateQRB = async (qrData: string) => {
  // Gọi API để kiểm tra QR B có hợp lệ không
  const response = await fetch(`/api/sessions/${sessionId}/validate-qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rotatingToken: qrData })
  })
  return response.ok
}

const handleValidatedQR = async (qrData: string) => {
  if (rotatingToken) return // Đã có rồi thì bỏ qua
  
  const isValid = await validateQRB(qrData)
  if (isValid) {
    setRotatingToken(qrData) // ✅ Lưu rotating token
    setCurrentStep(3)
  } else {
    setError('QR B không hợp lệ hoặc đã hết hạn')
  }
}
```

---

### **BƯỚC 4: CHỤP ẢNH KHUÔN MẶT**

**File**: `AdvancedCamera.tsx`

```typescript
const handleCapture = useCallback((result: any) => {
  // result.imageDataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  setPreviewUrl(result.imageDataUrl)
  setCurrentStep(4)
}, [])
```

Sinh viên xem trước ảnh và có thể:
- **Chụp lại**: Reset `previewUrl`
- **Gửi điểm danh**: Chuyển sang bước 5

---

### **BƯỚC 5: GỬI ĐIỂM DANH**

#### Frontend Submit

**File**: `AttendPage.tsx` (line 295-321)

```typescript
const submit = useCallback(async () => {
  if (!previewUrl || !sessionToken || !rotatingToken) return
  
  setSubmitting(true)
  
  try {
    // Convert base64 image to Blob
    const blob = await dataUrlToBlob(previewUrl)
    
    // Build FormData
    const form = new FormData()
    form.append('sessionToken', sessionToken)    // QR A
    form.append('rotatingToken', rotatingToken)  // QR B
    form.append('image', blob, 'capture.jpg')    // Ảnh khuôn mặt
    
    // POST to backend
    const res = await fetch('/api/attendances', {
      method: 'POST',
      body: form,
    })
    
    if (!res.ok) throw new Error('Gửi điểm danh thất bại')
    
    const json = await res.json()
    setResult(json) // ✅ Hiển thị kết quả
    
  } catch (e: any) {
    setError(e.message || 'Có lỗi xảy ra')
  } finally {
    setSubmitting(false)
  }
}, [previewUrl, sessionToken, rotatingToken])
```

---

#### Backend Processing

**File**: `AttendanceController.java` (line 42-128)

```java
@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public AttendanceSubmitResponse submit(
    @RequestPart("sessionToken") String sessionToken,
    @RequestPart("rotatingToken") String rotatingToken,
    @RequestPart("image") MultipartFile image
) throws Exception {
    
    // ✅ BƯỚC 1: Validate Tokens
    if (!qrTokenService.validateToken(sessionToken, "SESSION")) {
        throw new IllegalArgumentException("Invalid session token");
    }
    if (!qrTokenService.validateToken(rotatingToken, "STEP")) {
        throw new IllegalArgumentException("Invalid rotating token");
    }
    
    // ✅ BƯỚC 2: Parse và kiểm tra session IDs khớp nhau
    String sessionId = parseSessionId(sessionToken);
    String stepSessionId = parseSessionId(rotatingToken);
    if (!sessionId.equals(stepSessionId)) {
        throw new IllegalArgumentException("Token mismatch");
    }
    
    // ✅ BƯỚC 3: Kiểm tra session còn hiệu lực
    var session = sessionService.get(sessionId);
    if (session == null) throw new IllegalArgumentException("Session not found");
    
    if (session.getEndAt() != null && Instant.now().isAfter(session.getEndAt())) {
        throw new IllegalArgumentException("Session has expired");
    }
    
    // ✅ BƯỚC 4: Validate rotating token step (chưa hết hạn)
    long tokenStep = parseStep(rotatingToken);
    long now = Instant.now().getEpochSecond();
    if (!qrTokenService.isStepValid(session.getStartAt(), now, tokenStep)) {
        throw new IllegalArgumentException("Rotating token expired");
    }
    
    // ✅ BƯỚC 5: Gọi Face Recognition API
    byte[] bytes = image.getBytes();
    String imageBase64 = "data:image/jpeg;base64," + 
                         Base64.getEncoder().encodeToString(bytes);
    
    var faceResp = faceApiClient.recognize(bytes, image.getOriginalFilename())
                                 .block(); // Blocking call
    
    String label = faceResp != null ? faceResp.getLabel() : null;
    Double confidence = faceResp != null ? faceResp.getConfidence() : null;
    
    // ✅ BƯỚC 6: Parse MSSV từ label
    // label format: "110122050_TranMinhDien" hoặc "110122050 Tran Minh Dien"
    String mssv = parseMssv(label);
    
    // ✅ BƯỚC 7: Tìm sinh viên trong database
    StudentEntity student = mssv != null 
        ? studentRepository.findById(mssv).orElse(null) 
        : null;
    
    // ✅ BƯỚC 8: Xác định trạng thái điểm danh
    AttendanceEntity.Status status;
    if (student == null || confidence == null) {
        status = AttendanceEntity.Status.REVIEW; // Không nhận diện được
    } else if (confidence >= 0.9) {
        status = AttendanceEntity.Status.ACCEPTED; // Tin cậy cao
    } else if (confidence >= 0.7) {
        status = AttendanceEntity.Status.REVIEW; // Cần xem xét
    } else {
        status = AttendanceEntity.Status.REJECTED; // Tin cậy thấp
    }
    
    // ✅ BƯỚC 9: Lưu vào database
    AttendanceEntity record = new AttendanceEntity();
    record.setQrCodeValue("session=" + sessionToken + "&rot=" + rotatingToken);
    record.setSessionId(sessionId);
    record.setMssv(mssv);
    record.setImageUrl(imageBase64);
    record.setFaceLabel(label);
    record.setFaceConfidence(confidence);
    record.setStatus(status);
    
    AttendanceEntity saved = attendanceRepository.save(record);
    
    // ✅ BƯỚC 10: Gửi notification qua WebSocket
    try {
        NotificationService.AttendanceNotification notification = 
            new NotificationService.AttendanceNotification(
                "NEW_ATTENDANCE",
                sessionId,
                mssv,
                student != null ? student.getHoTen() : "Unknown",
                status.name()
            );
        notificationService.sendAttendanceUpdate(sessionId, notification);
    } catch (Exception e) {
        // Log but don't fail
    }
    
    // ✅ BƯỚC 11: Trả về kết quả cho frontend
    return AttendanceSubmitResponse.builder()
            .status(status.name())
            .mssv(mssv)
            .hoTen(student != null ? student.getHoTen() : null)
            .capturedAt(Instant.now().toString())
            .confidence(confidence)
            .build();
}
```

---

#### Face Recognition API Call

**File**: `FaceApiClient.java` (line 29-69)

```java
public Mono<RecognizeResponse> recognize(byte[] imageBytes, String filename) {
    log.info("Face API request: imageSize={} bytes", imageBytes.length);
    
    // Build multipart request
    ByteArrayResource resource = new ByteArrayResource(imageBytes) {
        @Override
        public String getFilename() { 
            return filename.endsWith(".jpg") ? filename : filename + ".jpg";
        }
    };
    
    MultipartBodyBuilder builder = new MultipartBodyBuilder();
    builder.part("image", resource, MediaType.IMAGE_JPEG)
           .filename(filename);
    
    // POST /api/v1/face-recognition/predict/file
    return webClient.post()
            .uri("/api/v1/face-recognition/predict/file")
            .contentType(MediaType.MULTIPART_FORM_DATA)
            .body(BodyInserters.fromMultipartData(builder.build()))
            .retrieve()
            .bodyToMono(ExternalResponse.class)
            .timeout(Duration.ofSeconds(15))
            .map(this::mapToRecognizeResponse)
            .onErrorResume(ex -> {
                log.error("Face API call failed: {}", ex.getMessage());
                return Mono.just(new RecognizeResponse()); // Empty response
            });
}

private RecognizeResponse mapToRecognizeResponse(ExternalResponse external) {
    if (external == null || external.getTotalFaces() < 1) {
        return new RecognizeResponse(); // No face detected
    }
    
    Detection first = external.getDetections().get(0);
    RecognizeResponse resp = new RecognizeResponse();
    resp.setLabel(first.getClassName());        // "110122050_TranMinhDien"
    resp.setConfidence(first.getConfidence());  // 0.95
    return resp;
}
```

**Face API Response Format**:
```json
{
  "success": true,
  "total_faces": 1,
  "detections": [
    {
      "class_name": "110122050_TranMinhDien",
      "confidence": 0.95,
      "bbox": [x, y, w, h]
    }
  ]
}
```

---

### **BƯỚC 6: HIỂN THỊ KẾT QUẢ**

**File**: `AttendPage.tsx` (line 509-555)

```typescript
{result && (
  <Paper elevation={3} sx={{ p: 3 }}>
    <Alert severity={
      result.status === 'ACCEPTED' ? 'success' :
      result.status === 'REVIEW' ? 'warning' : 'error'
    }>
      <Typography>
        {result.status === 'ACCEPTED' 
          ? 'Điểm danh thành công! Đã lưu vào hệ thống.' 
          : result.status === 'REVIEW' 
            ? 'Cần xem xét thêm - Đã lưu để giáo viên duyệt' 
            : 'Điểm danh thất bại - Đã ghi nhận để xem xét'
        }
      </Typography>
    </Alert>
    
    <Stack spacing={1}>
      <Box>MSSV: {result.mssv}</Box>
      <Box>Họ tên: {result.hoTen}</Box>
      <Box>Độ tin cậy: {(result.confidence * 100).toFixed(1)}%</Box>
    </Stack>
  </Paper>
)}
```

---

## 📊 SƠ ĐỒ LUỒNG DỮ LIỆU

```
┌─────────────────┐
│   Sinh viên     │
│  Quét QR A      │
└────────┬────────┘
         │ sessionToken = "SESSION-{id}.{ts}.{sig}"
         ↓
┌────────────────────────┐
│  AttendPage.tsx        │
│  - Parse sessionId     │
│  - Activate QR B       │
└────────┬───────────────┘
         │
         ├─────────────────────────────┐
         │                             │
         ↓ WebSocket (Real-time)       ↓ Camera Scan (Fallback)
┌────────────────────┐          ┌─────────────────┐
│ Subscribe topic    │          │ QRScanner.tsx   │
│ /topic/session/id  │          │ - jsQR detect   │
│                    │          │ - Parse token   │
│ Receive QR B       │          │ - Validate QR B │
└────────┬───────────┘          └────────┬────────┘
         │                               │
         │ rotatingToken = "STEP-{id}.{step}.{sig}"
         └───────────────┬───────────────┘
                         ↓
                ┌────────────────────┐
                │ AdvancedCamera     │
                │ - Face detection   │
                │ - Capture photo    │
                └────────┬───────────┘
                         │ imageDataUrl (base64)
                         ↓
                ┌────────────────────┐
                │ Submit Button      │
                │ FormData:          │
                │ - sessionToken     │
                │ - rotatingToken    │
                │ - image (Blob)     │
                └────────┬───────────┘
                         │ POST /api/attendances
                         ↓
        ┌────────────────────────────────────┐
        │  AttendanceController.java         │
        │  1. Validate tokens                │
        │  2. Check session valid            │
        │  3. Check token not expired        │
        └────────┬───────────────────────────┘
                 │
                 ↓
        ┌────────────────────────────────────┐
        │  FaceApiClient.java                │
        │  POST /api/v1/.../predict/file     │
        │  → External Face API               │
        └────────┬───────────────────────────┘
                 │
                 ↓ { label: "110122050_...", confidence: 0.95 }
        ┌────────────────────────────────────┐
        │  Parse MSSV from label             │
        │  Find student in DB                │
        │  Determine status:                 │
        │  - confidence >= 0.9 → ACCEPTED    │
        │  - confidence >= 0.7 → REVIEW      │
        │  - else → REJECTED                 │
        └────────┬───────────────────────────┘
                 │
                 ↓
        ┌────────────────────────────────────┐
        │  Save to AttendanceEntity          │
        │  - sessionId                       │
        │  - mssv                            │
        │  - imageUrl (base64)               │
        │  - faceLabel, faceConfidence       │
        │  - status                          │
        └────────┬───────────────────────────┘
                 │
                 ↓
        ┌────────────────────────────────────┐
        │  Send WebSocket Notification       │
        │  /topic/session/{sessionId}        │
        │  → Real-time update to teachers    │
        └────────┬───────────────────────────┘
                 │
                 ↓ AttendanceSubmitResponse
        ┌────────────────────────────────────┐
        │  Frontend displays result          │
        │  - ACCEPTED: Success (green)       │
        │  - REVIEW: Pending (yellow)        │
        │  - REJECTED: Failed (red)          │
        └────────────────────────────────────┘
```

---

## 🔐 BẢO MẬT

### **Token Validation**

1. **QR Token Service** validate signature:
   ```java
   boolean validateToken(String token, String prefix) {
       // Verify HMAC signature
       // Check format: PREFIX-{id}.{data}.{signature}
   }
   ```

2. **Session ID matching**:
   - SessionToken sessionId phải == RotatingToken sessionId

3. **Time-based validation**:
   ```java
   boolean isStepValid(Instant sessionStart, long now, long tokenStep) {
       long expectedStep = (now - sessionStart.getEpochSecond()) / rotateSeconds;
       return Math.abs(tokenStep - expectedStep) <= 1; // Allow ±1 step tolerance
   }
   ```

### **Trạng Thái Điểm Danh**

| Confidence | Student Found | Status     | Ý nghĩa                          |
|------------|---------------|------------|----------------------------------|
| `null`     | -             | `REVIEW`   | Không detect được face           |
| -          | `null`        | `REVIEW`   | Không tìm thấy MSSV trong DB     |
| >= 0.9     | ✅            | `ACCEPTED` | Điểm danh thành công (tin cậy cao)|
| 0.7 - 0.9  | ✅            | `REVIEW`   | Cần giáo viên xem xét            |
| < 0.7      | ✅            | `REJECTED` | Độ tin cậy quá thấp              |

---

## 📦 CÁC THÀNH PHẦN CHÍNH

### Frontend
- **AttendPage.tsx**: Trang điểm danh chính
- **QRScanner.tsx**: Component quét QR code (jsQR library)
- **AdvancedCamera.tsx**: Camera với face detection
- **useWebSocket.ts**: Hook kết nối WebSocket real-time

### Backend
- **AttendanceController.java**: REST API điểm danh
- **FaceApiClient.java**: Client gọi Face Recognition API
- **QrTokenService.java**: Validate và generate QR tokens
- **SessionService.java**: Quản lý sessions
- **NotificationService.java**: WebSocket notifications

### External Services
- **Face Recognition API**: `https://server.zettix.net/api/v1/face-recognition/predict/file`
  - Input: Multipart file upload
  - Output: `{ label, confidence, bbox }`

---

## ⚡ PERFORMANCE & OPTIMIZATION

1. **WebSocket** cho real-time QR B thay vì polling
2. **Fallback polling** (5s interval) khi WebSocket fail
3. **Face API timeout**: 15 seconds
4. **Image compression**: Frontend tự động resize trước khi upload
5. **Base64 storage**: Lưu ảnh trong DB thay vì file system

---

## 🐛 XỬ LÝ LỖI

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| "Invalid token signature" | Token bị giả mạo | Kiểm tra HMAC secret key |
| "Session has expired" | Buổi học đã kết thúc | Quét lại QR A mới |
| "Rotating token expired" | QR B đã hết hạn | Đợi QR B mới từ giảng viên |
| "Token mismatch" | QR A và QR B khác session | Đảm bảo quét đúng phòng |
| "Face API call failed" | External API down | Retry hoặc fallback REVIEW |

---

## 📝 LOGS & DEBUGGING

### Frontend Console Logs
```javascript
'[AttendPage] WebSocket connected'
'Parsed session ID: c68c4796-8239-47b5-b43e-34a1c34e3685'
'[QRScanner] Detected QR: STEP-c68c4796-8239-47b5-b43e-34a1c34e3685.1234.sig'
'Advanced capture result: {faceDetected: true, qualityScore: 0.85}'
```

### Backend Logs
```
Face API request: imageSize=123456 bytes, filename=capture.jpg
Face API call success: label=110122050_TranMinhDien, confidence=0.95
Attendance saved: id=abc-123, status=ACCEPTED, mssv=110122050
```

---

**Tài liệu được tạo tự động bởi AI Assistant**  
*Cập nhật: 2025-10-07*