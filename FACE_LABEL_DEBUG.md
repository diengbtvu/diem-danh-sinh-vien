# Debug Face Label N/A Issue

## Vấn đề
Khi sinh viên gửi ảnh điểm danh, face_label và face_confidence hiển thị là **N/A** trên trang AttendanceDetailPage.

## Nguyên nhân có thể

### 1. Face API không được gọi
**Kiểm tra:**
```bash
# Xem logs backend khi có người submit ảnh
journalctl -u diemdanh-backend.service -f --no-pager | grep "Face API"

# Sẽ thấy:
# - "Face API request: imageSize=XXX bytes, filename=YYY"
# - "Face API call succeeded - response received"
# - "Face API response mapping - external: success=true, totalFaces=1"
# - "Face API: Detected - class=110122074_DamThuyHien, confidence=0.3416"
```

Nếu **KHÔNG** thấy logs này → Face API không được gọi → Check code AttendanceController.java

### 2. Face API trả về lỗi
**Test trực tiếp API:**
```bash
# Download ảnh test
curl -o /tmp/test.jpg "https://i.ibb.co/xxxxx/image.jpg"

# Test Face API
curl -X 'POST' \
  'https://server.zettix.net/api/v1/face-recognition/predict/file' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'image=@/tmp/test.jpg;type=image/jpeg'

# Response thành công:
{
  "success": true,
  "total_faces": 1,
  "detections": [
    {
      "face_id": 1,
      "class": "110122074_DamThuyHien",
      "confidence": 0.3416,
      "bounding_box": {...}
    }
  ]
}

# Response lỗi:
{
  "success": false,
  "error": "Truncated File Read"  # Ảnh bị hỏng
}
```

### 3. Backend không map đúng response
**Code mapping (đã fix):**
```java
// FaceApiClient.java
private RecognizeResponse mapToRecognizeResponse(ExternalResponse external) {
    // Kiểm tra null và empty
    if (external == null || external.getTotalFaces() < 1 
        || external.getDetections().isEmpty()) {
        return resp; // empty → faceLabel = null → hiển thị N/A
    }
    
    // Lấy detection đầu tiên
    Detection first = external.getDetections().get(0);
    resp.setLabel(first.getClassName());  // Mapping "class" → "label"
    resp.setConfidence(first.getConfidence());
    return resp;
}
```

### 4. Frontend không hiển thị đúng
**Check AttendanceDetailPage.tsx:**
```typescript
// Hiển thị face label
<TableCell>{record.faceLabel || 'N/A'}</TableCell>

// Hiển thị confidence
<TableCell>
  {record.faceConfidence != null 
    ? (record.faceConfidence * 100).toFixed(2) + '%' 
    : 'N/A'}
</TableCell>
```

## Cách debug từng bước

### Bước 1: Kiểm tra Face API có hoạt động không
```bash
curl https://server.zettix.net/api/v1/face-recognition/health

# Kết quả OK:
{
  "status": "healthy",
  "model_loaded": true,
  "device": "cuda"
}
```

### Bước 2: Test với ảnh thật
Khi có record "face_label = N/A" trong database:

```bash
# 1. Lấy sessionId của record đó
mysql -u root -p -e "SELECT session_id, mssv, face_label, face_confidence 
FROM attendance.attendances WHERE face_label IS NULL ORDER BY id DESC LIMIT 1;"

# 2. Xem logs backend lúc submit
journalctl -u diemdanh-backend.service --since "10 minutes ago" | grep "Face API"
```

### Bước 3: Test submit ảnh mới
1. Vào trang điểm danh: https://diemdanh.zettix.net
2. Quét QR code
3. Chụp ảnh và submit
4. Xem logs realtime:
```bash
journalctl -u diemdanh-backend.service -f | grep "Face API"
```

**Logs mong đợi:**
```
Face API request: imageSize=245678 bytes, filename=image.jpg
Face API call succeeded - response received
Face API response mapping - external: success=true, totalFaces=1, detections=1
Face API: Detected - class=110122074_DamThuyHien, confidence=0.3416
```

### Bước 4: Kiểm tra database
```bash
mysql -u root -p

USE attendance;
SELECT id, mssv, face_label, face_confidence, status, created_at 
FROM attendances 
ORDER BY created_at DESC 
LIMIT 5;
```

**Kết quả mong đợi:**
```
+----+------------+---------------------------+-----------------+----------+
| id | mssv       | face_label                | face_confidence | status   |
+----+------------+---------------------------+-----------------+----------+
| 123| 110122074  | 110122074_DamThuyHien     | 0.3416          | REVIEW   |
+----+------------+---------------------------+-----------------+----------+
```

## Các trường hợp đặc biệt

### Case 1: Confidence thấp (< 0.3)
```
confidence = 0.3416 → status = REVIEW (hiển thị màu vàng "Cần xem xét")
```

**Logic xử lý:**
```java
if (confidence >= 0.9) {
    status = ACCEPTED;  // Xanh lá
} else if (confidence >= 0.7) {
    status = REVIEW;    // Vàng
} else {
    status = REJECTED;  // Đỏ
}
```

### Case 2: Không nhận dạng được khuôn mặt
```
Face API response:
{
  "success": true,
  "total_faces": 0,
  "detections": []
}

→ face_label = null
→ face_confidence = null
→ status = REVIEW
→ Hiển thị: "Không tìm thấy" / "N/A" / "N/A"
```

### Case 3: Face API timeout hoặc lỗi
```
Face API call failed: Read timeout
→ Trả về RecognizeResponse rỗng
→ face_label = null
→ status = REVIEW
```

## Giải pháp

### Nếu Face API KHÔNG được gọi:
1. Check `application.yml`: `app.faceApiUrl` = `https://server.zettix.net`
2. Check network: `curl https://server.zettix.net/api/v1/face-recognition/health`
3. Rebuild và restart backend

### Nếu Face API trả về lỗi:
1. Kiểm tra ảnh có hợp lệ không (JPEG, size < 5MB)
2. Test API trực tiếp với curl
3. Xem error message trong logs

### Nếu mapping sai:
1. Check `@JsonProperty("class")` mapping trong Detection class
2. Rebuild backend
3. Test lại

## Testing với bản ghi thật

Đã thêm logging chi tiết. Bây giờ khi submit ảnh, sẽ thấy đầy đủ quá trình:

1. **Nhận ảnh:** "Face API request: imageSize=XXX"
2. **Gọi API:** WebClient POST đến Face API
3. **Nhận response:** "Face API call succeeded"
4. **Parse response:** "Face API response mapping - totalFaces=1"
5. **Lưu vào DB:** face_label, face_confidence
6. **Hiển thị:** AttendanceDetailPage

## Kết luận

Với logging mới đã thêm, bạn có thể dễ dàng debug bằng cách:
```bash
# Monitor logs realtime
journalctl -u diemdanh-backend.service -f | grep -i "face\|error"

# Sau đó submit 1 ảnh điểm danh và xem logs
```

Nếu vẫn thấy **face_label = N/A**, check ngay logs để xem Face API có được gọi hay không.