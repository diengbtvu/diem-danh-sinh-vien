package com.diemdanh.service;

import lombok.Builder;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SessionService {
    private final Map<String, SessionInfo> store = new ConcurrentHashMap<>();

    @Value("${app.rotateSeconds:20}")
    private int defaultRotateSeconds;

    public SessionInfo create(String maLop, Instant startAt, Instant endAt, Integer rotateSeconds) {
        String sessionId = UUID.randomUUID().toString();
        int rotate = rotateSeconds != null ? rotateSeconds : defaultRotateSeconds;
        SessionInfo info = SessionInfo.builder()
                .sessionId(sessionId)
                .maLop(maLop)
                .startAt(startAt != null ? startAt : Instant.now())
                .endAt(endAt)
                .rotateSeconds(rotate)
                .build();
        store.put(sessionId, info);
        return info;
    }

    public SessionInfo get(String sessionId) {
        return store.get(sessionId);
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
}
