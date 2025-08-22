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

    // Base URL should be like: http://apimaycogiau.zettix.net
    public FaceApiClient(@Value("${app.faceApiUrl}") String baseUrl) {
        this.webClient = WebClient.builder().baseUrl(baseUrl).build();
    }

    public Mono<RecognizeResponse> recognize(byte[] imageBytes, String filename) {
        log.info("Starting face recognition API call for file: {}, size: {} bytes", filename, imageBytes.length);
        
        // Use MultipartBodyBuilder approach to exactly match curl behavior  
        ByteArrayResource resource = new ByteArrayResource(imageBytes) {
            @Override
            public String getFilename() { 
                return filename != null ? filename : "image.jpg"; 
            }
        };

        // Build multipart data exactly like curl does
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("image", resource)
                .header("Content-Disposition", 
                    String.format("form-data; name=\"image\"; filename=\"%s\"", resource.getFilename()))
                .contentType(MediaType.IMAGE_JPEG);

        log.info("Sending request to Face API: /api/v1/face-recognition/predict/file with filename={}", resource.getFilename());
        log.info("Using MultipartBodyBuilder with proper headers to match curl format");
        
        // Call the real API: /api/v1/face-recognition/predict/file
        return webClient.post()
                .uri("/api/v1/face-recognition/predict/file")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(ExternalResponse.class)
                .timeout(Duration.ofSeconds(15))
                .doOnNext(externalResponse -> {
                    log.info("Face API response received successfully!");
                    log.info("Response: success={}, totalFaces={}, detections={}", 
                        externalResponse != null ? externalResponse.getSuccess() : null,
                        externalResponse != null ? externalResponse.getTotalFaces() : null,
                        externalResponse != null && externalResponse.getDetections() != null ? 
                            externalResponse.getDetections().size() : 0);
                    if (externalResponse != null && externalResponse.getDetections() != null && !externalResponse.getDetections().isEmpty()) {
                        log.info("First detection: className={}, confidence={}", 
                            externalResponse.getDetections().get(0).getClassName(),
                            externalResponse.getDetections().get(0).getConfidence());
                    }
                })
                .map(this::mapToRecognizeResponse)
                .doOnNext(recognizeResponse -> {
                    log.info("Mapped response: label={}, confidence={}", 
                        recognizeResponse.getLabel(), recognizeResponse.getConfidence());
                })
                .onErrorResume(ex -> {
                    log.error("Face API call failed: {}", ex.getMessage(), ex);
                    if (ex instanceof org.springframework.web.reactive.function.client.WebClientResponseException) {
                        org.springframework.web.reactive.function.client.WebClientResponseException webEx = 
                            (org.springframework.web.reactive.function.client.WebClientResponseException) ex;
                        log.error("HTTP Status: {}, Response Body: {}", 
                            webEx.getStatusCode(), webEx.getResponseBodyAsString());
                        log.error("Request Headers would have been: Content-Type: multipart/form-data");
                    }
                    return Mono.just(new RecognizeResponse());
                });
    }

    private RecognizeResponse mapToRecognizeResponse(ExternalResponse external) {
        RecognizeResponse resp = new RecognizeResponse();
        if (external == null || external.getTotalFaces() == null || external.getTotalFaces() < 1
                || external.getDetections() == null || external.getDetections().isEmpty()) {
            return resp; // empty -> treated as REVIEW upstream
        }
        ExternalResponse.Detection first = external.getDetections().get(0);
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
