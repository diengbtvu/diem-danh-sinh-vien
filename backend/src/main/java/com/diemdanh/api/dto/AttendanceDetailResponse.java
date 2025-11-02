package com.diemdanh.api.dto;

import com.diemdanh.domain.AttendanceEntity;
import lombok.Data;
import lombok.Builder;

import java.time.Instant;

@Data
@Builder
public class AttendanceDetailResponse {
    private java.util.UUID id;
    private String sessionId;
    private String mssv;
    private String hoTen;
    private String maLop;
    private String faceLabel;
    private Double faceConfidence;
    private AttendanceEntity.Status status;
    private Instant capturedAt;
    private String imageUrl;
    
    // Additional computed fields
    private boolean studentFound;
    private String displayName;  // "MSSV - Họ tên" or "MSSV - Không tìm thấy"
}
