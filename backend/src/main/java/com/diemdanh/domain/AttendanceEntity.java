package com.diemdanh.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "attendances", uniqueConstraints = {
    @UniqueConstraint(name = "unique_session_student", columnNames = {"session_id", "mssv"})
})
@Getter
@Setter
public class AttendanceEntity {
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "qr_code_value", length = 512)
    private String qrCodeValue;

    @Column(name = "session_id", length = 64)
    private String sessionId;

    @Column(name = "mssv", length = 32)
    private String mssv;

    @CreationTimestamp
    @Column(name = "captured_at", nullable = false, updatable = false)
    private Instant capturedAt;

    @Column(name = "image_url")
    private String imageUrl;

    @Lob
    @Column(name = "image_base64", columnDefinition = "LONGTEXT")
    private String imageBase64;

    @Column(name = "face_label")
    private String faceLabel;

    @Column(name = "face_confidence")
    private Double faceConfidence;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 16)
    private Status status;

    @Column(name = "meta", columnDefinition = "TEXT")
    private String meta;

    public enum Status {
        ACCEPTED, REVIEW, REJECTED
    }
}
