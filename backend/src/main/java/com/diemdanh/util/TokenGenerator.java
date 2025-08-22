package com.diemdanh.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

public class TokenGenerator {
    private static final String HMAC_SECRET = "change-me";
    
    public static String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(HMAC_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] sig = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : sig) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Cannot sign data", e);
        }
    }
    
    public static String buildSessionToken(String sessionId, long issuedAtEpochSec) {
        String payload = "SESSION-" + sessionId + "." + issuedAtEpochSec;
        return payload + "." + sign(payload);
    }
    
    public static String buildRotatingToken(String sessionId, long sessionStartEpochSec, long nowEpochSec) {
        long step = Math.floorDiv(nowEpochSec - sessionStartEpochSec, 20); // rotateSeconds = 20
        String payload = "STEP-" + sessionId + "." + step;
        return payload + "." + sign(payload);
    }
    
    public static void main(String[] args) {
        String sessionId = "test123";
        long now = Instant.now().getEpochSecond();
        
        String sessionToken = buildSessionToken(sessionId, now);
        String rotatingToken = buildRotatingToken(sessionId, now - 10, now); // session started 10 seconds ago
        
        System.out.println("SessionToken: " + sessionToken);
        System.out.println("RotatingToken: " + rotatingToken);
        System.out.println("Now: " + now);
    }
}