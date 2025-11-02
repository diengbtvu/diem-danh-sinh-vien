package com.diemdanh.repo;

import com.diemdanh.domain.SessionEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

public interface SessionRepository extends JpaRepository<SessionEntity, String> {

    Page<SessionEntity> findByMaLopContainingIgnoreCase(String maLop, Pageable pageable);

    Page<SessionEntity> findBySessionIdContainingIgnoreCaseOrMaLopContainingIgnoreCase(
        String sessionId, String maLop, Pageable pageable);

    List<SessionEntity> findByMaLopOrderByStartAtDesc(String maLop);

    @Query("SELECT s FROM SessionEntity s WHERE s.startAt BETWEEN :start AND :end ORDER BY s.startAt DESC")
    List<SessionEntity> findByDateRange(@Param("start") Instant start, @Param("end") Instant end);

    @Query("SELECT COUNT(s) FROM SessionEntity s WHERE s.maLop = :maLop")
    long countByMaLop(@Param("maLop") String maLop);

    @Query("SELECT DISTINCT s.maLop FROM SessionEntity s ORDER BY s.maLop")
    List<String> findDistinctMaLop();

    // Methods for teacher-specific queries
    Page<SessionEntity> findByCreatedByUsernameAndMaLopContainingIgnoreCase(String username, String maLop, Pageable pageable);

    Page<SessionEntity> findByCreatedByUsername(String username, Pageable pageable);

    @Query("SELECT DISTINCT s.maLop FROM SessionEntity s WHERE s.createdBy.username = :username ORDER BY s.maLop")
    List<String> findDistinctMaLopByCreatedByUsername(@Param("username") String username);

    @Query("SELECT s.maLop, COUNT(s) FROM SessionEntity s WHERE s.createdBy.username = :username GROUP BY s.maLop")
    List<Object[]> findClassStatsByCreatedByUsername(@Param("username") String username);

    long countByCreatedByUsername(String username);

    long countByCreatedByUsernameAndEndAtAfter(String username, Instant endAt);

    // Find specific session by ID and verify ownership
    @Query("SELECT s FROM SessionEntity s WHERE s.sessionId = :sessionId AND s.createdBy.username = :username")
    SessionEntity findBySessionIdAndCreatedByUsername(@Param("sessionId") String sessionId, @Param("username") String username);

    // Analytics queries
    List<SessionEntity> findByStartAtBetween(Instant start, Instant end);
    
    List<SessionEntity> findByMaLopAndStartAtBetween(String maLop, Instant start, Instant end);
    
    List<SessionEntity> findByCreatedByUsernameAndStartAtBetween(String username, Instant start, Instant end);
}

