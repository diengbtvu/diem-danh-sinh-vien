package com.diemdanh.domain;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "visitor_stats")
public class VisitorStatsEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "visit_date", unique = true, nullable = false)
    private LocalDate visitDate;
    
    @Column(name = "daily_visits", nullable = false)
    private Long dailyVisits = 0L;
    
    @Column(name = "total_visits", nullable = false)
    private Long totalVisits = 0L;
    
    // Constructors
    public VisitorStatsEntity() {}
    
    public VisitorStatsEntity(LocalDate visitDate, Long dailyVisits, Long totalVisits) {
        this.visitDate = visitDate;
        this.dailyVisits = dailyVisits;
        this.totalVisits = totalVisits;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public LocalDate getVisitDate() {
        return visitDate;
    }
    
    public void setVisitDate(LocalDate visitDate) {
        this.visitDate = visitDate;
    }
    
    public Long getDailyVisits() {
        return dailyVisits;
    }
    
    public void setDailyVisits(Long dailyVisits) {
        this.dailyVisits = dailyVisits;
    }
    
    public Long getTotalVisits() {
        return totalVisits;
    }
    
    public void setTotalVisits(Long totalVisits) {
        this.totalVisits = totalVisits;
    }
}
