package com.diemdanh.api;

import com.diemdanh.domain.WebhookEntity;
import com.diemdanh.service.WebhookService;
import com.diemdanh.repo.WebhookRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/integrations")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {
    "https://zettix.net",
    "https://www.zettix.net",
    "http://localhost:8000",
    "http://localhost:5173",
    "http://localhost:5174"
}, allowCredentials = "true")
public class IntegrationController {

    private final WebhookService webhookService;
    private final WebhookRepository webhookRepository;

    @Data
    public static class WebhookRequest {
        private String name;
        private String url;
        private String secret;
        private List<String> events;
        private String description;
        private Map<String, String> headers;
        private Integer timeoutSeconds;
        private Integer retryCount;
    }

    @Data
    public static class WebhookResponse {
        private Long id;
        private String name;
        private String url;
        private List<String> events;
        private Boolean isActive;
        private Integer successCount;
        private Integer failureCount;
        private String lastError;
        private String createdAt;
        private String lastTriggeredAt;
    }

    @Data
    public static class LMSIntegrationRequest {
        private String lmsType; // moodle, canvas, blackboard
        private String baseUrl;
        private String apiKey;
        private String courseId;
        private Map<String, String> settings;
    }

    // Webhook Management
    @PostMapping("/webhooks")
    public ResponseEntity<Map<String, Object>> createWebhook(@RequestBody WebhookRequest request) {
        try {
            WebhookEntity webhook = webhookService.createWebhook(
                request.getName(),
                request.getUrl(),
                request.getSecret(),
                request.getEvents(),
                "system" // In production, get from authentication context
            );

            if (request.getDescription() != null) {
                webhook.setDescription(request.getDescription());
            }
            if (request.getTimeoutSeconds() != null) {
                webhook.setTimeoutSeconds(request.getTimeoutSeconds());
            }
            if (request.getRetryCount() != null) {
                webhook.setRetryCount(request.getRetryCount());
            }
            if (request.getHeaders() != null) {
                try {
                    webhook.setHeaders(new com.fasterxml.jackson.databind.ObjectMapper()
                        .writeValueAsString(request.getHeaders()));
                } catch (Exception e) {
                    log.warn("Failed to serialize headers: {}", e.getMessage());
                }
            }

            webhook = webhookRepository.save(webhook);

            Map<String, Object> response = new HashMap<>();
            response.put("id", webhook.getId());
            response.put("name", webhook.getName());
            response.put("url", webhook.getUrl());
            response.put("isActive", webhook.getIsActive());
            response.put("createdAt", webhook.getCreatedAt());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating webhook: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to create webhook");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/webhooks")
    public ResponseEntity<Page<WebhookEntity>> getWebhooks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<WebhookEntity> webhooks = webhookRepository.findAll(pageable);
            return ResponseEntity.ok(webhooks);
        } catch (Exception e) {
            log.error("Error fetching webhooks: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/webhooks/{id}")
    public ResponseEntity<WebhookEntity> getWebhook(@PathVariable Long id) {
        try {
            Optional<WebhookEntity> webhook = webhookRepository.findById(id);
            return webhook.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching webhook {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/webhooks/{id}")
    public ResponseEntity<WebhookEntity> updateWebhook(
            @PathVariable Long id,
            @RequestBody WebhookRequest request) {
        try {
            Optional<WebhookEntity> webhookOpt = webhookRepository.findById(id);
            if (webhookOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            WebhookEntity webhook = webhookOpt.get();
            if (request.getName() != null) webhook.setName(request.getName());
            if (request.getUrl() != null) webhook.setUrl(request.getUrl());
            if (request.getSecret() != null) webhook.setSecret(request.getSecret());
            if (request.getDescription() != null) webhook.setDescription(request.getDescription());
            if (request.getTimeoutSeconds() != null) webhook.setTimeoutSeconds(request.getTimeoutSeconds());
            if (request.getRetryCount() != null) webhook.setRetryCount(request.getRetryCount());

            if (request.getEvents() != null) {
                try {
                    webhook.setEvents(new com.fasterxml.jackson.databind.ObjectMapper()
                        .writeValueAsString(request.getEvents()));
                } catch (Exception e) {
                    log.warn("Failed to serialize events: {}", e.getMessage());
                }
            }

            webhook = webhookRepository.save(webhook);
            return ResponseEntity.ok(webhook);
        } catch (Exception e) {
            log.error("Error updating webhook {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/webhooks/{id}")
    public ResponseEntity<Void> deleteWebhook(@PathVariable Long id) {
        try {
            if (webhookRepository.existsById(id)) {
                webhookRepository.deleteById(id);
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error deleting webhook {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/webhooks/{id}/toggle")
    public ResponseEntity<Map<String, Object>> toggleWebhook(@PathVariable Long id) {
        try {
            Optional<WebhookEntity> webhookOpt = webhookRepository.findById(id);
            if (webhookOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            WebhookEntity webhook = webhookOpt.get();
            webhook.setIsActive(!webhook.getIsActive());
            webhook = webhookRepository.save(webhook);

            Map<String, Object> response = new HashMap<>();
            response.put("id", webhook.getId());
            response.put("isActive", webhook.getIsActive());
            response.put("message", webhook.getIsActive() ? "Webhook activated" : "Webhook deactivated");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error toggling webhook {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/webhooks/{id}/test")
    public ResponseEntity<Map<String, Object>> testWebhook(@PathVariable Long id) {
        try {
            Optional<WebhookEntity> webhookOpt = webhookRepository.findById(id);
            if (webhookOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            WebhookEntity webhook = webhookOpt.get();
            
            // Create test payload
            Map<String, Object> testData = new HashMap<>();
            testData.put("test", true);
            testData.put("message", "This is a test webhook");
            testData.put("timestamp", System.currentTimeMillis());

            WebhookService.WebhookPayload payload = new WebhookService.WebhookPayload();
            payload.setEvent("webhook.test");
            payload.setTimestamp(java.time.Instant.now());
            payload.setData(testData);

            WebhookService.WebhookResponse response = webhookService.sendWebhook(webhook, payload);
            webhookService.updateWebhookStats(webhook, response);

            Map<String, Object> result = new HashMap<>();
            result.put("success", response.isSuccess());
            result.put("statusCode", response.getStatusCode());
            result.put("responseTime", response.getResponseTimeMs());
            result.put("error", response.getError());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error testing webhook {}: {}", id, e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // LMS Integration endpoints
    @PostMapping("/lms/moodle/sync")
    public ResponseEntity<Map<String, Object>> syncWithMoodle(@RequestBody LMSIntegrationRequest request) {
        try {
            // Mock Moodle integration
            Map<String, Object> response = new HashMap<>();
            response.put("lmsType", "moodle");
            response.put("courseId", request.getCourseId());
            response.put("syncedStudents", 45);
            response.put("syncedGrades", 42);
            response.put("status", "success");
            response.put("lastSync", System.currentTimeMillis());

            log.info("Moodle sync completed for course: {}", request.getCourseId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error syncing with Moodle: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Moodle sync failed");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/lms/canvas/sync")
    public ResponseEntity<Map<String, Object>> syncWithCanvas(@RequestBody LMSIntegrationRequest request) {
        try {
            // Mock Canvas integration
            Map<String, Object> response = new HashMap<>();
            response.put("lmsType", "canvas");
            response.put("courseId", request.getCourseId());
            response.put("syncedStudents", 38);
            response.put("syncedGrades", 35);
            response.put("status", "success");
            response.put("lastSync", System.currentTimeMillis());

            log.info("Canvas sync completed for course: {}", request.getCourseId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error syncing with Canvas: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Canvas sync failed");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/lms/supported")
    public ResponseEntity<Map<String, Object>> getSupportedLMS() {
        Map<String, Object> supported = new HashMap<>();
        
        Map<String, Object> moodle = new HashMap<>();
        moodle.put("name", "Moodle");
        moodle.put("version", "3.9+");
        moodle.put("features", List.of("student_sync", "grade_sync", "attendance_export"));
        
        Map<String, Object> canvas = new HashMap<>();
        canvas.put("name", "Canvas");
        canvas.put("version", "2020+");
        canvas.put("features", List.of("student_sync", "grade_sync", "assignment_sync"));
        
        supported.put("moodle", moodle);
        supported.put("canvas", canvas);
        
        return ResponseEntity.ok(supported);
    }

    @GetMapping("/events/types")
    public ResponseEntity<List<String>> getEventTypes() {
        List<String> eventTypes = List.of(
            WebhookService.EVENT_ATTENDANCE_CREATED,
            WebhookService.EVENT_ATTENDANCE_UPDATED,
            WebhookService.EVENT_SESSION_CREATED,
            WebhookService.EVENT_SESSION_ENDED,
            WebhookService.EVENT_STUDENT_REGISTERED,
            WebhookService.EVENT_ANTI_CHEAT_VIOLATION
        );
        return ResponseEntity.ok(eventTypes);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getIntegrationStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalWebhooks", webhookRepository.count());
            stats.put("activeWebhooks", webhookRepository.countActiveWebhooks());
            stats.put("recentlyTriggered", webhookRepository.findRecentlyTriggered(
                java.time.Instant.now().minus(24, java.time.temporal.ChronoUnit.HOURS)
            ).size());
            stats.put("highFailureRate", webhookRepository.findWebhooksWithHighFailureRate(5).size());
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error fetching integration stats: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
