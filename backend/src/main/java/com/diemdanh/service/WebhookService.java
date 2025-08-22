package com.diemdanh.service;

import com.diemdanh.domain.WebhookEntity;
import com.diemdanh.repo.WebhookRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebhookService {

    private final WebhookRepository webhookRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Data
    public static class WebhookPayload {
        private String event;
        private Instant timestamp;
        private Map<String, Object> data;
        private String source = "attendance-system";
        private String version = "2.0.0";
    }

    @Data
    public static class WebhookResponse {
        private boolean success;
        private int statusCode;
        private String responseBody;
        private String error;
        private long responseTimeMs;
    }

    @Async
    public CompletableFuture<Void> triggerWebhooks(String eventType, Map<String, Object> eventData) {
        try {
            List<WebhookEntity> webhooks = webhookRepository.findActiveWebhooksForEvent(eventType);
            
            for (WebhookEntity webhook : webhooks) {
                try {
                    WebhookPayload payload = createPayload(eventType, eventData);
                    WebhookResponse response = sendWebhook(webhook, payload);
                    updateWebhookStats(webhook, response);
                } catch (Exception e) {
                    log.error("Failed to send webhook {}: {}", webhook.getId(), e.getMessage());
                    updateWebhookFailure(webhook, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error triggering webhooks for event {}: {}", eventType, e.getMessage());
        }
        
        return CompletableFuture.completedFuture(null);
    }

    public WebhookResponse sendWebhook(WebhookEntity webhook, WebhookPayload payload) {
        long startTime = System.currentTimeMillis();
        WebhookResponse response = new WebhookResponse();
        
        try {
            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            headers.set("User-Agent", "AttendanceSystem-Webhook/2.0");
            headers.set("X-Webhook-Event", payload.getEvent());
            headers.set("X-Webhook-Timestamp", payload.getTimestamp().toString());
            
            // Add custom headers if configured
            if (webhook.getHeaders() != null && !webhook.getHeaders().isEmpty()) {
                try {
                    @SuppressWarnings("unchecked")
                    Map<String, String> customHeaders = objectMapper.readValue(webhook.getHeaders(), Map.class);
                    customHeaders.forEach(headers::set);
                } catch (Exception e) {
                    log.warn("Failed to parse custom headers for webhook {}: {}", webhook.getId(), e.getMessage());
                }
            }
            
            // Add signature if secret is configured
            if (webhook.getSecret() != null && !webhook.getSecret().isEmpty()) {
                String payloadJson = objectMapper.writeValueAsString(payload);
                String signature = generateSignature(payloadJson, webhook.getSecret());
                headers.set("X-Webhook-Signature", "sha256=" + signature);
            }
            
            // Prepare request
            String payloadJson = objectMapper.writeValueAsString(payload);
            HttpEntity<String> request = new HttpEntity<>(payloadJson, headers);
            
            // Send webhook with timeout
            ResponseEntity<String> httpResponse = restTemplate.exchange(
                webhook.getUrl(),
                HttpMethod.POST,
                request,
                String.class
            );
            
            response.setSuccess(httpResponse.getStatusCode().is2xxSuccessful());
            response.setStatusCode(httpResponse.getStatusCode().value());
            response.setResponseBody(httpResponse.getBody());
            
        } catch (Exception e) {
            response.setSuccess(false);
            response.setError(e.getMessage());
            log.error("Webhook delivery failed for {}: {}", webhook.getUrl(), e.getMessage());
        } finally {
            response.setResponseTimeMs(System.currentTimeMillis() - startTime);
        }
        
        return response;
    }

    public WebhookEntity createWebhook(String name, String url, String secret, List<String> events, String createdBy) {
        WebhookEntity webhook = new WebhookEntity();
        webhook.setName(name);
        webhook.setUrl(url);
        webhook.setSecret(secret);
        webhook.setCreatedBy(createdBy);
        
        try {
            webhook.setEvents(objectMapper.writeValueAsString(events));
        } catch (Exception e) {
            log.error("Failed to serialize events: {}", e.getMessage());
            webhook.setEvents("[]");
        }
        
        return webhookRepository.save(webhook);
    }

    public void updateWebhookStats(WebhookEntity webhook, WebhookResponse response) {
        webhook.setLastTriggeredAt(Instant.now());
        
        if (response.isSuccess()) {
            webhook.setLastSuccessAt(Instant.now());
            webhook.setSuccessCount(webhook.getSuccessCount() + 1);
            webhook.setFailureCount(0); // Reset failure count on success
        } else {
            webhook.setLastFailureAt(Instant.now());
            webhook.setFailureCount(webhook.getFailureCount() + 1);
            webhook.setLastError(response.getError());
            
            // Disable webhook if too many failures
            if (webhook.getFailureCount() >= 10) {
                webhook.setIsActive(false);
                log.warn("Webhook {} disabled due to too many failures", webhook.getId());
            }
        }
        
        webhookRepository.save(webhook);
    }

    public void updateWebhookFailure(WebhookEntity webhook, String error) {
        webhook.setLastTriggeredAt(Instant.now());
        webhook.setLastFailureAt(Instant.now());
        webhook.setFailureCount(webhook.getFailureCount() + 1);
        webhook.setLastError(error);
        
        if (webhook.getFailureCount() >= 10) {
            webhook.setIsActive(false);
            log.warn("Webhook {} disabled due to too many failures", webhook.getId());
        }
        
        webhookRepository.save(webhook);
    }

    private WebhookPayload createPayload(String eventType, Map<String, Object> eventData) {
        WebhookPayload payload = new WebhookPayload();
        payload.setEvent(eventType);
        payload.setTimestamp(Instant.now());
        payload.setData(eventData != null ? eventData : new HashMap<>());
        return payload;
    }

    private String generateSignature(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            
            StringBuilder result = new StringBuilder();
            for (byte b : hash) {
                result.append(String.format("%02x", b));
            }
            return result.toString();
        } catch (Exception e) {
            log.error("Failed to generate webhook signature: {}", e.getMessage());
            return "";
        }
    }

    // Predefined event types
    public static final String EVENT_ATTENDANCE_CREATED = "attendance.created";
    public static final String EVENT_ATTENDANCE_UPDATED = "attendance.updated";
    public static final String EVENT_SESSION_CREATED = "session.created";
    public static final String EVENT_SESSION_ENDED = "session.ended";
    public static final String EVENT_STUDENT_REGISTERED = "student.registered";
    public static final String EVENT_ANTI_CHEAT_VIOLATION = "anti_cheat.violation";

    // Convenience methods for common events
    public void triggerAttendanceCreated(Map<String, Object> attendanceData) {
        triggerWebhooks(EVENT_ATTENDANCE_CREATED, attendanceData);
    }

    public void triggerSessionCreated(Map<String, Object> sessionData) {
        triggerWebhooks(EVENT_SESSION_CREATED, sessionData);
    }

    public void triggerAntiCheatViolation(Map<String, Object> violationData) {
        triggerWebhooks(EVENT_ANTI_CHEAT_VIOLATION, violationData);
    }
}
