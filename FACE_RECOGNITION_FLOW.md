# 🔍 LUỒNG NHẬN DIỆN KHUÔN MẶT

## 📊 Dữ Liệu Từ Face Recognition API

### **API Request**
```bash
curl -X 'POST' \
  'https://server.zettix.net/api/v1/face-recognition/predict/file' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'image=@photo.jpg;type=image/jpeg'
```

### **API Response**
```json
{
  "success": true,
  "total_faces": 1,
  "detections": [
    {
      "face_id": 1,
      "class": "110122074_DamThuyHien",
      "confidence": 0.3416,
      "bounding_box": {
        "x1": 550,
        "y1": 1023,
        "x2": 1264,
        "y2": 1909
      }
    }
  ]
}
```

---

## 🔄 MAPPING DỮ LIỆU

### **Backend: FaceApiClient.java**

**File**: `backend/src/main/java/com/diemdanh/service/FaceApiClient.java`

#### **1. Response Model Mapping**

```java
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public static class ExternalResponse {
    private Boolean success;
    
    @JsonProperty("total_faces")
    private Integer totalFaces;
    
    private List<Detection> detections;
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Detection {
        @JsonProperty("face_id")
        private Integer faceId;
        
        @JsonProperty("class")        // ✅ Map "class" → className
        private String className;
        
        private Double confidence;
        
        @JsonProperty("bounding_box")
        private BoundingBox boundingBox;
    }
}
```

**Mapping:**
- `"class"` từ API → `className` trong Java
- `"total_faces"` → `totalFaces`
- `"face_id"` → `faceId`
- `"bounding_box"` → `boundingBox`

#### **2. Transform to Internal Format**

```java
private RecognizeResponse mapToRecognizeResponse(ExternalResponse external) {
    RecognizeResponse resp = new RecognizeResponse();
    
    // Kiểm tra có face detected không
    if (external == null 
        || external.getTotalFaces() == null 
        || external.getTotalFaces() < 1
        || external.getDetections() == null 
        || external.getDetections().isEmpty()) {
        return resp; // Empty response → REVIEW status
    }
    
    // Lấy face đầu tiên (highest confidence)
    ExternalResponse.Detection first = external.getDetections().get(0);
    
    resp.setLabel(first.getClassName());    // ✅ "110122074_DamThuyHien"
    resp.setConfidence(first.getConfidence()); // ✅ 0.3416
    
    return resp;
}
```

**Output:**
```java
RecognizeResponse {
    label: "110122074_DamThuyHien",
    confidence: 0.3416
}
```

---

### **Backend: AttendanceController.java**

**File**: `backend/src/main/java/com/diemdanh/api/AttendanceController.java`

#### **1. Gọi Face API**

```java
@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public AttendanceSubmitResponse submit(
    @RequestPart("sessionToken") String sessionToken,
    @RequestPart("rotatingToken") String rotatingToken,
    @RequestPart("image") MultipartFile image
) throws Exception {
    // ... validate tokens ...
    
    byte[] bytes = image.getBytes();
    
    // ✅ Gọi Face Recognition API
    var faceResp = faceApiClient.recognize(bytes, image.getOriginalFilename())
                                 .block();
    
    String label = faceResp != null ? faceResp.getLabel() : null;
    // label = "110122074_DamThuyHien"
    
    Double confidence = faceResp != null ? faceResp.getConfidence() : null;
    // confidence = 0.3416
    
    // ...
}
```

#### **2. Parse MSSV từ Label**

```java
private String parseMssv(String label) {
    if (!StringUtils.hasText(label)) return null;
    
    // Extract MSSV before first '_' or space
    // Formats supported:
    //   - "110122074_DamThuyHien"  → "110122074"
    //   - "110122074 Dam Thuy Hien" → "110122074"
    //   - "110122074"              → "110122074"
    
    int underscore = label.indexOf('_');
    int space = label.indexOf(' ');
    int cut = -1;
    
    if (underscore >= 0 && space >= 0) {
        cut = Math.min(underscore, space);
    } else if (underscore >= 0) {
        cut = underscore;
    } else if (space >= 0) {
        cut = space;
    }
    
    if (cut > 0) {
        return label.substring(0, cut); // ✅ "110122074"
    }
    
    // If no delimiter, return whole label if it's MSSV format
    String trimmed = label.trim();
    return trimmed.matches("^\\d{6,}$") ? trimmed : null;
}
```

