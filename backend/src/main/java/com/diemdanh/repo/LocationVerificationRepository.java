package com.diemdanh.repo;

import com.diemdanh.domain.LocationVerificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface LocationVerificationRepository extends JpaRepository<LocationVerificationEntity, Long> {
    
    List<LocationVerificationEntity> findBySessionId(String sessionId);
    
    List<LocationVerificationEntity> findByMssv(String mssv);
    
    List<LocationVerificationEntity> findByIsValidFalse();
    
    @Query("SELECT l FROM LocationVerificationEntity l WHERE l.sessionId = :sessionId AND l.mssv = :mssv")
    List<LocationVerificationEntity> findBySessionIdAndMssv(@Param("sessionId") String sessionId, @Param("mssv") String mssv);
    
    @Query("SELECT l FROM LocationVerificationEntity l WHERE l.createdAt >= :since")
    List<LocationVerificationEntity> findRecentVerifications(@Param("since") Instant since);
    
    @Query("SELECT COUNT(l) FROM LocationVerificationEntity l WHERE l.isValid = false")
    long countFailedVerifications();
    
    @Query("SELECT l FROM LocationVerificationEntity l WHERE l.distanceMeters > :maxDistance")
    List<LocationVerificationEntity> findByDistanceGreaterThan(@Param("maxDistance") Double maxDistance);
}
