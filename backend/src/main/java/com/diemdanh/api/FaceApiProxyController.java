package com.diemdanh.api;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.TimeUnit;

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
    
    @PostMapping(value = "/predict", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> predictFace(@RequestPart("image") MultipartFile image) {
        try {
            log.info("Proxying face API request: filename={}, size={} bytes", 
                image.getOriginalFilename(), image.getSize());
            
            // Use OkHttp client (like curl internally uses)
            OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .writeTimeout(60, TimeUnit.SECONDS)
                .build();
            
            // Create multipart body exactly like curl
            okhttp3.RequestBody requestBody = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("image", image.getOriginalFilename(),
                    okhttp3.RequestBody.create(image.getBytes(), okhttp3.MediaType.parse("image/jpeg")))
                .build();
            
            // Build request exactly like curl
            String url = faceApiUrl + "/api/v1/face-recognition/predict/file";
            log.info("Calling Face API: {}", url);
            
            Request request = new Request.Builder()
                .url(url)
                .post(requestBody)
                .addHeader("Accept", "application/json")
                .build();
            
            // Execute request
            try (Response response = client.newCall(request).execute()) {
                String responseBody = response.body().string();
                log.info("Face API response: status={}, body={}", response.code(), responseBody);
                
                if (response.isSuccessful()) {
                    ObjectMapper mapper = new ObjectMapper();
                    Map responseMap = mapper.readValue(responseBody, Map.class);
                    return ResponseEntity.ok(responseMap);
                } else {
                    throw new IOException("HTTP " + response.code() + ": " + responseBody);
                }
            }
            
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