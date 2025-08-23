package com.diemdanh.repo;

import com.diemdanh.domain.AttendanceEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface AttendanceRepository extends JpaRepository<AttendanceEntity, UUID> {
    Page<AttendanceEntity> findByQrCodeValueContaining(String sessionId, Pageable pageable);
    Page<AttendanceEntity> findBySessionId(String sessionId, Pageable pageable);
    Page<AttendanceEntity> findBySessionIdAndStatus(String sessionId, AttendanceEntity.Status status, Pageable pageable);
    List<AttendanceEntity> findBySessionIdAndStatus(String sessionId, AttendanceEntity.Status status);
    Page<AttendanceEntity> findByMssv(String mssv, Pageable pageable);
    Page<AttendanceEntity> findByMssvContainingIgnoreCase(String mssv, Pageable pageable);

    long countBySessionIdAndStatus(String sessionId, AttendanceEntity.Status status);
    long countBySessionId(String sessionId);
    long countByMssv(String mssv);
    long countBySessionIdIn(List<String> sessionIds);

    @Query("SELECT a FROM AttendanceEntity a WHERE a.sessionId = :sessionId AND a.capturedAt BETWEEN :start AND :end ORDER BY a.capturedAt DESC")
    List<AttendanceEntity> findBySessionIdAndDateRange(@Param("sessionId") String sessionId,
                                                       @Param("start") Instant start,
                                                       @Param("end") Instant end);

    @Query("SELECT a FROM AttendanceEntity a WHERE a.mssv = :mssv AND a.sessionId = :sessionId")
    List<AttendanceEntity> findByMssvAndSessionId(@Param("mssv") String mssv, @Param("sessionId") String sessionId);

    @Query("SELECT COUNT(a) FROM AttendanceEntity a WHERE a.capturedAt >= :since")
    long countRecentAttendances(@Param("since") Instant since);

    @Query("SELECT a.status, COUNT(a) FROM AttendanceEntity a WHERE a.sessionId = :sessionId GROUP BY a.status")
    List<Object[]> getStatusStatsBySessionId(@Param("sessionId") String sessionId);

    @Query("SELECT a FROM AttendanceEntity a WHERE a.capturedAt BETWEEN :start AND :end ORDER BY a.capturedAt DESC")
    List<AttendanceEntity> findByDateRange(@Param("start") Instant start, @Param("end") Instant end);

    @Query("SELECT a FROM AttendanceEntity a JOIN SessionEntity s ON a.sessionId = s.sessionId WHERE a.capturedAt BETWEEN :start AND :end AND s.maLop = :maLop ORDER BY a.capturedAt DESC")
    List<AttendanceEntity> findByDateRangeAndClass(@Param("start") Instant start, @Param("end") Instant end, @Param("maLop") String maLop);

    @Query("SELECT a FROM AttendanceEntity a JOIN SessionEntity s ON a.sessionId = s.sessionId WHERE s.maLop = :maLop ORDER BY a.capturedAt DESC")
    List<AttendanceEntity> findByClassMaLop(@Param("maLop") String maLop);

    // Additional methods for teacher session detail page
    Page<AttendanceEntity> findBySessionIdAndStatusAndMssvContainingIgnoreCase(String sessionId, AttendanceEntity.Status status, String mssv, Pageable pageable);
    Page<AttendanceEntity> findBySessionIdAndMssvContainingIgnoreCase(String sessionId, String mssv, Pageable pageable);
}
