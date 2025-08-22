package com.diemdanh.repo;

import com.diemdanh.domain.DeviceFingerprintEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface DeviceFingerprintRepository extends JpaRepository<DeviceFingerprintEntity, Long> {
    
    Optional<DeviceFingerprintEntity> findByFingerprintHash(String fingerprintHash);
    
    List<DeviceFingerprintEntity> findByIsSuspiciousTrue();
    
    List<DeviceFingerprintEntity> findByUsageCountGreaterThan(Integer count);
    
    @Query("SELECT d FROM DeviceFingerprintEntity d WHERE d.lastUsedAt >= :since")
    List<DeviceFingerprintEntity> findRecentlyUsed(@Param("since") Instant since);
    
    @Query("SELECT d FROM DeviceFingerprintEntity d WHERE d.ipAddress = :ipAddress")
    List<DeviceFingerprintEntity> findByIpAddress(@Param("ipAddress") String ipAddress);
    
    @Query("SELECT COUNT(d) FROM DeviceFingerprintEntity d WHERE d.isSuspicious = true")
    long countSuspiciousDevices();
}
