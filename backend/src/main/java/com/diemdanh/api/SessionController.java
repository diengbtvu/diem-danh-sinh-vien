package com.diemdanh.api;

import com.diemdanh.api.dto.CreateSessionRequest;
import com.diemdanh.api.dto.CreateSessionResponse;
import com.diemdanh.api.dto.RotatingTokenResponse;
import com.diemdanh.service.QrTokenService;
import com.diemdanh.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {
    private final SessionService sessionService;
    private final QrTokenService qrTokenService;

    @Value("${app.rotateSeconds:20}")
    private int defaultRotateSeconds;

    @Value("${app.frontendHost:http://localhost:5173}")
    private String frontendHost;

    @PostMapping
    public CreateSessionResponse create(@RequestBody CreateSessionRequest req) {
        Instant start = req.getStartAt() != null ? Instant.parse(req.getStartAt()) : Instant.now();
        Instant end = req.getEndAt() != null ? Instant.parse(req.getEndAt()) : null;

        var info = sessionService.create(req.getMaLop(), start, end, req.getRotateSeconds());
        String sessionToken = qrTokenService.buildSessionToken(info.getSessionId(), start.getEpochSecond());
        return CreateSessionResponse.builder()
                .sessionId(info.getSessionId())
                .sessionToken(sessionToken)
                .rotateSeconds(info.getRotateSeconds())
                .qrUrlTemplate(frontendHost + "/attend?session=" + sessionToken + "&rot={rotatingToken}")
                .expiresAt(end != null ? end.toString() : null)
                .build();
    }

    @GetMapping("/{sessionId}/rotating-token")
    public RotatingTokenResponse rotating(@PathVariable String sessionId) {
        var info = sessionService.get(sessionId);
        if (info == null) throw new IllegalArgumentException("Session not found");
        long now = Instant.now().getEpochSecond();
        String rotatingToken = qrTokenService.buildRotatingToken(info.getSessionId(), info.getStartAt().getEpochSecond(), now);
        long step = Math.floorDiv(now - info.getStartAt().getEpochSecond(), info.getRotateSeconds());
        long validFor = (info.getRotateSeconds() - ((now - info.getStartAt().getEpochSecond()) % info.getRotateSeconds())) * 1000L;
        String url = frontendHost + "/attend?session=" + qrTokenService.buildSessionToken(info.getSessionId(), info.getStartAt().getEpochSecond()) + "&rot=" + rotatingToken;
        return RotatingTokenResponse.builder()
                .rotatingToken(rotatingToken)
                .timeStep(step)
                .validForMs(validFor)
                .qrUrl(url)
                .build();
    }
}
