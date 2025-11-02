# 📝 HƯỚNG DẪN IMPORT SINH VIÊN

## 🔐 Phân Quyền Mới

### ✅ Thay Đổi Quan Trọng
- **Chỉ ADMIN có quyền import sinh viên**
- **Giảng viên chỉ có quyền xem** danh sách sinh viên trong các lớp đã tạo
- Tự động **mapping MSSV từ face label** với database để hiển thị thông tin sinh viên

---

## 👨‍💼 Hướng Dẫn Admin Import Sinh viên

### Bước 1: Đăng nhập với tài khoản Admin
- URL: https://diemdanh.zettix.net/login
- Username: `admin` (hoặc tài khoản admin khác)
- Role: **ADMIN**

### Bước 2: Vào Admin Dashboard
- Truy cập: https://diemdanh.zettix.net/admin-dashboard
- Chọn tab **"Quản lý sinh viên"**

### Bước 3: Chuẩn bị file CSV
Format CSV:
```csv
MSSV,Họ tên,Mã lớp
024101030,Vo Hoang Khac Bao,IT4409
024101053,Nguyen Huynh Bao Anh,IT4409
110122050,Tran Minh Dien,IT4410
```

**Lưu ý quan trọng:**
- Dòng đầu tiên là header (MSSV, Họ tên, Mã lớp)
- **MSSV phải khớp với face label** từ model AI
  - Ví dụ: Face label `024101030_VoHoangKhacBao` → MSSV là `024101030`
- Mã lớp có thể là bất kỳ (IT4409, DH-Tiền Giang, v.v.)
- Không có khoảng trắng thừa

### Bước 4: Import vào hệ thống
1. Scroll xuống phần **"Import CSV"**
2. Paste nội dung CSV vào textbox
3. Click **"Import CSV"**
4. Hệ thống sẽ báo:
   - ✅ Số sinh viên đã import thành công
   - ⚠️ Số sinh viên bỏ qua (đã tồn tại)
   - ❌ Số dòng dữ liệu không hợp lệ

---

## 🎯 Cách Hệ Thống Mapping Sinh Viên

### Flow Nhận Dạng Khuôn Mặt:

1. **Sinh viên chụp ảnh điểm danh**
   - Hệ thống gửi ảnh đến Face Recognition API
   
2. **Face API trả về label**
   - Format: `024101030_VoHoangKhacBao`
   - Confidence: `0.98` (98%)

3. **Backend parse MSSV từ label**
   ```java
   String label = "024101030_VoHoangKhacBao";
   String mssv = "024101030"; // Extract trước dấu "_"
   ```

4. **Lookup trong database**
   ```java
   StudentEntity student = studentRepository.findById(mssv).orElse(null);
   ```
   
5. **Kết quả hiển thị:**
   - ✅ **Tìm thấy:** Hiển thị họ tên từ database (màu xanh)
   - ❌ **Không tìm thấy:** Hiển thị "Không tìm thấy" (màu đỏ)

---

## 📊 Ví Dụ Thực Tế

### Case 1: Sinh viên đã được import
```
Face Label: 024101030_VoHoangKhacBao
MSSV: 024101030
Database: ✅ Tìm thấy "Vo Hoang Khac Bao"

Hiển thị trong bảng điểm danh:
┌──────────┬─────────────────────┬─────────────┬────────────┐
│ MSSV     │ Họ tên              │ Face Label  │ Confidence │
├──────────┼─────────────────────┼─────────────┼────────────┤
│ 024101030│ Vo Hoang Khac Bao ✅│ 024101030_..│ 98.0%      │
└──────────┴─────────────────────┴─────────────┴────────────┘
```

