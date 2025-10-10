# Hướng Dẫn Triển Khai Ứng Dụng Điểm Danh

## Thông Tin Triển Khai

- **Domain**: https://diemdanh.zettix.net
- **Backend**: Spring Boot (Java 17) - Port 8083
- **Frontend**: React + Vite + Nginx
- **Database**: MySQL (14.225.220.60:3306)

## Cấu Trúc Dự Án

```
/root/Desktop/diem-danh-sinh-vien/
├── backend/
│   ├── target/attendance-backend-0.0.1-SNAPSHOT.jar  # JAR file đã build
│   └── src/                                          # Source code backend
└── frontend/
    ├── dist/                                         # Frontend đã build
    └── src/                                          # Source code frontend
```

## Quản Lý Backend Service

### Các lệnh cơ bản

```bash
# Xem trạng thái service
sudo systemctl status diemdanh-backend

# Khởi động service
sudo systemctl start diemdanh-backend

# Dừng service
sudo systemctl stop diemdanh-backend

# Khởi động lại service
sudo systemctl restart diemdanh-backend

# Xem logs
sudo journalctl -u diemdanh-backend -f

# Xem logs 100 dòng cuối
sudo journalctl -u diemdanh-backend -n 100
```

### Rebuild Backend

```bash
cd /root/Desktop/diem-danh-sinh-vien/backend
mvn clean package
sudo systemctl restart diemdanh-backend
```

## Quản Lý Frontend

### Rebuild Frontend

```bash
cd /root/Desktop/diem-danh-sinh-vien/frontend
npm run build
sudo systemctl restart nginx
```

### Kiểm tra quyền truy cập

Nếu gặp lỗi 403 hoặc 500 khi truy cập frontend:

```bash
sudo chmod -R 755 /root/Desktop/diem-danh-sinh-vien/frontend/dist
sudo chmod 755 /root /root/Desktop /root/Desktop/diem-danh-sinh-vien /root/Desktop/diem-danh-sinh-vien/frontend
```

## Quản Lý Nginx

### Các lệnh cơ bản

```bash
# Kiểm tra cấu hình
sudo nginx -t

# Khởi động lại Nginx
sudo systemctl restart nginx

# Xem trạng thái
sudo systemctl status nginx

# Xem logs lỗi
sudo tail -f /var/log/nginx/diemdanh-error.log

# Xem access logs
sudo tail -f /var/log/nginx/diemdanh-access.log
```

### File cấu hình

- **Nginx config**: `/etc/nginx/sites-available/diemdanh.conf`
- **Systemd service**: `/etc/systemd/system/diemdanh-backend.service`

### Chỉnh sửa cấu hình Nginx

```bash
sudo nano /etc/nginx/sites-available/diemdanh.conf
sudo nginx -t  # Kiểm tra cấu hình
sudo systemctl restart nginx
```

## Kiểm Tra Hệ Thống

### 1. Kiểm tra Backend đang chạy

```bash
curl http://localhost:8083/api/auth/verify
# Kết quả mong đợi: HTTP 403 hoặc response JSON
```

### 2. Kiểm tra Frontend

```bash
curl -I http://localhost/
# Kết quả mong đợi: HTTP 200 OK
```

### 3. Kiểm tra API Proxy qua Nginx

```bash
curl -I http://localhost/api/auth/verify
# Kết quả mong đợi: HTTP 403
```

### 4. Kiểm tra từ bên ngoài

```bash
# Kiểm tra HTTP
curl -I http://diemdanh.zettix.net

# Kiểm tra HTTPS
curl -I https://diemdanh.zettix.net

# Kiểm tra API
curl -I https://diemdanh.zettix.net/api/auth/verify
```

## Cấu Hình SSL/HTTPS

✅ **HTTPS đã được cấu hình!**

- **Certificate**: Self-signed certificate tại `/etc/ssl/certs/diemdanh.zettix.net.crt`
- **Private Key**: `/etc/ssl/private/diemdanh.zettix.net.key`
- **Cloudflare SSL Mode**: Flexible hoặc Full (đang hoạt động)

### Nâng cấp lên Let's Encrypt (Khuyến nghị cho production)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d diemdanh.zettix.net
```

Sau khi có Let's Encrypt certificate, nhớ đổi Cloudflare SSL mode sang "Full (strict)".

## Cập Nhật Ứng Dụng

### Full deployment (cả backend và frontend)

```bash
# 1. Pull code mới nhất
cd /root/Desktop/diem-danh-sinh-vien
git pull

# 2. Build backend
cd backend
mvn clean package

# 3. Build frontend
cd ../frontend
npm install  # Nếu có dependencies mới
npm run build

# 4. Restart services
sudo systemctl restart diemdanh-backend
sudo systemctl restart nginx

# 5. Kiểm tra
sudo systemctl status diemdanh-backend
sudo systemctl status nginx
```

## Troubleshooting

### Backend không khởi động

```bash
# Xem logs chi tiết
sudo journalctl -u diemdanh-backend -n 200

# Kiểm tra port 8083 có bị chiếm không
sudo netstat -tulpn | grep 8083

# Kiểm tra file JAR có tồn tại không
ls -lh /root/Desktop/diem-danh-sinh-vien/backend/target/attendance-backend-0.0.1-SNAPSHOT.jar
```

### Frontend trả về 403/500

```bash
# Kiểm tra quyền
ls -la /root/Desktop/diem-danh-sinh-vien/frontend/dist/

# Sửa quyền
sudo chmod -R 755 /root/Desktop/diem-danh-sinh-vien/frontend/dist
sudo chmod 755 /root /root/Desktop /root/Desktop/diem-danh-sinh-vien /root/Desktop/diem-danh-sinh-vien/frontend

# Xem logs lỗi Nginx
sudo tail -50 /var/log/nginx/diemdanh-error.log
```

### Database connection issues

```bash
# Kiểm tra kết nối đến database
mysql -h 14.225.220.60 -u root -p attendance

# Kiểm tra application.yml
cat /root/Desktop/diem-danh-sinh-vien/backend/src/main/resources/application.yml
```

## Cổng & URL

- **Backend trực tiếp**: http://localhost:8083
- **Frontend qua Nginx**: https://diemdanh.zettix.net
- **API qua Nginx**: https://diemdanh.zettix.net/api/*
- **WebSocket**: wss://diemdanh.zettix.net/ws
- **Face Recognition API**: https://server.zettix.net

## Bảo Mật

⚠️ **Lưu ý quan trọng**: File `application.yml` chứa password database. Đừng commit file này lên Git public repository!

```bash
# Thêm vào .gitignore nếu chưa có
echo "backend/src/main/resources/application.yml" >> .gitignore
```

## Monitoring

### Kiểm tra resource usage

```bash
# CPU & Memory của backend
ps aux | grep java

# Disk usage
df -h

# Kiểm tra tất cả services
sudo systemctl status diemdanh-backend nginx
```

---

**Ngày triển khai**: 2025-10-07  
**Phiên bản**: 0.0.1-SNAPSHOT