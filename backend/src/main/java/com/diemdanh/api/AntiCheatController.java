package com.diemdanh.api;

import com.diemdanh.dto.AntiCheatRequest;
import com.diemdanh.dto.LivenessResponse;
import com.diemdanh.service.AntiCheatService;
import com.diemdanh.service.EnhancedFaceApiClient;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/anti-cheat")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {
    "https://zettix.net",
    "https://www.zettix.net",
    "http://localhost:8000",
    "http://localhost:5173",
    "http://localhost:5174"
}, allowCredentials = "true")
public class AntiCheatController {

    private final AntiCheatService antiCheatService;
    private final EnhancedFaceApiClient enhancedFaceApiClient;

    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyAntiCheat(
            @RequestBody AntiCheatRequest request,
            HttpServletRequest httpRequest) {
        
        try {
            // Add IP address to request
            String ipAddress = getClientIpAddress(httpRequest);
            request.setIpAddress(ipAddress);
            request.setUserAgent(httpRequest.getHeader("User-Agent"));

            boolean isValid = antiCheatService.performAntiCheatVerification(request);

            Map<String, Object> response = new HashMap<>();
            response.put("isValid", isValid);
            response.put("timestamp", System.currentTimeMillis());

            if (!isValid) {
                response.put("message", "Anti-cheat verification failed");
                response.put("details", "Location or device verification failed");
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Anti-cheat verification error: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("isValid", false);
            errorResponse.put("error", "Verification failed");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/verify-location")
    public ResponseEntity<Map<String, Object>> verifyLocation(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam String sessionId) {
        
        try {
            boolean isValid = antiCheatService.verifyLocation(latitude, longitude, sessionId);

            Map<String, Object> response = new HashMap<>();
            response.put("isValid", isValid);
            response.put("latitude", latitude);
            response.put("longitude", longitude);
            response.put("sessionId", sessionId);
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Location verification error: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("isValid", false);
            errorResponse.put("error", "Location verification failed");
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/generate-fingerprint")
    public ResponseEntity<Map<String, Object>> generateDeviceFingerprint(
            HttpServletRequest request) {
        
        try {
            String fingerprint = antiCheatService.generateDeviceFingerprint(request);

            Map<String, Object> response = new HashMap<>();
            response.put("fingerprint", fingerprint);
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Device fingerprint generation error: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Fingerprint generation failed");
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/verify-liveness")
    public ResponseEntity<LivenessResponse> verifyLiveness(
            @RequestParam("image") MultipartFile image) {
        
        try {
            if (image.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(LivenessResponse.failure("No image provided"));
            }

            LivenessResponse response = antiCheatService.verifyLiveness(image);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Liveness verification error: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(LivenessResponse.failure("Liveness verification failed: " + e.getMessage()));
        }
    }

    @PostMapping("/assess-quality")
    public ResponseEntity<EnhancedFaceApiClient.FaceQualityResponse> assessImageQuality(
            @RequestParam("image") MultipartFile image) {
        
        try {
            if (image.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            byte[] imageBytes = image.getBytes();
            EnhancedFaceApiClient.FaceQualityResponse response = 
                enhancedFaceApiClient.assessQuality(imageBytes);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Image quality assessment error: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/detect-multiple-faces")
    public ResponseEntity<EnhancedFaceApiClient.MultipleFaceResponse> detectMultipleFaces(
            @RequestParam("image") MultipartFile image) {
        
        try {
            if (image.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            byte[] imageBytes = image.getBytes();
            EnhancedFaceApiClient.MultipleFaceResponse response = 
                enhancedFaceApiClient.detectMultipleFaces(imageBytes);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Multiple face detection error: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAntiCheatStats() {
        try {
            // This would typically fetch from repositories
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalVerifications", 1250);
            stats.put("failedVerifications", 45);
            stats.put("suspiciousDevices", 12);
            stats.put("locationFailures", 23);
            stats.put("livenessFailures", 22);
            stats.put("successRate", 96.4);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error fetching anti-cheat stats: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}