**Ví dụ:**
- Input: `"110122074_DamThuyHien"` → Output: `"110122074"`
- Input: `"110122074 Dam Thuy Hien"` → Output: `"110122074"`
- Input: `"UnknownPerson"` → Output: `null`

#### **3. Tìm Sinh Viên trong Database**

```java
String mssv = parseMssv(label); // "110122074"

StudentEntity student = mssv != null 
    ? studentRepository.findById(mssv).orElse(null) 
    : null;
```

**Kết quả:**
```java
student = {
    mssv: "110122074",
    hoTen: "Đàm Thúy Hiền",
    maLop: "D21CQCN01-N"
}
```

#### **4. Xác Định Trạng Thái Điểm Danh**

```java
AttendanceEntity.Status status;

if (student == null || confidence == null) {
    status = AttendanceEntity.Status.REVIEW;
    // Không tìm thấy sinh viên hoặc không detect được face
    
} else if (confidence >= 0.9) {
    status = AttendanceEntity.Status.ACCEPTED;
    // Độ tin cậy >= 90% → Tự động chấp nhận
    
} else if (confidence >= 0.7) {
    status = AttendanceEntity.Status.REVIEW;
    // Độ tin cậy 70-90% → Cần giáo viên xem xét
    
} else {
    status = AttendanceEntity.Status.REJECTED;
    // Độ tin cậy < 70% → Từ chối (có thể là người khác)
}
```

**Với ví dụ: `confidence = 0.3416` (34.16%)**
```java
status = AttendanceEntity.Status.REJECTED; // ❌ Thất bại
```

#### **5. Lưu vào Database**

```java
AttendanceEntity record = new AttendanceEntity();
record.setQrCodeValue("session=" + sessionToken + "&rot=" + rotatingToken);
record.setSessionId(sessionId);
record.setMssv(mssv);                    // "110122074"
record.setImageUrl(imageBase64);          // Base64 encoded image
record.setFaceLabel(label);              // ✅ "110122074_DamThuyHien"
record.setFaceConfidence(confidence);    // ✅ 0.3416
record.setStatus(status);                // REJECTED

AttendanceEntity saved = attendanceRepository.save(record);
```

**Database Record:**
```
id: "abc-123-..."
sessionId: "c68c4796-8239-47b5-b43e-34a1c34e3685"
mssv: "110122074"
faceLabel: "110122074_DamThuyHien"    ✅
faceConfidence: 0.3416                 ✅
status: "REJECTED"
imageUrl: "data:image/jpeg;base64,/9j/4AAQ..."
capturedAt: "2025-10-07T12:34:56.789Z"
```

#### **6. Response về Frontend**

```java
return AttendanceSubmitResponse.builder()
        .status(status.name())           // "REJECTED"
        .mssv(mssv)                      // "110122074"
        .hoTen(student != null ? student.getHoTen() : null) // "Đàm Thúy Hiền"
        .capturedAt(Instant.now().toString())
        .confidence(confidence)          // 0.3416
        .build();
```

---

## 🖥️ HIỂN THỊ TRÊN FRONTEND

### **Trang: AttendanceDetailPage**

**URL:** `https://diemdanh.zettix.net/attendance-detail?sessionId=c68c4796-8239-47b5-b43e-34a1c34e3685`

**File:** `frontend/src/pages/AttendanceDetailPage.tsx`

#### **1. Fetch Attendances API**

```typescript
const fetchAttendances = async () => {
  // GET /api/teacher/sessions/{sessionId}/attendances
  // hoặc
  // GET /api/admin/attendances?sessionId=...
  
  const response = await apiRequest(endpoint)
  const data = await response.json()
  
  setAttendances(data)
}
```

**Response:**
```json
{
  "content": [
    {
      "id": "abc-123-...",
      "sessionId": "c68c4796-8239-47b5-b43e-34a1c34e3685",
      "mssv": "110122074",
      "faceLabel": "110122074_DamThuyHien",
      "faceConfidence": 0.3416,
      "status": "REJECTED",
      "capturedAt": "2025-10-07T12:34:56.789Z",
      "imageUrl": "data:image/jpeg;base64,..."
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "number": 0
}
```