### Case 2: Sinh viên CHƯA được import
```
Face Label: 024101053_NguyenHuynhBaoAnh
MSSV: 024101053
Database: ❌ Không tìm thấy

Hiển thị trong bảng điểm danh:
┌──────────┬─────────────────────┬─────────────┬────────────┐
│ MSSV     │ Họ tên              │ Face Label  │ Confidence │
├──────────┼─────────────────────┼─────────────┼────────────┤
│ 024101053│ Không tìm thấy ❌   │ 024101053_..│ 98.0%      │
└──────────┴─────────────────────┴─────────────┴────────────┘
```

**Giải pháp:** Admin import sinh viên với MSSV `024101053`

---

## 🔧 API Endpoints

### 1. Import Sinh Viên (Admin Only)
```http
POST /api/admin/students/import
Content-Type: text/plain
Authorization: Bearer <admin-token>

Body:
MSSV,Họ tên,Mã lớp
024101030,Vo Hoang Khac Bao,IT4409
024101053,Nguyen Huynh Bao Anh,IT4409
```

**Response:**
```json
{
  "success": true,
  "imported": 2,
  "totalLines": 2,
  "skippedExists": 0,
  "skippedInvalid": 0,
  "message": "Đã import 2 sinh viên. Bỏ qua: 0 (đã tồn tại), 0 (dữ liệu không hợp lệ)"
}
```

### 2. Lấy Danh Sách Điểm Danh (với thông tin sinh viên)
```http
GET /api/attendances?sessionId={sessionId}&enrichStudent=true
Authorization: Bearer <token>
```

**Response:**
```json
{
  "content": [
    {
      "id": "uuid",
      "mssv": "024101030",
      "hoTen": "Vo Hoang Khac Bao",
      "maLop": "IT4409",
      "faceLabel": "024101030_VoHoangKhacBao",
      "faceConfidence": 0.98,
      "status": "ACCEPTED",
      "studentFound": true,
      "displayName": "024101030 - Vo Hoang Khac Bao"
    }
  ]
}
```

---

## 🚨 Troubleshooting

### Vấn đề 1: "Không tìm thấy" dù đã import
**Nguyên nhân:** MSSV trong database không khớp với MSSV từ face label

**Kiểm tra:**
```sql
-- Check MSSV trong database
SELECT mssv, ho_ten FROM students WHERE mssv = '024101030';

-- Check face label trong attendance
SELECT mssv, face_label FROM attendances WHERE session_id = 'xxx';
```

**Giải pháp:** 
- Đảm bảo MSSV trong CSV khớp chính xác với face label
- Face label format: `{MSSV}_{TenKhongDau}`

### Vấn đề 2: Import bị lỗi
**Kiểm tra format CSV:**
- Có dòng header không?
- Có đủ 3 cột không? (MSSV, Họ tên, Mã lớp)
- Có ký tự đặc biệt lạ không?

### Vấn đề 3: Giảng viên không import được
**Đây là tính năng, không phải bug!**
- Chỉ Admin mới import được sinh viên
- Giảng viên chỉ xem danh sách

---

## 📌 Lưu Ý Quan Trọng

1. **Import toàn bộ danh sách sinh viên của trường** một lần bởi Admin
2. **Face label phải match với MSSV** trong database
3. **Duplicate MSSV sẽ bị bỏ qua** (không overwrite)
4. **Mã lớp không bắt buộc phải tạo trước** khi import sinh viên
5. **Giảng viên xem được tất cả sinh viên** trong các lớp đã tạo session

---

## 🎓 Example: Import 100 sinh viên

```csv
MSSV,Họ tên,Mã lớp
024101001,Nguyen Van A,IT4409
024101002,Tran Thi B,IT4409
024101003,Le Van C,IT4410
... (97 sinh viên nữa)
```

**Kết quả:**
```
✅ Import thành công: 100 sinh viên
⚠️ Bỏ qua: 0 (đã tồn tại)
❌ Lỗi: 0 (dữ liệu không hợp lệ)

Tổng thời gian: ~2-3 giây
```

---

**Cập nhật:** 2025-10-14
**Phiên bản:** 0.0.1-SNAPSHOT
