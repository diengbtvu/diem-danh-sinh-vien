package com.diemdanh.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendAttendanceUpdate(String sessionId, AttendanceNotification notification) {
        try {
            messagingTemplate.convertAndSend("/topic/attendance/" + sessionId, notification);
            log.info("Sent attendance notification for session: {}", sessionId);
        } catch (Exception e) {
            log.error("Failed to send attendance notification", e);
        }
    }

    public void sendSessionUpdate(String sessionId, SessionNotification notification) {
        try {
            messagingTemplate.convertAndSend("/topic/session/" + sessionId, notification);
            log.info("Sent session notification for session: {}", sessionId);
        } catch (Exception e) {
            log.error("Failed to send session notification", e);
        }
    }

    public void sendGlobalUpdate(GlobalNotification notification) {
        try {
            messagingTemplate.convertAndSend("/topic/global", notification);
            log.info("Sent global notification");
        } catch (Exception e) {
            log.error("Failed to send global notification", e);
        }
    }

    public static class AttendanceNotification {
        public String type;
        public String sessionId;
        public String mssv;
        public String hoTen;
        public String status;
        public Instant timestamp;
        public Map<String, Object> data;

        public AttendanceNotification(String type, String sessionId, String mssv, String hoTen, String status) {
            this.type = type;
            this.sessionId = sessionId;
            this.mssv = mssv;
            this.hoTen = hoTen;
            this.status = status;
            this.timestamp = Instant.now();
        }
    }

    public static class SessionNotification {
        public String type;
        public String sessionId;
        public String message;
        public Instant timestamp;
        public Map<String, Object> data;

        public SessionNotification(String type, String sessionId, String message) {
            this.type = type;
            this.sessionId = sessionId;
            this.message = message;
            this.timestamp = Instant.now();
        }
    }

    public static class GlobalNotification {
        public String type;
        public String message;
        public Instant timestamp;
        public Map<String, Object> data;

        public GlobalNotification(String type, String message) {
            this.type = type;
            this.message = message;
            this.timestamp = Instant.now();
        }
    }
}
