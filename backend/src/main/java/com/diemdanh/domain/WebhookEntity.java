package com.diemdanh.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "webhooks")
@Getter
@Setter
public class WebhookEntity {
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "name", nullable = false, length = 128)
    private String name;

    @Column(name = "url", nullable = false, length = 512)
    private String url;

    @Column(name = "secret", length = 128)
    private String secret;

    @Column(name = "events", length = 512)
    private String events; // JSON array of event types

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "retry_count", nullable = false)
    private Integer retryCount = 3;

    @Column(name = "timeout_seconds", nullable = false)
    private Integer timeoutSeconds = 30;

    @Column(name = "last_triggered_at")
    private Instant lastTriggeredAt;

    @Column(name = "last_success_at")
    private Instant lastSuccessAt;

    @Column(name = "last_failure_at")
    private Instant lastFailureAt;

    @Column(name = "failure_count", nullable = false)
    private Integer failureCount = 0;

    @Column(name = "success_count", nullable = false)
    private Integer successCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "created_by", length = 64)
    private String createdBy;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "headers", columnDefinition = "TEXT")
    private String headers; // JSON object for custom headers

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;
}
