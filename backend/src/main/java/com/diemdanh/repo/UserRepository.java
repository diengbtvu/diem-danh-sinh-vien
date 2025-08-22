package com.diemdanh.repo;

import com.diemdanh.domain.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    
    // Tìm user theo username
    Optional<UserEntity> findByUsername(String username);
    
    // Tìm user theo email
    Optional<UserEntity> findByEmail(String email);
    
    // Tìm user theo username hoặc email
    @Query("SELECT u FROM UserEntity u WHERE u.username = :usernameOrEmail OR u.email = :usernameOrEmail")
    Optional<UserEntity> findByUsernameOrEmail(@Param("usernameOrEmail") String usernameOrEmail);
    
    // Tìm tất cả user active
    List<UserEntity> findByIsActiveTrue();
    
    // Tìm user theo role
    List<UserEntity> findByRole(UserEntity.Role role);
    
    // Tìm giảng viên theo khoa
    List<UserEntity> findByRoleAndKhoa(UserEntity.Role role, String khoa);
    
    // Tìm giảng viên theo bộ môn
    List<UserEntity> findByRoleAndBoMon(UserEntity.Role role, String boMon);
    
    // Kiểm tra username đã tồn tại
    boolean existsByUsername(String username);
    
    // Kiểm tra email đã tồn tại
    boolean existsByEmail(String email);
    
    // Đếm số lượng admin
    @Query("SELECT COUNT(u) FROM UserEntity u WHERE u.role = 'ADMIN' AND u.isActive = true")
    long countActiveAdmins();
    
    // Đếm số lượng giảng viên theo khoa
    @Query("SELECT COUNT(u) FROM UserEntity u WHERE u.role = 'GIANGVIEN' AND u.khoa = :khoa AND u.isActive = true")
    long countActiveGiangVienByKhoa(@Param("khoa") String khoa);
}
