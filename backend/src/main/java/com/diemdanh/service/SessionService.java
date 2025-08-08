package com.diemdanh.service;

import com.diemdanh.domain.SessionEntity;
import com.diemdanh.repo.SessionRepository;
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

    @Value("${app.rotateSeconds:20}")
    private int defaultRotateSeconds;

    public SessionInfo create(String maLop, Instant startAt, Instant endAt, Integer rotateSeconds) {
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
}
