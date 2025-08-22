package com.diemdanh.config;

import com.diemdanh.domain.UserEntity;
import com.diemdanh.repo.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("=== DataInitializer starting ===");
        try {
            initializeDefaultUsers();
            System.out.println("=== DataInitializer completed successfully ===");
        } catch (Exception e) {
            System.err.println("=== DataInitializer failed: " + e.getMessage() + " ===");
            e.printStackTrace();
            throw e;
        }
    }

    private void initializeDefaultUsers() {
        // Admin mặc định: idempotent & tự phục hồi nếu bị khóa
        try {
            UserEntity existingByUsername = userRepository.findByUsername("admin").orElse(null);
            UserEntity existingByEmail = userRepository.findByEmail("admin@diemdanh.com").orElse(null);

            UserEntity adminUser = existingByUsername != null ? existingByUsername : existingByEmail;

            if (adminUser != null) {
                boolean changed = false;
                if (adminUser.getRole() != UserEntity.Role.ADMIN) {
                    adminUser.setRole(UserEntity.Role.ADMIN);
                    changed = true;
                }
                if (Boolean.FALSE.equals(adminUser.getIsActive())) {
                    adminUser.setIsActive(true);
                    changed = true;
                }
                if (adminUser.getUsername() == null || !"admin".equals(adminUser.getUsername())) {
                    adminUser.setUsername("admin");
                    changed = true;
                }
                if (adminUser.getEmail() == null || !"admin@diemdanh.com".equals(adminUser.getEmail())) {
                    // giữ nguyên email hiện tại để tránh vi phạm unique, không ghi đè email nếu đã có
                }
                if (changed) {
                    userRepository.save(adminUser);
                    System.out.println(" Đã cập nhật tài khoản admin mặc định (khôi phục quyền/trạng thái)");
                }
            } else if (userRepository.countActiveAdmins() == 0) {
                UserEntity admin = new UserEntity();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setHoTen("Quản trị viên");
                admin.setEmail("admin@diemdanh.com");
                admin.setRole(UserEntity.Role.ADMIN);
                admin.setIsActive(true);
                userRepository.save(admin);
                System.out.println("Đã tạo tài khoản admin mặc định:");
                System.out.println("   Username: admin");
                System.out.println("   Password: admin123");
                System.out.println("   Email: admin@diemdanh.com");
            }
        } catch (Exception e) {
            System.err.println("Bỏ qua lỗi khởi tạo admin mặc định: " + e.getMessage());
        }

        // Tạo tài khoản giảng viên mẫu nếu chưa có (idempotent theo username/email)
        try {
            boolean hasGv1 = userRepository.existsByUsername("giangvien1") || userRepository.existsByEmail("giangvien1@hust.edu.vn");
            if (!hasGv1) {
                UserEntity giangVien = new UserEntity();
                giangVien.setUsername("giangvien1");
                giangVien.setPassword(passwordEncoder.encode("gv123"));
                giangVien.setHoTen("Nguyễn Văn A");
                giangVien.setEmail("giangvien1@hust.edu.vn");
                giangVien.setRole(UserEntity.Role.GIANGVIEN);
                giangVien.setKhoa("Công nghệ thông tin");
                giangVien.setBoMon("Khoa học máy tính");
                giangVien.setIsActive(true);
                userRepository.save(giangVien);
                System.out.println(" Đã tạo tài khoản giảng viên mẫu giangvien1 / gv123");
            }

            boolean hasGv2 = userRepository.existsByUsername("giangvien2") || userRepository.existsByEmail("giangvien2@hust.edu.vn");
            if (!hasGv2) {
                UserEntity giangVien2 = new UserEntity();
                giangVien2.setUsername("giangvien2");
                giangVien2.setPassword(passwordEncoder.encode("gv123"));
                giangVien2.setHoTen("Trần Thị B");
                giangVien2.setEmail("giangvien2@hust.edu.vn");
                giangVien2.setRole(UserEntity.Role.GIANGVIEN);
                giangVien2.setKhoa("Công nghệ thông tin");
                giangVien2.setBoMon("Hệ thống thông tin");
                giangVien2.setIsActive(true);
                userRepository.save(giangVien2);
                System.out.println(" Đã tạo tài khoản giảng viên mẫu giangvien2 / gv123");
            }
        } catch (Exception e) {
            System.err.println("Bỏ qua lỗi khởi tạo tài khoản giảng viên mẫu: " + e.getMessage());
        }
    }
}
