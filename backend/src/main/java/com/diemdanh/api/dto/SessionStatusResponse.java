package com.diemdanh.api.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SessionStatusResponse {
    private String sessionId;
    private boolean qr2Active;
    private Long validForMs; // remaining time for QR2, null if not active
    private String sessionToken; // always provided to render QR A
    private String rotatingToken; // only when qr2Active
}

