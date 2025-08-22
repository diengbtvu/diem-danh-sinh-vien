package com.diemdanh.dto;

import lombok.Data;

@Data
public class LivenessResponse {
    private Boolean isLive;
    private Double confidence;
    private String method; // BLINK, HEAD_MOVEMENT, DEPTH_ANALYSIS
    private LivenessDetails details;

    @Data
    public static class LivenessDetails {
        private Boolean blinkDetected;
        private Boolean headMovementDetected;
        private Boolean depthAnalysisPassed;
        private Integer faceCount;
        private Double faceQuality;
        private String failureReason;
    }

    public static LivenessResponse success(Double confidence, String method) {
        LivenessResponse response = new LivenessResponse();
        response.setIsLive(true);
        response.setConfidence(confidence);
        response.setMethod(method);
        return response;
    }

    public static LivenessResponse failure(String reason) {
        LivenessResponse response = new LivenessResponse();
        response.setIsLive(false);
        response.setConfidence(0.0);
        LivenessDetails details = new LivenessDetails();
        details.setFailureReason(reason);
        response.setDetails(details);
        return response;
    }
}
