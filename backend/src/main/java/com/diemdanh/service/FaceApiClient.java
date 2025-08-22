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
        ByteArrayResource resource = new ByteArrayResource(imageBytes) {
            @Override
            public String getFilename() { return filename; }
        };

        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("image", resource)
                .filename(filename != null ? filename : "image.jpg")
                .contentType(MediaType.APPLICATION_OCTET_STREAM);

        // Call the real API: /api/v1/face-recognition/predict/file
        return webClient.post()
                .uri("/api/v1/face-recognition/predict/file")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(ExternalResponse.class)
                .timeout(Duration.ofSeconds(15))
                .map(this::mapToRecognizeResponse)
                .onErrorResume(ex -> {
                    log.error("Face API call failed: {}", ex.getMessage());
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
