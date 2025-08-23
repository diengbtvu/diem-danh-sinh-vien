package com.diemdanh.service;

import com.diemdanh.domain.SessionEntity;
import com.diemdanh.domain.UserEntity;
import com.diemdanh.repo.SessionRepository;
import com.diemdanh.repo.UserRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class SessionService {
    private final Map<String, SessionInfo> store = new ConcurrentHashMap<>();
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;

    @Value("${app.rotateSeconds:20}")
    private int defaultRotateSeconds;

    public SessionInfo create(String maLop, Instant startAt, Instant endAt, Integer rotateSeconds, String createdByUsername) {
        String sessionId = UUID.randomUUID().toString();
        int rotate = rotateSeconds != null ? rotateSeconds : defaultRotateSeconds;
        Instant start = startAt != null ? startAt : Instant.now();

        // persist to DB
        SessionEntity entity = new SessionEntity();
        entity.setSessionId(sessionId);
        entity.setMaLop(maLop);
        entity.setStartAt(start);
        entity.setEndAt(endAt);
        entity.setRotateSeconds(rotate);

        // Set createdBy if username is provided
        if (createdByUsername != null) {
            UserEntity createdBy = userRepository.findByUsername(createdByUsername).orElse(null);
            entity.setCreatedBy(createdBy);
        }

        sessionRepository.save(entity);

        SessionInfo info = SessionInfo.builder()
                .sessionId(sessionId)
                .maLop(maLop)
                .startAt(start)
                .endAt(endAt)
                .rotateSeconds(rotate)
                .build();
        store.put(sessionId, info);
        return info;
    }

    // Overloaded method for backward compatibility
    public SessionInfo create(String maLop, Instant startAt, Instant endAt, Integer rotateSeconds) {
        return create(maLop, startAt, endAt, rotateSeconds, null);
    }

    public SessionInfo get(String sessionId) {
        SessionInfo cached = store.get(sessionId);
        if (cached != null) return cached;
        return sessionRepository.findById(sessionId)
                .map(e -> {
                    SessionInfo i = SessionInfo.builder()
                            .sessionId(e.getSessionId())
                            .maLop(e.getMaLop())
                            .startAt(e.getStartAt())
                            .endAt(e.getEndAt())
                            .rotateSeconds(e.getRotateSeconds())
                            .build();
                    store.put(sessionId, i);
                    return i;
                })
                .orElse(null);
    }

    @Data
    @Builder
    public static class SessionInfo {
        private String sessionId;
        private String maLop;
        private Instant startAt;
        private Instant endAt;
        private int rotateSeconds;
    }

        // State for QR2 activation window (in-memory; can be externalized later)
        private final Map<String, ActivationState> activationState = new ConcurrentHashMap<>();
        
        // Track QR A (session token) usage to ensure single use
        private final Map<String, QrAUsageState> qrAUsageState = new ConcurrentHashMap<>();

        public void activateQr2(String sessionId, int windowSeconds) {
            long now = Instant.now().toEpochMilli();
            activationState.put(sessionId, new ActivationState(now, now + windowSeconds * 1000L));
        }

        public ActivationStatus getActivationStatus(String sessionId) {
            var state = activationState.get(sessionId);
            long now = Instant.now().toEpochMilli();
            if (state == null || now > state.expiresAtMs) {
                activationState.remove(sessionId);
                return new ActivationStatus(false, 0);
            }
            long remain = Math.max(0, state.expiresAtMs - now);
            return new ActivationStatus(true, remain);
        }

        public void resetActivation(String sessionId) {
            activationState.remove(sessionId);
        }

        private record ActivationState(long startedAtMs, long expiresAtMs) {}

        public record ActivationStatus(boolean active, long validForMs) {}
        
        // QR A usage tracking methods
        public boolean isQrAUsed(String sessionId) {
            // Check if current session step's QR A is used
            long now = Instant.now().toEpochMilli();
            var sessionInfo = get(sessionId);
            if (sessionInfo == null) return false;
            
            long currentSessionStep = Math.floorDiv(now / 1000 - sessionInfo.getStartAt().getEpochSecond(), 30);
            String stepKey = sessionId + "_" + currentSessionStep;
            
            var state = qrAUsageState.get(stepKey);
            return state != null && state.used;
        }
        
        public boolean markQrAAsUsed(String sessionId) {
            // Mark QR A as used for current session step
            long now = Instant.now().toEpochMilli();
            var sessionInfo = get(sessionId);
            if (sessionInfo == null) return false;
            
            long currentSessionStep = Math.floorDiv(now / 1000 - sessionInfo.getStartAt().getEpochSecond(), 30);
            String stepKey = sessionId + "_" + currentSessionStep;
            
            var existing = qrAUsageState.putIfAbsent(stepKey, new QrAUsageState(true, now));
            return existing == null; // true = first use for this step, false = already used in this step
        }
        
        public boolean isQrAAccessAllowed(String sessionId) {
            long now = Instant.now().toEpochMilli();
            var sessionInfo = get(sessionId);
            if (sessionInfo == null) return false;
            
            long currentSessionStep = Math.floorDiv(now / 1000 - sessionInfo.getStartAt().getEpochSecond(), 30);
            String stepKey = sessionId + "_" + currentSessionStep;
            
            var qrAState = qrAUsageState.get(stepKey);
            var activationStatus = getActivationStatus(sessionId);
            
            // QR A access is NOT allowed if:
            // 1. Current step's QR A has been used AND QR B has been activated
            if (qrAState != null && qrAState.used && activationStatus.active()) {
                return false;
            }
            
            return true; // Allow access otherwise
        }
        
        public boolean isQrAUsedForCurrentStep(String sessionId, long currentSessionStep) {
            String stepKey = sessionId + "_" + currentSessionStep;
            var state = qrAUsageState.get(stepKey);
            return state != null && state.used;
        }
        
        public void resetQrAUsage(String sessionId) {
            // Remove all QR A usage entries for this session (all steps)
            qrAUsageState.entrySet().removeIf(entry -> entry.getKey().startsWith(sessionId + "_"));
        }
        
        // Reset both QR A and QR B state for a session (admin function)
        public void resetSession(String sessionId) {
            resetActivation(sessionId);
            resetQrAUsage(sessionId);
        }
        
        private record QrAUsageState(boolean used, long usedAtMs) {}
}
