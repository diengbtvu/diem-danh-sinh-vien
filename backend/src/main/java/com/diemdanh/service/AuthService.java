package com.diemdanh.service;

import com.diemdanh.domain.UserEntity;
import com.diemdanh.repo.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    /**
     * Đăng nhập user
     */
    public LoginResult login(String usernameOrEmail, String password) {
        Optional<UserEntity> userOpt = userRepository.findByUsernameOrEmail(usernameOrEmail);
        
        if (userOpt.isEmpty()) {
            return LoginResult.failure("Tài khoản không tồn tại");
        }
        
        UserEntity user = userOpt.get();
        
        if (!user.getIsActive()) {
            return LoginResult.failure("Tài khoản đã bị khóa");
        }
        
        if (!passwordEncoder.matches(password, user.getPassword())) {
            return LoginResult.failure("Mật khẩu không đúng");
        }
        
        // Cập nhật thời gian đăng nhập cuối
        user.updateLastLogin();
        userRepository.save(user);
        
        // Tạo JWT token
        String token = jwtService.generateToken(user);
        
        return LoginResult.success(user, token);
    }

    /**
     * Tạo tài khoản mới (chỉ admin mới được tạo)
     */
    public CreateUserResult createUser(String username, String password, String hoTen, 
                                     String email, UserEntity.Role role, String khoa, String boMon) {
        
        // Kiểm tra username đã tồn tại
        if (userRepository.existsByUsername(username)) {
            return CreateUserResult.failure("Username đã tồn tại");
        }
        
        // Kiểm tra email đã tồn tại
        if (userRepository.existsByEmail(email)) {
            return CreateUserResult.failure("Email đã tồn tại");
        }
        
        // Mã hóa mật khẩu
        String encodedPassword = passwordEncoder.encode(password);
        
        // Tạo user mới
        UserEntity user = new UserEntity(username, encodedPassword, hoTen, email, role);
        user.setKhoa(khoa);
        user.setBoMon(boMon);
        
        user = userRepository.save(user);
        
        return CreateUserResult.success(user);
    }

    /**
     * Thay đổi mật khẩu
     */
    public boolean changePassword(Long userId, String oldPassword, String newPassword) {
        Optional<UserEntity> userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            return false;
        }
        
        UserEntity user = userOpt.get();
        
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            return false;
        }
        
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        return true;
    }

    /**
     * Verify JWT token và lấy user
     */
    public Optional<UserEntity> verifyToken(String token) {
        try {
            String username = jwtService.extractUsername(token);
            if (username != null && jwtService.isTokenValid(token)) {
                return userRepository.findByUsername(username);
            }
        } catch (Exception e) {
            // Token không hợp lệ
        }
        return Optional.empty();
    }

    /**
     * Khóa/mở khóa tài khoản
     */
    public boolean toggleUserStatus(Long userId) {
        Optional<UserEntity> userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            return false;
        }
        
        UserEntity user = userOpt.get();
        user.setIsActive(!user.getIsActive());
        userRepository.save(user);
        
        return true;
    }

    // Result classes
    public static class LoginResult {
        private final boolean success;
        private final String message;
        private final UserEntity user;
        private final String token;

        private LoginResult(boolean success, String message, UserEntity user, String token) {
            this.success = success;
            this.message = message;
            this.user = user;
            this.token = token;
        }

        public static LoginResult success(UserEntity user, String token) {
            return new LoginResult(true, "Đăng nhập thành công", user, token);
        }

        public static LoginResult failure(String message) {
            return new LoginResult(false, message, null, null);
        }

        // Getters
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public UserEntity getUser() { return user; }
        public String getToken() { return token; }
    }

    public static class CreateUserResult {
        private final boolean success;
        private final String message;
        private final UserEntity user;

        private CreateUserResult(boolean success, String message, UserEntity user) {
            this.success = success;
            this.message = message;
            this.user = user;
        }

        public static CreateUserResult success(UserEntity user) {
            return new CreateUserResult(true, "Tạo tài khoản thành công", user);
        }

        public static CreateUserResult failure(String message) {
            return new CreateUserResult(false, message, null);
        }

        // Getters
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public UserEntity getUser() { return user; }
    }
}
