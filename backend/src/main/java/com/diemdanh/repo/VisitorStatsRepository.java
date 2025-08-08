package com.diemdanh.repo;

import com.diemdanh.domain.VisitorStatsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.Optional;

public interface VisitorStatsRepository extends JpaRepository<VisitorStatsEntity, Long> {
    
    Optional<VisitorStatsEntity> findByVisitDate(LocalDate visitDate);
    
    @Query("SELECT COALESCE(MAX(v.totalVisits), 0) FROM VisitorStatsEntity v")
    Long findMaxTotalVisits();
    
    @Query("SELECT COUNT(DISTINCT v.visitDate) FROM VisitorStatsEntity v")
    Long countDistinctDays();
}
