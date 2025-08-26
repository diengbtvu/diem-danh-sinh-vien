package com.diemdanh.api;

import com.diemdanh.domain.UserEntity;
import com.diemdanh.repo.UserRepository;
import com.diemdanh.repo.SessionRepository;
import com.diemdanh.repo.AttendanceRepository;
import com.diemdanh.repo.StudentRepository;
import com.diemdanh.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(origins = {
    "https://zettix.net",
    "https://www.zettix.net",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:8000",
    "http://localhost:3000",
    "http://127.0.0.1:8000",
    "http://14.225.220.60:8000"
}, allowCredentials = "true")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private AuthService authService;

    /**
     * Lấy dashboard statistics cho admin
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        Map<String, Object> stats = new HashMap<>();
        
        // Thống kê users
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.findByIsActiveTrue().size();
        long totalAdmins = userRepository.countActiveAdmins();
        long totalGiangVien = userRepository.findByRole(UserEntity.Role.GIANGVIEN).size();
        
        // Thống kê sessions
        long totalSessions = sessionRepository.count();
        
        // Thống kê attendances
        long totalAttendances = attendanceRepository.count();
        
        // Thống kê students
        long totalStudents = studentRepository.count();
        
        stats.put("users", Map.of(
            "total", totalUsers,
            "active", activeUsers,
            "admins", totalAdmins,
            "giangVien", totalGiangVien
        ));
        
        stats.put("sessions", Map.of(
            "total", totalSessions
        ));
        
        stats.put("attendances", Map.of(
            "total", totalAttendances
        ));
        
        stats.put("students", Map.of(
            "total", totalStudents
        ));
        
        return ResponseEntity.ok(Map.of("success", true, "data", stats));
    }

    /**
     * Lấy danh sách tất cả users
     */
    @GetMapping("")
    public ResponseEntity<Map<String, Object>> getAllUsers() {
        List<UserEntity> users = userRepository.findAll();
        
        List<Map<String, Object>> userList = users.stream().map(user -> {
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("username", user.getUsername());
            userData.put("hoTen", user.getHoTen());
            userData.put("email", user.getEmail());
            userData.put("role", user.getRole().name());
            userData.put("khoa", user.getKhoa());
            userData.put("boMon", user.getBoMon());
            userData.put("isActive", user.getIsActive());
            userData.put("createdAt", user.getCreatedAt());
            userData.put("lastLoginAt", user.getLastLoginAt());
            return userData;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(Map.of("success", true, "data", userList));
    }

    /**
     * Tạo user mới (chỉ admin)
     */
    @PostMapping("")
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody CreateUserRequest request) {
        AuthService.CreateUserResult result = authService.createUser(
            request.getUsername(),
            request.getPassword(),
            request.getHoTen(),
            request.getEmail(),
            UserEntity.Role.valueOf(request.getRole()),
            request.getKhoa(),
            request.getBoMon()
        );
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", result.isSuccess());
        response.put("message", result.getMessage());
        
        if (result.isSuccess()) {
            UserEntity user = result.getUser();
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("username", user.getUsername());
            userData.put("hoTen", user.getHoTen());
            userData.put("email", user.getEmail());
            userData.put("role", user.getRole().name());
            userData.put("khoa", user.getKhoa());
            userData.put("boMon", user.getBoMon());
            
            response.put("data", userData);
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * Khóa/mở khóa user
     */
    @PostMapping("/{userId}/toggle-status")
    public ResponseEntity<Map<String, Object>> toggleUserStatus(@PathVariable Long userId) {
        boolean success = authService.toggleUserStatus(userId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", success);
        response.put("message", success ? "Cập nhật trạng thái thành công" : "Không tìm thấy user");
        
        return ResponseEntity.ok(response);
    }

    /**
     * Cập nhật thông tin user
     */
    @PutMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable Long userId, @RequestBody UpdateUserRequest request) {
        var userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Không tìm thấy user"));
        }
        
        UserEntity user = userOpt.get();
        
        // Cập nhật thông tin
        if (request.getHoTen() != null && !request.getHoTen().trim().isEmpty()) {
            user.setHoTen(request.getHoTen().trim());
        }
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            user.setEmail(request.getEmail().trim());
        }
        if (request.getRole() != null && !request.getRole().trim().isEmpty()) {
            try {
                user.setRole(UserEntity.Role.valueOf(request.getRole()));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.ok(Map.of("success", false, "message", "Vai trò không hợp lệ"));
            }
        }
        if (request.getKhoa() != null) {
            user.setKhoa(request.getKhoa().trim());
        }
        if (request.getBoMon() != null) {
            user.setBoMon(request.getBoMon().trim());
        }
        
        try {
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật thông tin thành công"));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Lỗi cập nhật thông tin"));
        }
    }

    /**
     * Lấy thông tin user theo ID
     */
    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable Long userId) {
        var userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Không tìm thấy user"));
        }
        
        UserEntity user = userOpt.get();
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("username", user.getUsername());
        userData.put("hoTen", user.getHoTen());
        userData.put("email", user.getEmail());
        userData.put("role", user.getRole().name());
        userData.put("khoa", user.getKhoa());
        userData.put("boMon", user.getBoMon());
        userData.put("isActive", user.getIsActive());
        userData.put("createdAt", user.getCreatedAt());
        userData.put("lastLoginAt", user.getLastLoginAt());
        
        return ResponseEntity.ok(Map.of("success", true, "data", userData));
    }

    // Request DTOs
    public static class CreateUserRequest {
        private String username;
        private String password;
        private String hoTen;
        private String email;
        private String role;
        private String khoa;
        private String boMon;

        // Getters and setters
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getHoTen() { return hoTen; }
        public void setHoTen(String hoTen) { this.hoTen = hoTen; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getKhoa() { return khoa; }
        public void setKhoa(String khoa) { this.khoa = khoa; }
        public String getBoMon() { return boMon; }
        public void setBoMon(String boMon) { this.boMon = boMon; }
    }

    public static class UpdateUserRequest {
        private String hoTen;
        private String email;
        private String role;
        private String khoa;
        private String boMon;

        // Getters and setters
        public String getHoTen() { return hoTen; }
        public void setHoTen(String hoTen) { this.hoTen = hoTen; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getKhoa() { return khoa; }
        public void setKhoa(String khoa) { this.khoa = khoa; }
        public String getBoMon() { return boMon; }
        public void setBoMon(String boMon) { this.boMon = boMon; }
    }
}
