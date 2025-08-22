package com.diemdanh.api;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/face-proxy")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {
    "https://zettix.net",
    "https://www.zettix.net", 
    "https://diemdanh.zettix.net",
    "http://localhost:8000",
    "http://localhost:5173",
    "http://localhost:5174"
}, allowCredentials = "true")
public class FaceApiProxyController {
    
    @Value("${app.faceApiUrl:http://apimaycogiau.zettix.net}")
    private String faceApiUrl;
    
    @PostMapping(value = "/predict", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> predictFace(@RequestPart("image") MultipartFile image) {
        try {
            log.info("Proxying face API request: filename={}, size={} bytes", 
                image.getOriginalFilename(), image.getSize());
            
            // Prepare RestTemplate
            RestTemplate restTemplate = new RestTemplate();
            
            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.set("Accept", "application/json");
            
            // Prepare multipart body
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("image", image.getResource());
            
            HttpEntity<MultiValueMap<String, Object>> requestEntity = 
                new HttpEntity<>(body, headers);
            
            // Call Face API
            String url = faceApiUrl + "/api/v1/face-recognition/predict/file";
            log.info("Calling Face API: {}", url);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                url, requestEntity, Map.class);
            
            log.info("Face API response: status={}, body={}", 
                response.getStatusCode(), response.getBody());
            
            return ResponseEntity.ok(response.getBody());
            
        } catch (Exception e) {
            log.error("Face API proxy failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "success", false,
                    "error", "Face API call failed: " + e.getMessage()
                ));
        }
    }
}