package com.diemdanh.api;

import com.diemdanh.domain.UserEntity;
import com.diemdanh.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {
    "https://zettix.net",
    "https://www.zettix.net",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:8000",
    "http://localhost:3000",
    "http://127.0.0.1:8000",
    "http://14.225.220.60:8000"
}, allowCredentials = "false")
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * Đăng nhập
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        AuthService.LoginResult result = authService.login(request.getUsernameOrEmail(), request.getPassword());
        
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
            userData.put("lastLoginAt", user.getLastLoginAt());
            
            response.put("user", userData);
            response.put("token", result.getToken());
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * Verify token và lấy thông tin user
     */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyToken(@RequestBody VerifyTokenRequest request) {
        var userOpt = authService.verifyToken(request.getToken());
        
        Map<String, Object> response = new HashMap<>();
        
        if (userOpt.isPresent()) {
            UserEntity user = userOpt.get();
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("username", user.getUsername());
            userData.put("hoTen", user.getHoTen());
            userData.put("email", user.getEmail());
            userData.put("role", user.getRole().name());
            userData.put("khoa", user.getKhoa());
            userData.put("boMon", user.getBoMon());
            userData.put("lastLoginAt", user.getLastLoginAt());
            
            response.put("success", true);
            response.put("user", userData);
        } else {
            response.put("success", false);
            response.put("message", "Token không hợp lệ");
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * Đăng xuất (client side chỉ cần xóa token)
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Đăng xuất thành công");
        return ResponseEntity.ok(response);
    }

    /**
     * Thay đổi mật khẩu
     */
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody ChangePasswordRequest request) {
        boolean success = authService.changePassword(request.getUserId(), request.getOldPassword(), request.getNewPassword());
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", success);
        response.put("message", success ? "Đổi mật khẩu thành công" : "Mật khẩu cũ không đúng");
        
        return ResponseEntity.ok(response);
    }

    // Request DTOs
    public static class LoginRequest {
        private String usernameOrEmail;
        private String password;

        // Getters and setters
        public String getUsernameOrEmail() { return usernameOrEmail; }
        public void setUsernameOrEmail(String usernameOrEmail) { this.usernameOrEmail = usernameOrEmail; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class VerifyTokenRequest {
        private String token;

        // Getters and setters
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
    }

    public static class ChangePasswordRequest {
        private Long userId;
        private String oldPassword;
        private String newPassword;

        // Getters and setters
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getOldPassword() { return oldPassword; }
        public void setOldPassword(String oldPassword) { this.oldPassword = oldPassword; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }
}