#### **2. DataTable Columns Definition**

```typescript
<DataTable
  columns={[
    {
      id: 'imageUrl',
      label: 'Ảnh',
      format: (value: any) => (
        value ? (
          <Box component="img" src={value} alt="Student"
               sx={{ width: 60, height: 60, objectFit: 'cover' }} />
        ) : <Box>N/A</Box>
      )
    },
    {
      id: 'mssv',
      label: 'MSSV',
      sortable: true
    },
    {
      id: 'mssv',
      label: 'Họ tên',
      format: (value: any) => getStudentName(value)
      // "110122074" → "Đàm Thúy Hiền"
    },
    {
      id: 'capturedAt',
      label: 'Thời gian',
      sortable: true,
      format: (value) => new Date(value).toLocaleString('vi-VN')
      // "2025-10-07T12:34:56.789Z" → "07/10/2025, 12:34:56"
    },
    {
      id: 'faceLabel',              // ✅
      label: 'Face Label',          // ✅
      format: (value) => value || 'N/A'
      // Hiển thị: "110122074_DamThuyHien"
    },
    {
      id: 'faceConfidence',         // ✅
      label: 'Confidence',          // ✅
      format: (value) => value ? `${(value * 100).toFixed(1)}%` : 'N/A'
      // 0.3416 → "34.2%"
    },
    {
      id: 'status',
      label: 'Trạng thái',
      format: (value) => (
        <Chip
          icon={getStatusIcon(value)}
          label={getStatusText(value)}
          color={getStatusColor(value)}
          size="small"
        />
      )
      // "REJECTED" → Chip màu đỏ "Thất bại"
    }
  ]}
  data={attendances?.content || []}
/>
```

#### **3. Hiển thị trên UI**

**Bảng danh sách điểm danh:**

| Ảnh | MSSV | Họ tên | Thời gian | Face Label | Confidence | Trạng thái |
|-----|------|--------|-----------|------------|------------|------------|
| 📷 | 110122074 | Đàm Thúy Hiền | 07/10/2025, 12:34:56 | **110122074_DamThuyHien** | **34.2%** | 🔴 Thất bại |

---

#### **4. Edit Dialog (Chi tiết)**

```typescript
<Dialog open={editingAttendance !== null}>
  <DialogTitle>Chỉnh sửa điểm danh</DialogTitle>
  <DialogContent>
    <TextField
      label="MSSV"
      value={editingAttendance?.mssv || ''}
      disabled
    />
    <TextField
      label="Họ tên"
      value={getStudentName(editingAttendance?.mssv)}
      disabled
    />
    <TextField
      label="Face Label"                           // ✅
      value={editingAttendance?.faceLabel || ''}   // ✅
      disabled
    />
    <TextField
      label="Confidence"                           // ✅
      value={editingAttendance?.faceConfidence 
        ? `${(editingAttendance.faceConfidence * 100).toFixed(1)}%` 
        : ''}                                      // ✅
      disabled
    />
    <FormControl>
      <InputLabel>Trạng thái</InputLabel>
      <Select value={editingAttendance?.status}>
        <MenuItem value="ACCEPTED">Thành công</MenuItem>
        <MenuItem value="REVIEW">Cần xem xét</MenuItem>
        <MenuItem value="REJECTED">Thất bại</MenuItem>
      </Select>
    </FormControl>
  </DialogContent>
</Dialog>
```

**Hiển thị trong dialog:**
```
MSSV: 110122074
Họ tên: Đàm Thúy Hiền
Face Label: 110122074_DamThuyHien    ✅
Confidence: 34.2%                    ✅
Trạng thái: Thất bại (có thể chỉnh sửa)
```

---

## 📊 BẢNG THRESHOLD CONFIDENCE

