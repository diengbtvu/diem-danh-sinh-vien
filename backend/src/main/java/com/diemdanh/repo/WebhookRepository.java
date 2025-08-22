package com.diemdanh.repo;

import com.diemdanh.domain.WebhookEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface WebhookRepository extends JpaRepository<WebhookEntity, Long> {
    
    List<WebhookEntity> findByIsActiveTrue();
    
    List<WebhookEntity> findByCreatedBy(String createdBy);
    
    @Query("SELECT w FROM WebhookEntity w WHERE w.isActive = true AND w.events LIKE %:event%")
    List<WebhookEntity> findActiveWebhooksForEvent(@Param("event") String event);
    
    @Query("SELECT w FROM WebhookEntity w WHERE w.lastTriggeredAt >= :since")
    List<WebhookEntity> findRecentlyTriggered(@Param("since") Instant since);
    
    @Query("SELECT COUNT(w) FROM WebhookEntity w WHERE w.isActive = true")
    long countActiveWebhooks();
    
    @Query("SELECT w FROM WebhookEntity w WHERE w.failureCount > :threshold")
    List<WebhookEntity> findWebhooksWithHighFailureRate(@Param("threshold") Integer threshold);
}
