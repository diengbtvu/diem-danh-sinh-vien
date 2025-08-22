package com.diemdanh.service;

import com.diemdanh.domain.DeviceFingerprintEntity;
import com.diemdanh.domain.LocationVerificationEntity;
import com.diemdanh.domain.SessionEntity;
import com.diemdanh.dto.AntiCheatRequest;
import com.diemdanh.dto.LivenessResponse;
import com.diemdanh.repo.DeviceFingerprintRepository;
import com.diemdanh.repo.LocationVerificationRepository;
import com.diemdanh.repo.SessionRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AntiCheatService {
    
    private final DeviceFingerprintRepository deviceFingerprintRepository;
    private final LocationVerificationRepository locationVerificationRepository;
    private final SessionRepository sessionRepository;
    private final EnhancedFaceApiClient enhancedFaceApiClient;

    // Maximum allowed distance from expected location (in meters)
    private static final double MAX_LOCATION_DISTANCE = 100.0;
    
    // Maximum device usage count before flagging as suspicious
    private static final int MAX_DEVICE_USAGE = 5;

    @Transactional
    public boolean verifyLocation(double lat, double lng, String sessionId) {
        try {
            Optional<SessionEntity> sessionOpt = sessionRepository.findById(sessionId);
            if (sessionOpt.isEmpty()) {
                log.warn("Session not found for location verification: {}", sessionId);
                return false;
            }

            // For now, we'll use a simple distance check
            // In production, you would have expected coordinates for each session/classroom
            double expectedLat = 21.0285; // Example: Hanoi University coordinates
            double expectedLng = 105.8542;
            
            double distance = calculateDistance(lat, lng, expectedLat, expectedLng);
            boolean isValid = distance <= MAX_LOCATION_DISTANCE;

            // Save verification record
            LocationVerificationEntity verification = new LocationVerificationEntity();
            verification.setSessionId(sessionId);
            verification.setLatitude(lat);
            verification.setLongitude(lng);
            verification.setExpectedLatitude(expectedLat);
            verification.setExpectedLongitude(expectedLng);
            verification.setDistanceMeters(distance);
            verification.setIsValid(isValid);
            verification.setVerificationMethod("GPS");
            
            locationVerificationRepository.save(verification);

            if (!isValid) {
                log.warn("Location verification failed for session {}: distance {}m", sessionId, distance);
            }

            return isValid;
        } catch (Exception e) {
            log.error("Error verifying location for session {}: {}", sessionId, e.getMessage());
            return false;
        }
    }

    @Transactional
    public String generateDeviceFingerprint(HttpServletRequest request) {
        try {
            String userAgent = request.getHeader("User-Agent");
            String acceptLanguage = request.getHeader("Accept-Language");
            String acceptEncoding = request.getHeader("Accept-Encoding");
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            String remoteAddr = request.getRemoteAddr();

            String fingerprintData = String.join("|", 
                userAgent != null ? userAgent : "",
                acceptLanguage != null ? acceptLanguage : "",
                acceptEncoding != null ? acceptEncoding : "",
                xForwardedFor != null ? xForwardedFor : remoteAddr
            );

            return hashString(fingerprintData);
        } catch (Exception e) {
            log.error("Error generating device fingerprint: {}", e.getMessage());
            return "unknown";
        }
    }

    @Transactional
    public boolean verifyDeviceFingerprint(AntiCheatRequest.DeviceFingerprint fingerprint, String ipAddress) {
        try {
            String fingerprintHash = fingerprint.getFingerprintHash();
            
            Optional<DeviceFingerprintEntity> existingOpt = 
                deviceFingerprintRepository.findByFingerprintHash(fingerprintHash);

            if (existingOpt.isPresent()) {
                DeviceFingerprintEntity existing = existingOpt.get();
                existing.setUsageCount(existing.getUsageCount() + 1);
                existing.setLastUsedAt(Instant.now());
                
                // Flag as suspicious if used too many times
                if (existing.getUsageCount() > MAX_DEVICE_USAGE) {
                    existing.setIsSuspicious(true);
                    existing.setNotes("Exceeded maximum usage count");
                    log.warn("Device fingerprint flagged as suspicious: {} (usage: {})", 
                        fingerprintHash, existing.getUsageCount());
                }
                
                deviceFingerprintRepository.save(existing);
                return !existing.getIsSuspicious();
            } else {
                // Create new fingerprint record
                DeviceFingerprintEntity newFingerprint = new DeviceFingerprintEntity();
                newFingerprint.setFingerprintHash(fingerprintHash);
                newFingerprint.setUserAgent(fingerprint.getUserAgent());
                newFingerprint.setScreenResolution(fingerprint.getScreenResolution());
                newFingerprint.setTimezone(fingerprint.getTimezone());
                newFingerprint.setLanguage(fingerprint.getLanguage());
                newFingerprint.setPlatform(fingerprint.getPlatform());
                newFingerprint.setCanvasFingerprint(fingerprint.getCanvasFingerprint());
                newFingerprint.setIpAddress(ipAddress);
                newFingerprint.setLastUsedAt(Instant.now());
                
                deviceFingerprintRepository.save(newFingerprint);
                return true;
            }
        } catch (Exception e) {
            log.error("Error verifying device fingerprint: {}", e.getMessage());
            return false;
        }
    }

    public LivenessResponse verifyLiveness(MultipartFile image) {
        try {
            byte[] imageBytes = image.getBytes();
            
            // Call enhanced face API for liveness detection
            return enhancedFaceApiClient.detectLiveness(imageBytes);
        } catch (Exception e) {
            log.error("Error verifying liveness: {}", e.getMessage());
            return LivenessResponse.failure("Liveness detection failed: " + e.getMessage());
        }
    }

    public boolean performAntiCheatVerification(AntiCheatRequest request) {
        boolean locationValid = true;
        boolean deviceValid = true;

        // Verify location if provided
        if (request.getLocation() != null) {
            locationValid = verifyLocation(
                request.getLocation().getLatitude(),
                request.getLocation().getLongitude(),
                request.getSessionId()
            );
        }

        // Verify device fingerprint if provided
        if (request.getDeviceFingerprint() != null) {
            deviceValid = verifyDeviceFingerprint(
                request.getDeviceFingerprint(),
                request.getIpAddress()
            );
        }

        boolean result = locationValid && deviceValid;
        
        if (!result) {
            log.warn("Anti-cheat verification failed for session {} - Location: {}, Device: {}", 
                request.getSessionId(), locationValid, deviceValid);
        }

        return result;
    }

    private double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        final int R = 6371; // Radius of the earth in km

        double latDistance = Math.toRadians(lat2 - lat1);
        double lngDistance = Math.toRadians(lng2 - lng1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = R * c * 1000; // convert to meters

        return distance;
    }

    private String hashString(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
