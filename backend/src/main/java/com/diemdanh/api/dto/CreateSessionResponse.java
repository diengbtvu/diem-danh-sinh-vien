package com.diemdanh.api.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CreateSessionResponse {
    private String sessionId;
    private String sessionToken;
    private int rotateSeconds;
    private String qrUrlTemplate;
    private String expiresAt;
}
