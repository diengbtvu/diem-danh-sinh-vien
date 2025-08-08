package com.diemdanh.api.dto;

public record AttendanceConfigResponse(
    int qrBWindowSeconds,
    int qrRotateSeconds,
    int qrStepTolerance,
    int sessionTokenValidityHours,
    int maxImageSizeMB,
    String frontendUrlTemplate
) {
}
