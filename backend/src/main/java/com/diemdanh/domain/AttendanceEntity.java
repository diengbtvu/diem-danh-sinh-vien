package com.diemdanh.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "attendances")
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
    @JsonIgnore  // Không sử dụng field này nữa
    private String imageUrl;

    @Lob
    @Column(name = "image_data", columnDefinition = "LONGBLOB")
    @JsonIgnore  // Ẩn binary data khỏi JSON response
    private byte[] imageData;

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

    // Computed field cho frontend - trả về URL để lấy ảnh
    @JsonProperty("imageUrl")
    public String getImageUrl() {
        if (imageData != null && imageData.length > 0) {
            return "/api/attendances/" + id + "/image";
        }
        return null;
    }
}
