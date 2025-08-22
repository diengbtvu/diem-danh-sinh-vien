package com.diemdanh.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "users")
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String hoTen;

    @Column(unique = true, nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column
    private String khoa; // Khoa (cho giảng viên)

    @Column
    private String boMon; // Bộ môn (cho giảng viên)

    @Column
    private Boolean isActive = true;

    @Column
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime lastLoginAt;

    // Relationship: Giảng viên có thể tạo nhiều session
    @OneToMany(mappedBy = "createdBy", fetch = FetchType.LAZY)
    private Set<SessionEntity> createdSessions;

    public enum Role {
        ADMIN,      // Quản trị viên - xem tất cả
        GIANGVIEN   // Giảng viên - chỉ xem của mình
    }

    // Constructors
    public UserEntity() {
        this.createdAt = LocalDateTime.now();
    }

    public UserEntity(String username, String password, String hoTen, String email, Role role) {
        this();
        this.username = username;
        this.password = password;
        this.hoTen = hoTen;
        this.email = email;
        this.role = role;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getHoTen() {
        return hoTen;
    }

    public void setHoTen(String hoTen) {
        this.hoTen = hoTen;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getKhoa() {
        return khoa;
    }

    public void setKhoa(String khoa) {
        this.khoa = khoa;
    }

    public String getBoMon() {
        return boMon;
    }

    public void setBoMon(String boMon) {
        this.boMon = boMon;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(LocalDateTime lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }

    public Set<SessionEntity> getCreatedSessions() {
        return createdSessions;
    }

    public void setCreatedSessions(Set<SessionEntity> createdSessions) {
        this.createdSessions = createdSessions;
    }

    // Helper methods
    public boolean isAdmin() {
        return Role.ADMIN.equals(this.role);
    }

    public boolean isGiangVien() {
        return Role.GIANGVIEN.equals(this.role);
    }

    public void updateLastLogin() {
        this.lastLoginAt = LocalDateTime.now();
    }
}
