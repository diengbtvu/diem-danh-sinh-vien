package com.diemdanh.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "device_fingerprints")
@Getter
@Setter
public class DeviceFingerprintEntity {
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "fingerprint_hash", nullable = false, length = 128, unique = true)
    private String fingerprintHash;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    @Column(name = "screen_resolution", length = 32)
    private String screenResolution;

    @Column(name = "timezone", length = 64)
    private String timezone;

    @Column(name = "language", length = 16)
    private String language;

    @Column(name = "platform", length = 64)
    private String platform;

    @Column(name = "canvas_fingerprint", length = 128)
    private String canvasFingerprint;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "is_suspicious", nullable = false)
    private Boolean isSuspicious = false;

    @Column(name = "usage_count", nullable = false)
    private Integer usageCount = 1;

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
