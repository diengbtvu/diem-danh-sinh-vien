package com.diemdanh.service;

import com.diemdanh.config.AttendanceConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;

@Service
public class QrTokenService {
    private final AttendanceConfig attendanceConfig;

    @Value("${app.hmacSecret}")
    private String hmacSecret;

    @Value("${app.rotateSeconds:20}")
    private int rotateSeconds;
    
    @Value("${app.sessionTokenRotateSeconds:30}")
    private int sessionTokenRotateSeconds;

    public QrTokenService(AttendanceConfig attendanceConfig) {
        this.attendanceConfig = attendanceConfig;
    }

    public String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(hmacSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] sig = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : sig) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("Cannot sign data", e);
        }
    }

    public String buildSessionToken(String sessionId, long issuedAtEpochSec) {
        String payload = "SESSION-" + sessionId + "." + issuedAtEpochSec;
        return payload + "." + sign(payload);
    }
    
    public String buildRotatingSessionToken(String sessionId, long sessionStartEpochSec, long nowEpochSec) {
        // QR A rotates every sessionTokenRotateSeconds (default 30s)
        long sessionStep = Math.floorDiv(nowEpochSec - sessionStartEpochSec, sessionTokenRotateSeconds);
        long rotatingIssuedAt = sessionStartEpochSec + (sessionStep * sessionTokenRotateSeconds);
        String payload = "SESSION-" + sessionId + "." + rotatingIssuedAt;
        return payload + "." + sign(payload);
    }

    public String buildRotatingToken(String sessionId, long sessionStartEpochSec, long nowEpochSec) {
        long step = Math.floorDiv(nowEpochSec - sessionStartEpochSec, rotateSeconds);
        String payload = "STEP-" + sessionId + "." + step;
        return payload + "." + sign(payload);
    }

    public boolean validateToken(String token, String expectedPrefix) {
        if (token == null || !token.startsWith(expectedPrefix + "-")) return false;
        int lastDot = token.lastIndexOf('.');
        if (lastDot < 0) return false;
        String payload = token.substring(0, lastDot);
        String sig = token.substring(lastDot + 1);
        return sig.equalsIgnoreCase(sign(payload));
    }

    public boolean isStepValid(long sessionStartEpochSec, long nowEpochSec, long tokenStep) {
        long currentStep = Math.floorDiv(nowEpochSec - sessionStartEpochSec, rotateSeconds);
        return Math.abs(currentStep - tokenStep) <= attendanceConfig.getQrStepTolerance();
    }
    
    public boolean isSessionStepValid(long sessionStartEpochSec, long nowEpochSec, long tokenIssuedAt) {
        long currentSessionStep = Math.floorDiv(nowEpochSec - sessionStartEpochSec, sessionTokenRotateSeconds);
        long tokenSessionStep = Math.floorDiv(tokenIssuedAt - sessionStartEpochSec, sessionTokenRotateSeconds);
        return Math.abs(currentSessionStep - tokenSessionStep) <= attendanceConfig.getQrStepTolerance();
    }

    public boolean validateRotatingToken(String rotatingToken, String sessionId, long sessionStartEpochSec) {
        if (rotatingToken == null || !rotatingToken.startsWith("STEP-" + sessionId + ".")) {
            return false;
        }

        // Extract step from token
        try {
            String[] parts = rotatingToken.split("\\.");
            if (parts.length != 3) return false;

            long tokenStep = Long.parseLong(parts[1]);
            String payload = parts[0] + "." + parts[1];
            String signature = parts[2];

            // Validate signature
            if (!signature.equalsIgnoreCase(sign(payload))) {
                return false;
            }

            // Validate step timing
            long nowEpochSec = System.currentTimeMillis() / 1000;
            return isStepValid(sessionStartEpochSec, nowEpochSec, tokenStep);
        } catch (NumberFormatException e) {
            return false;
        }
    }

    public int getRotateSeconds() {
        return rotateSeconds;
    }
    
    public int getSessionTokenRotateSeconds() {
        return sessionTokenRotateSeconds;
    }
}