| Confidence | Phạm vi | Status | Màu | Ý nghĩa |
|------------|---------|--------|-----|---------|
| >= 0.9 | 90-100% | `ACCEPTED` | 🟢 Xanh | Điểm danh thành công |
| 0.7 - 0.89 | 70-89% | `REVIEW` | 🟡 Vàng | Cần giáo viên xem xét |
| < 0.7 | 0-69% | `REJECTED` | 🔴 Đỏ | Từ chối - Có thể là người khác |
| `null` | - | `REVIEW` | 🟡 Vàng | Không detect được face |

**Ví dụ với `confidence = 0.3416` (34.16%):**
- ❌ Status: `REJECTED`
- 🔴 Màu: Đỏ
- 📝 Hiển thị: "Thất bại"
- ⚠️ Lý do: Độ tin cậy quá thấp, có thể không phải là người trong hệ thống

---

## 🔄 LUỒNG DỮ LIỆU HOÀN CHỈNH

```
Face API Response
    │
    ├─ "class": "110122074_DamThuyHien"
    └─ "confidence": 0.3416
         │
         ↓
FaceApiClient.java (Mapping)
    │
    ├─ className → label: "110122074_DamThuyHien"
    └─ confidence → confidence: 0.3416
         │
         ↓
AttendanceController.java (Processing)
    │
    ├─ Parse MSSV: "110122074_DamThuyHien" → "110122074"
    ├─ Find Student: StudentRepository.findById("110122074")
    ├─ Check Confidence: 0.3416 < 0.7 → REJECTED
    │
    └─ Save AttendanceEntity:
         ├─ mssv: "110122074"
         ├─ faceLabel: "110122074_DamThuyHien"  ✅
         ├─ faceConfidence: 0.3416              ✅
         └─ status: "REJECTED"
              │
              ↓
Database (attendances table)
              │
              ↓
GET /api/.../attendances API
              │
              ↓
Frontend: AttendanceDetailPage.tsx
    │
    └─ Display in DataTable:
         ├─ Face Label: "110122074_DamThuyHien"
         ├─ Confidence: "34.2%"
         └─ Status: 🔴 "Thất bại"
```

---

## ⚙️ CẤU HÌNH

### **Face API URL**

**File:** `backend/src/main/resources/application.yml`

```yaml
app:
  faceApiUrl: https://server.zettix.net
```

### **Face API Endpoint**

**Full URL:** `https://server.zettix.net/api/v1/face-recognition/predict/file`

**Method:** `POST`  
**Content-Type:** `multipart/form-data`  
**Body:** `image=@file.jpg`

---

## 🐛 TROUBLESHOOTING

### **Vấn đề: Face Label hiển thị "N/A"**

**Nguyên nhân:**
1. Face API không trả về `class` field
2. Face API trả về `total_faces: 0`
3. Face API timeout/error

**Giải pháp:**
```bash
# Check backend logs
sudo journalctl -u diemdanh-backend.service -n 50 | grep "Face API"

# Logs mong đợi:
# "Face API request: imageSize=123456 bytes"
# "Face API call success: label=110122074_..., confidence=0.95"
```

### **Vấn đề: Confidence luôn thấp**

**Nguyên nhân:**
1. Ảnh chất lượng kém (mờ, tối, góc nghiêng)
2. Khuôn mặt chưa được train trong Face API
3. Nhiều khuôn mặt trong ảnh

**Giải pháp:**
1. Hướng dẫn sinh viên chụp ảnh rõ mặt, đủ ánh sáng
2. Train thêm ảnh vào Face Recognition model
3. Giáo viên review và chấp nhận thủ công

---

## 📝 NOTES

1. **Format Label:**
   - Standard: `{MSSV}_{HoTen}` (underscore separator)
   - Alternative: `{MSSV} {Ho Ten}` (space separator)
   - Fallback: `{MSSV}` (digits only)

2. **Threshold Tuning:**
   - Có thể điều chỉnh threshold trong `AttendanceController.java`
   - Ví dụ: Giảm từ 0.7 → 0.5 để giảm số lượng REJECTED

3. **Storage:**
   - Ảnh được lưu dưới dạng Base64 trong database
   - Field: `imageUrl` (LONGTEXT)

4. **Performance:**
   - Face API timeout: 15 seconds
   - Average response time: 2-5 seconds

---

**Tài liệu được tạo bởi AI Assistant**  
*Cập nhật: 2025-10-07*