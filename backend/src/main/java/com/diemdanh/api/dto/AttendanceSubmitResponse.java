package com.diemdanh.api.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AttendanceSubmitResponse {
    private String status; // ACCEPTED/REVIEW/REJECTED/ALREADY_SUBMITTED
    private String mssv;
    private String hoTen;
    private String capturedAt;
    private Double confidence;
    private Boolean isDuplicate; // true if student has already submitted attendance
    private String message; // custom message for different scenarios
}
