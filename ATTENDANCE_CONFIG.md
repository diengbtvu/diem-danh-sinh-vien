# Cấu hình hệ thống điểm danh

## Tổng quan

Hệ thống điểm danh có thể được cấu hình thông qua file `application.yml` trong thư mục `backend/src/main/resources/`.

## Các thông số cấu hình

### 1. QR B Window Duration (Thời gian hiệu lực QR B)

```yaml
attendance:
  qr-b-window-seconds: 10  # Mặc định: 10 giây
```

**Mô tả**: Thời gian QR B có hiệu lực sau khi được kích hoạt.
- **Giá trị**: Số nguyên (giây)
- **Mặc định**: 10 giây
- **Khuyến nghị**: 10-30 giây

### 2. QR Token Rotation (Chu kỳ xoay QR)

```yaml
attendance:
  qr-rotate-seconds: 20  # Mặc định: 20 giây
```

**Mô tả**: Chu kỳ thay đổi mã QR để tăng bảo mật.
- **Giá trị**: Số nguyên (giây)
- **Mặc định**: 20 giây
- **Khuyến nghị**: 15-30 giây

### 3. QR Step Tolerance (Độ dung sai bước QR)

```yaml
attendance:
  qr-step-tolerance: 1  # Mặc định: ±1 bước
```

**Mô tả**: Số bước QR trước/sau bước hiện tại vẫn được chấp nhận.
- **Giá trị**: Số nguyên
- **Mặc định**: 1 (chấp nhận ±1 bước)
- **Khuyến nghị**: 1-2

### 4. Session Token Validity (Thời gian hiệu lực session)

```yaml
attendance:
  session-token-validity-hours: 24  # Mặc định: 24 giờ
```

**Mô tả**: Thời gian hiệu lực của session token (QR A).
- **Giá trị**: Số nguyên (giờ)
- **Mặc định**: 24 giờ
- **Khuyến nghị**: 8-48 giờ

### 5. Maximum Image Size (Kích thước ảnh tối đa)

```yaml
attendance:
  max-image-size-mb: 5  # Mặc định: 5 MB
```

**Mô tả**: Kích thước tối đa của ảnh điểm danh.
- **Giá trị**: Số nguyên (MB)
- **Mặc định**: 5 MB
- **Khuyến nghị**: 2-10 MB

### 6. Frontend URL Template (Template URL frontend)

```yaml
attendance:
  frontend-url-template: "http://localhost:5174/attend?session={sessionToken}"
```

**Mô tả**: Template URL để tạo QR A.
- **Giá trị**: String với placeholder `{sessionToken}`
- **Mặc định**: `http://localhost:5174/attend?session={sessionToken}`

## Ví dụ cấu hình hoàn chỉnh

```yaml
# Cấu hình hệ thống điểm danh
attendance:
  # QR B có hiệu lực trong 15 giây
  qr-b-window-seconds: 15
  
  # QR xoay mỗi 25 giây
  qr-rotate-seconds: 25
  
  # Chấp nhận ±2 bước QR
  qr-step-tolerance: 2
  
  # Session có hiệu lực 12 giờ
  session-token-validity-hours: 12
  
  # Ảnh tối đa 3 MB
  max-image-size-mb: 3
  
  # URL production
  frontend-url-template: "https://attendance.example.com/attend?session={sessionToken}"
```

## Cách thay đổi cấu hình

1. **Chỉnh sửa file cấu hình**:
   ```bash
   nano backend/src/main/resources/application.yml
   ```

2. **Restart ứng dụng**:
   ```bash
   cd backend
   mvn spring-boot:run
   ```

3. **Kiểm tra cấu hình hiện tại**:
   ```bash
   curl http://localhost:8080/api/sessions/config
   ```

## Lưu ý quan trọng

### Bảo mật
- **QR B Window**: Thời gian ngắn hơn = bảo mật cao hơn, nhưng khó sử dụng hơn
- **QR Rotation**: Chu kỳ ngắn hơn = bảo mật cao hơn
- **Step Tolerance**: Giá trị thấp hơn = bảo mật cao hơn

### Trải nghiệm người dùng
- **QR B Window**: Quá ngắn sẽ khó cho sinh viên kịp quét
- **QR Rotation**: Quá nhanh có thể gây lỗi đồng bộ
- **Image Size**: Quá nhỏ ảnh hưởng chất lượng nhận diện

### Khuyến nghị môi trường

#### Development
```yaml
attendance:
  qr-b-window-seconds: 30    # Dễ test
  qr-rotate-seconds: 60      # Ít thay đổi
  qr-step-tolerance: 2       # Dung sai cao
```

#### Production
```yaml
attendance:
  qr-b-window-seconds: 10    # Bảo mật cao
  qr-rotate-seconds: 20      # Cân bằng
  qr-step-tolerance: 1       # Bảo mật cao
```

## Troubleshooting

### QR B hết hạn quá nhanh
- Tăng `qr-b-window-seconds`
- Tăng `qr-step-tolerance`

### QR không được chấp nhận
- Kiểm tra `qr-rotate-seconds` khớp với frontend
- Tăng `qr-step-tolerance`

### Ảnh quá lớn
- Giảm `max-image-size-mb`
- Cấu hình compression ở frontend
