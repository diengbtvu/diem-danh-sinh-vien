# 📚 HƯỚNG DẪN IMPORT 230 SINH VIÊN

**Updated:** 2025-10-14  
**Role:** ADMIN only  

---

## ✅ BƯỚC 1: Đăng nhập Admin

1. Truy cập: https://diemdanh.zettix.net/login
2. Đăng nhập với tài khoản **ADMIN**
3. Vào: https://diemdanh.zettix.net/admin-dashboard

---

## ✅ BƯỚC 2: Vào Trang Import

1. Click **"Sinh viên"** trong sidebar bên trái
2. Click nút **"Import CSV"** (màu xanh lá)
3. Dialog import sẽ hiển thị

---

## ✅ BƯỚC 3: Chuẩn Bị File CSV

### Format chuẩn:
```csv
MSSV,Họ tên,Mã lớp
024101001,Nguyen Van A,IT4409
024101002,Tran Thi B,IT4409
024101003,Le Van C,IT4410
```

### Lưu ý quan trọng:
- ✅ **Dòng 1 là header:** MSSV,Họ tên,Mã lớp
- ✅ **MSSV:** Số thuần túy (ví dụ: 024101030)
- ✅ **Họ tên:** Tiếng Việt có dấu OK (Nguyễn Văn A)
- ✅ **Mã lớp:** Chữ + số (IT4409, DH-Tiền Giang)
- ✅ **Không có khoảng trắng thừa**
- ✅ **Mỗi dòng 1 sinh viên**

### ❌ Format SAI:
```csv
Nguyen Van A,024101001,IT4409  ❌ (Đảo cột)
024101001;Nguyen Van A;IT4409  ❌ (Dùng dấu ;)
024101001, Nguyen Van A , IT4409  ❌ (Khoảng trắng thừa)
```

---

## ✅ BƯỚC 4: Import vào hệ thống

1. **Copy toàn bộ CSV** (bao gồm header)
2. **Paste vào textbox** trong dialog
3. Click **"Import"**
4. Đợi xử lý (230 sinh viên ~ 2-3 giây)

---

## ✅ BƯỚC 5: Kiểm Tra Kết Quả

Hệ thống sẽ hiển thị:
```
✅ Đã import 230 sinh viên. 
⚠️ Bỏ qua: 0 (đã tồn tại), 0 (dữ liệu không hợp lệ)
```

### Nếu có lỗi:
- **"Bỏ qua X sinh viên (đã tồn tại)"** → OK, sinh viên đã có trong DB
- **"Bỏ qua X sinh viên (dữ liệu không hợp lệ)"** → Kiểm tra format CSV
- **"Import 0 sinh viên"** → CSV format sai hoàn toàn

---

## 🔍 Xác Minh Import Thành Công

### Cách 1: Qua UI
1. Ở trang Admin Dashboard
2. Sidebar → Click "Sinh viên"
3. Xem danh sách hiển thị (230)

### Cách 2: Qua Database
```bash
mysql -h 14.225.220.60 -u root -p attendance
SELECT COUNT(*) FROM students;
# Kết quả mong đợi: 230
```

### Cách 3: Test điểm danh
1. Sinh viên điểm danh
2. Vào trang chi tiết điểm danh
3. Kiểm tra cột "Sinh viên":
   - ✅ Nếu hiển thị tên → Import thành công
   - ❌ Nếu "Không tìm thấy" → MSSV không khớp

---

## 🎯 Mapping với Face Recognition

### Quan trọng:
**MSSV trong CSV phải khớp với Face Label từ AI Model**

Ví dụ:
```
Face Label từ AI: "024101030_VoHoangKhacBao"
                    ↓ Parse MSSV
MSSV: "024101030"
                    ↓ Lookup Database
CSV phải có: 024101030,Vo Hoang Khac Bao,IT4409
             ^^^^^^^^^ → Khớp!
```

Nếu không khớp:
```
Face Label: "024101030_VoHoangKhacBao"
CSV có:     024101031,Vo Hoang Khac Bao,IT4409  ❌ (Sai MSSV)
            ↓
Kết quả: "Không tìm thấy" (màu đỏ)
```

---

## 📊 Current Status

**Đã xóa:** 227 records có vấn đề  
**Còn lại:** 3 students (đúng format)  
**Sẵn sàng:** Import 230 students mới  

---

## 🚀 Import Ngay Bây Giờ

1. Vào: https://diemdanh.zettix.net/admin-dashboard
2. Sidebar → **"Sinh viên"**
3. Click **"Import CSV"** (button xanh lá)
4. Paste CSV của bạn (230 dòng + header)
5. Click **"Import"**
6. ✅ Done!

---

## 💡 Tips

- **Copy từ Excel?** Save as CSV UTF-8
- **Có dấu tiếng Việt?** OK, hệ thống hỗ trợ
- **Duplicate MSSV?** Sẽ bị bỏ qua (không overwrite)
- **Sai format?** Hệ thống báo chi tiết dòng nào lỗi

---

**Bạn đã sẵn sàng! Vào Admin Dashboard và import ngay! 🎓**
