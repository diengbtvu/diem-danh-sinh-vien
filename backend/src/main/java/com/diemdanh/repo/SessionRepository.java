package com.diemdanh.repo;

import com.diemdanh.domain.SessionEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
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
}

