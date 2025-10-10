package com.diemdanh.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;

@Service
@Slf4j
public class FaceApiClient {
    private final WebClient webClient;

    // Base URL should be like: https://server.zettix.net
    public FaceApiClient(@Value("${app.faceApiUrl}") String baseUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .codecs(configurer -> configurer
                        .defaultCodecs()
                        .maxInMemorySize(10 * 1024 * 1024)) // 10MB limit
                .build();
    }

    public Mono<RecognizeResponse> recognize(byte[] imageBytes, String filename) {
        log.info("Face API request: imageSize={} bytes, filename={}", imageBytes.length, filename);
        
        // Convert image to base64
        String base64Image = java.util.Base64.getEncoder().encodeToString(imageBytes);
        
        // Create JSON payload
        java.util.Map<String, String> payload = new java.util.HashMap<>();
        payload.put("image", base64Image);

        // Call the real API: /api/v1/face-recognition/predict/base64
        log.info("Sending Face API request (base64) to: {}/api/v1/face-recognition/predict/base64, size={} bytes", webClient, imageBytes.length);
        
        return webClient.post()
                .uri("/api/v1/face-recognition/predict/base64")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(ExternalResponse.class)
                .timeout(Duration.ofSeconds(15))
                .doOnNext(response -> {
                    log.info("Face API raw response: success={}, totalFaces={}", 
                        response != null ? response.getSuccess() : null,
                        response != null ? response.getTotalFaces() : null);
                })
                .map(this::mapToRecognizeResponse)
                .doOnSuccess(response -> {
                    log.info("Face API call succeeded - response received");
                })
                .onErrorResume(ex -> {
                    log.error("Face API call failed: {}", ex.getMessage(), ex);
                    if (ex.getCause() != null) {
                        log.error("Face API error cause: {}", ex.getCause().getMessage());
                    }
                    return Mono.just(new RecognizeResponse());
                });
    }

    private RecognizeResponse mapToRecognizeResponse(ExternalResponse external) {
        RecognizeResponse resp = new RecognizeResponse();
        
        log.info("Face API response mapping - external: success={}, totalFaces={}, detections={}",
            external != null ? external.getSuccess() : null,
            external != null ? external.getTotalFaces() : null,
            external != null && external.getDetections() != null ? external.getDetections().size() : 0);
        
        if (external == null || external.getTotalFaces() == null || external.getTotalFaces() < 1
                || external.getDetections() == null || external.getDetections().isEmpty()) {
            log.warn("Face API: No faces detected or empty response");
            return resp; // empty -> treated as REVIEW upstream
        }
        
        ExternalResponse.Detection first = external.getDetections().get(0);
        log.info("Face API: Detected - class={}, confidence={}", first.getClassName(), first.getConfidence());
        
        resp.setLabel(first.getClassName());
        resp.setConfidence(first.getConfidence());
        return resp;
    }

    @Data
    public static class RecognizeResponse {
        private String label;      // e.g. 110122050_TranMinhDien
        private Double confidence; // 0..1
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ExternalResponse {
        private Boolean success;

        @JsonProperty("total_faces")
        private Integer totalFaces;

        private List<Detection> detections;

        @Data
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class Detection {
            @JsonProperty("face_id")
            private Integer faceId;

            @JsonProperty("class")
            private String className;

            private Double confidence;
        }
    }
}
