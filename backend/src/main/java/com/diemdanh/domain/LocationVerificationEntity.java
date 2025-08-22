package com.diemdanh.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "location_verifications")
@Getter
@Setter
public class LocationVerificationEntity {
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "session_id", nullable = false, length = 64)
    private String sessionId;

    @Column(name = "mssv", length = 32)
    private String mssv;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @Column(name = "accuracy", nullable = false)
    private Double accuracy;

    @Column(name = "expected_latitude")
    private Double expectedLatitude;

    @Column(name = "expected_longitude")
    private Double expectedLongitude;

    @Column(name = "distance_meters")
    private Double distanceMeters;

    @Column(name = "is_valid", nullable = false)
    private Boolean isValid = false;

    @Column(name = "verification_method", length = 32)
    private String verificationMethod; // GPS, NETWORK, PASSIVE

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "device_fingerprint", length = 128)
    private String deviceFingerprint;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
