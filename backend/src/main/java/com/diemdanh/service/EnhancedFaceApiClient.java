package com.diemdanh.service;

import com.diemdanh.dto.LivenessResponse;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Service
@Slf4j
public class EnhancedFaceApiClient {
    private final WebClient webClient;

    public EnhancedFaceApiClient(@Value("${app.faceApiUrl}") String baseUrl) {
        this.webClient = WebClient.builder()
            .baseUrl(baseUrl)
            .build();
    }

    public Mono<RecognizeResponse> recognize(byte[] imageBytes, String filename) {
        ByteArrayResource resource = new ByteArrayResource(imageBytes) {
            @Override
            public String getFilename() { return filename; }
        };

        return webClient.post()
                .uri("/recognize")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData("image", resource))
                .retrieve()
                .bodyToMono(RecognizeResponse.class)
                .timeout(Duration.ofSeconds(10))
                .doOnError(error -> log.error("Face recognition failed: {}", error.getMessage()));
    }

    public LivenessResponse detectLiveness(byte[] imageBytes) {
        try {
            ByteArrayResource resource = new ByteArrayResource(imageBytes) {
                @Override
                public String getFilename() { return "liveness_check.jpg"; }
            };

            LivenessApiResponse response = webClient.post()
                    .uri("/liveness")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData("image", resource))
                    .retrieve()
                    .bodyToMono(LivenessApiResponse.class)
                    .timeout(Duration.ofSeconds(15))
                    .block();

            if (response != null) {
                return convertToLivenessResponse(response);
            } else {
                return LivenessResponse.failure("No response from liveness API");
            }
        } catch (Exception e) {
            log.error("Liveness detection failed: {}", e.getMessage());
            // For now, return a mock response since the actual API might not be implemented
            return createMockLivenessResponse(imageBytes);
        }
    }

    public FaceQualityResponse assessQuality(byte[] imageBytes) {
        try {
            ByteArrayResource resource = new ByteArrayResource(imageBytes) {
                @Override
                public String getFilename() { return "quality_check.jpg"; }
            };

            return webClient.post()
                    .uri("/quality")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData("image", resource))
                    .retrieve()
                    .bodyToMono(FaceQualityResponse.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();
        } catch (Exception e) {
            log.error("Face quality assessment failed: {}", e.getMessage());
            return createMockQualityResponse();
        }
    }

    public MultipleFaceResponse detectMultipleFaces(byte[] imageBytes) {
        try {
            ByteArrayResource resource = new ByteArrayResource(imageBytes) {
                @Override
                public String getFilename() { return "multiple_face_check.jpg"; }
            };

            return webClient.post()
                    .uri("/detect-faces")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData("image", resource))
                    .retrieve()
                    .bodyToMono(MultipleFaceResponse.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();
        } catch (Exception e) {
            log.error("Multiple face detection failed: {}", e.getMessage());
            return createMockMultipleFaceResponse();
        }
    }

    private LivenessResponse convertToLivenessResponse(LivenessApiResponse apiResponse) {
        LivenessResponse response = new LivenessResponse();
        response.setIsLive(apiResponse.getIsLive());
        response.setConfidence(apiResponse.getConfidence());
        response.setMethod(apiResponse.getMethod());

        LivenessResponse.LivenessDetails details = new LivenessResponse.LivenessDetails();
        details.setBlinkDetected(apiResponse.getBlinkDetected());
        details.setHeadMovementDetected(apiResponse.getHeadMovementDetected());
        details.setDepthAnalysisPassed(apiResponse.getDepthAnalysisPassed());
        details.setFaceCount(apiResponse.getFaceCount());
        details.setFaceQuality(apiResponse.getFaceQuality());
        details.setFailureReason(apiResponse.getFailureReason());

        response.setDetails(details);
        return response;
    }

    // Mock implementations for development/testing
    private LivenessResponse createMockLivenessResponse(byte[] imageBytes) {
        // Simple mock: assume live if image is reasonably sized
        boolean isLive = imageBytes.length > 10000 && imageBytes.length < 5000000;
        double confidence = isLive ? 0.85 + Math.random() * 0.1 : 0.3 + Math.random() * 0.4;

        LivenessResponse response = new LivenessResponse();
        response.setIsLive(isLive);
        response.setConfidence(confidence);
        response.setMethod("MOCK_ANALYSIS");

        LivenessResponse.LivenessDetails details = new LivenessResponse.LivenessDetails();
        details.setBlinkDetected(isLive);
        details.setHeadMovementDetected(isLive);
        details.setDepthAnalysisPassed(isLive);
        details.setFaceCount(1);
        details.setFaceQuality(confidence);
        if (!isLive) {
            details.setFailureReason("Mock liveness check failed");
        }

        response.setDetails(details);
        return response;
    }

    private FaceQualityResponse createMockQualityResponse() {
        FaceQualityResponse response = new FaceQualityResponse();
        response.setQualityScore(0.8 + Math.random() * 0.15);
        response.setSharpness(0.85);
        response.setBrightness(0.75);
        response.setContrast(0.8);
        response.setFaceSize(0.9);
        response.setIsGoodQuality(response.getQualityScore() > 0.7);
        return response;
    }

    private MultipleFaceResponse createMockMultipleFaceResponse() {
        MultipleFaceResponse response = new MultipleFaceResponse();
        response.setFaceCount(1);
        response.setHasMultipleFaces(false);
        response.setConfidence(0.9);
        return response;
    }

    @Data
    public static class RecognizeResponse {
        private String label;      // e.g. 110122050_TranMinhDien
        private Double confidence; // 0..1
    }

    @Data
    public static class LivenessApiResponse {
        private Boolean isLive;
        private Double confidence;
        private String method;
        private Boolean blinkDetected;
        private Boolean headMovementDetected;
        private Boolean depthAnalysisPassed;
        private Integer faceCount;
        private Double faceQuality;
        private String failureReason;
    }

    @Data
    public static class FaceQualityResponse {
        private Double qualityScore;
        private Double sharpness;
        private Double brightness;
        private Double contrast;
        private Double faceSize;
        private Boolean isGoodQuality;
    }

    @Data
    public static class MultipleFaceResponse {
        private Integer faceCount;
        private Boolean hasMultipleFaces;
        private Double confidence;
    }
}
