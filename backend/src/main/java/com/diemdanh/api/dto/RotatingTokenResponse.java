package com.diemdanh.api.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RotatingTokenResponse {
    private String rotatingToken;
    private long timeStep;
    private long validForMs;
    private String qrUrl;
}