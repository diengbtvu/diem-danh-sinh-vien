package com.diemdanh.service;

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
    @Value("${app.hmacSecret}")
    private String hmacSecret;

    @Value("${app.rotateSeconds:20}")
    private int rotateSeconds;

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
        return Math.abs(currentStep - tokenStep) <= 1; // leeway 1 step
    }

    public int getRotateSeconds() {
        return rotateSeconds;
    }
}
