package com.diemdanh.api.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AttendanceSubmitResponse {
    private String status; // ACCEPTED/REVIEW/REJECTED
    private String mssv;
    private String hoTen;
    private String capturedAt;
    private Double confidence;
}
