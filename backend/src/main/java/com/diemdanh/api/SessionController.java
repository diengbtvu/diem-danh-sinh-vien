package com.diemdanh.api;

import com.diemdanh.api.dto.AttendanceConfigResponse;
import com.diemdanh.api.dto.ClassListResponse;
import com.diemdanh.api.dto.CreateSessionRequest;
import com.diemdanh.api.dto.CreateSessionResponse;
import com.diemdanh.api.dto.CreateSessionSimpleRequest;
import com.diemdanh.api.dto.RotatingTokenResponse;
import com.diemdanh.api.dto.SessionStatusResponse;
import com.diemdanh.config.AttendanceConfig;
import com.diemdanh.repo.ClassRepository;
import com.diemdanh.repo.SessionRepository;
import com.diemdanh.repo.StudentRepository;
import com.diemdanh.service.QrTokenService;
import com.diemdanh.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@CrossOrigin(origins = {
    "https://zettix.net",
    "https://www.zettix.net",
    "http://localhost:8000",
    "http://localhost:5173",
    "http://localhost:5174"
}, allowCredentials = "true")
public class SessionController {
    private final SessionService sessionService;
    private final QrTokenService qrTokenService;
    private final AttendanceConfig attendanceConfig;
    private final StudentRepository studentRepository;
    private final SessionRepository sessionRepository;
    private final ClassRepository classRepository;

    @Value("${app.rotateSeconds:20}")
    private int defaultRotateSeconds;

    @Value("${app.frontendHost:http://localhost:5173}")
    private String frontendHost;

    /**
     * Helper method to get current authenticated user
     */
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }

    /**
     * Helper method to check if session is expired
     */
    private boolean isSessionExpired(SessionService.SessionInfo session) {
        if (session.getEndAt() == null) {
            return false; // No end time means never expires
        }
        return Instant.now().isAfter(session.getEndAt());
    }

    @PostMapping
    public CreateSessionResponse create(@RequestBody CreateSessionRequest req) {
        Instant start = req.getStartAt() != null ? Instant.parse(req.getStartAt()) : Instant.now();
        Instant end = req.getEndAt() != null ? Instant.parse(req.getEndAt()) : null;

        String currentUsername = getCurrentUsername();
        var info = sessionService.create(req.getMaLop(), start, end, req.getRotateSeconds(), currentUsername);
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
        
        // Use rotating session token instead of fixed one
        String sessionToken = qrTokenService.buildRotatingSessionToken(info.getSessionId(), info.getStartAt().getEpochSecond(), now);
        
        return RotatingTokenResponse.builder()
                .sessionToken(sessionToken)
                .rotatingToken(rotatingToken)
                .timeStep(step)
                .validForMs(validFor)
                .build();
    }

    // Activate QR2 overlay for configurable window when a student first arrives at attend page
    @PostMapping("/{sessionId}/activate-qr2")
    public SessionStatusResponse activateQr2(@PathVariable String sessionId, @RequestParam(required = false) Integer windowSeconds) {
        // Use configured default if not specified
        int actualWindowSeconds = windowSeconds != null ? windowSeconds : attendanceConfig.getQrBWindowSeconds();
        var info = sessionService.get(sessionId);
        if (info == null) throw new IllegalArgumentException("Session not found");
        if (isSessionExpired(info)) throw new IllegalArgumentException("Session has expired");
        
        // Mark QR A as used - this prevents future access to QR A links
        boolean firstUse = sessionService.markQrAAsUsed(sessionId);
        if (!firstUse) {
            // QR A has already been used - don't allow activation again
            throw new IllegalArgumentException("QR A đã được sử dụng. Vui lòng quét QR khác từ giảng viên.");
        }
        
        sessionService.activateQr2(sessionId, actualWindowSeconds);
        long now = Instant.now().getEpochSecond();
        String sessionToken = qrTokenService.buildRotatingSessionToken(info.getSessionId(), info.getStartAt().getEpochSecond(), now);
        String rotatingToken = qrTokenService.buildRotatingToken(info.getSessionId(), info.getStartAt().getEpochSecond(), now);
        var status = sessionService.getActivationStatus(sessionId);
        return SessionStatusResponse.builder()
                .sessionId(sessionId)
                .qr2Active(status.active())
                .validForMs(status.validForMs())
                .sessionToken(sessionToken)
                .rotatingToken(rotatingToken)
                .build();
    }

    // Validate QR B token
    @PostMapping("/{sessionId}/validate-qr")
    public ResponseEntity<Void> validateQR(@PathVariable String sessionId, @RequestBody Map<String, String> request) {
        String rotatingToken = request.get("rotatingToken");
        if (rotatingToken == null || !rotatingToken.startsWith("STEP-")) {
            return ResponseEntity.badRequest().build();
        }

        var info = sessionService.get(sessionId);
        if (info == null) return ResponseEntity.notFound().build();
        if (isSessionExpired(info)) return ResponseEntity.status(410).build(); // Gone - Session expired

        // Check if QR2 is currently active
        var status = sessionService.getActivationStatus(sessionId);
        if (!status.active()) {
            return ResponseEntity.status(410).build(); // Gone - QR2 window expired
        }

        // Validate the rotating token
        try {
            boolean isValid = qrTokenService.validateRotatingToken(rotatingToken, info.getSessionId(), info.getStartAt().getEpochSecond());
            if (isValid) {
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.status(401).build(); // Unauthorized - invalid token
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Polling endpoint for admin screen to know whether to overlay QR2 and how long remains
    @GetMapping("/{sessionId}/status")
    public ResponseEntity<SessionStatusResponse> status(@PathVariable String sessionId) {
        var info = sessionService.get(sessionId);
        if (info == null) {
            return ResponseEntity.notFound().build();
        }
        if (isSessionExpired(info)) {
            return ResponseEntity.status(410).build(); // Gone - Session expired
        }
        long now = Instant.now().getEpochSecond();
        String sessionToken = qrTokenService.buildRotatingSessionToken(info.getSessionId(), info.getStartAt().getEpochSecond(), now);
        var status = sessionService.getActivationStatus(sessionId);
        String rotatingToken = status.active() ? qrTokenService.buildRotatingToken(info.getSessionId(), info.getStartAt().getEpochSecond(), now) : null;
        SessionStatusResponse response = SessionStatusResponse.builder()
                .sessionId(sessionId)
                .qr2Active(status.active())
                .validForMs(status.validForMs())
                .sessionToken(sessionToken)
                .rotatingToken(rotatingToken)
                .build();
        return ResponseEntity.ok(response);
    }

    // Get current attendance configuration
    @GetMapping("/config")
    public AttendanceConfigResponse getConfig() {
        return new AttendanceConfigResponse(
            attendanceConfig.getQrBWindowSeconds(),
            attendanceConfig.getQrRotateSeconds(),
            attendanceConfig.getQrStepTolerance(),
            attendanceConfig.getSessionTokenValidityHours(),
            attendanceConfig.getMaxImageSizeMB(),
            attendanceConfig.getFrontendUrlTemplate()
        );
    }

    // Check if QR A access is allowed for a session
    @GetMapping("/{sessionId}/qr-a-access")
    public ResponseEntity<Map<String, Object>> checkQrAAccess(@PathVariable String sessionId) {
        var info = sessionService.get(sessionId);
        if (info == null) {
            return ResponseEntity.notFound().build();
        }
        
        if (isSessionExpired(info)) {
            return ResponseEntity.status(410).build(); // Gone - Session expired
        }
        
        boolean accessAllowed = sessionService.isQrAAccessAllowed(sessionId);
        boolean qrAUsed = sessionService.isQrAUsed(sessionId);
        var activationStatus = sessionService.getActivationStatus(sessionId);
        
        Map<String, Object> response = Map.of(
            "accessAllowed", accessAllowed,
            "qrAUsed", qrAUsed,
            "qr2Active", activationStatus.active(),
            "message", accessAllowed ? "Truy cập được phép" : "QR A đã được sử dụng. Hãy quét QR khác từ giảng viên."
        );
        
        return ResponseEntity.ok(response);
    }

    // Get list of available classes
    @GetMapping("/classes")
    public ClassListResponse getClasses() {
        List<String> maLopList = studentRepository.findDistinctMaLop();
        List<ClassListResponse.ClassInfo> classes = maLopList.stream()
            .map(maLop -> new ClassListResponse.ClassInfo(
                maLop,
                studentRepository.countByMaLop(maLop),
                sessionRepository.countByMaLop(maLop)
            ))
            .toList();

        ClassListResponse response = new ClassListResponse();
        response.setClasses(classes);
        return response;
    }

    // Create session with simple parameters (current time + duration)
    @PostMapping("/simple")
    public CreateSessionResponse createSimple(@RequestBody CreateSessionSimpleRequest req) {
        // Validate class exists
        if (!classRepository.existsByMaLop(req.getMaLop())) {
            throw new IllegalArgumentException("Mã lớp không tồn tại: " + req.getMaLop());
        }

        Instant start = Instant.now();
        int durationMinutes = req.getDurationMinutes() != null ? req.getDurationMinutes() : 30;
        Instant end = start.plusSeconds(durationMinutes * 60L);

        int rotateSeconds = attendanceConfig.getQrRotateSeconds();

        String currentUsername = getCurrentUsername();
        var info = sessionService.create(req.getMaLop(), start, end, rotateSeconds, currentUsername);
        String sessionToken = qrTokenService.buildSessionToken(info.getSessionId(), start.getEpochSecond());

        return CreateSessionResponse.builder()
                .sessionId(info.getSessionId())
                .sessionToken(sessionToken)
                .rotateSeconds(info.getRotateSeconds())
                .qrUrlTemplate(frontendHost + "/attend?session=" + sessionToken)
                .expiresAt(end.toString())
                .build();
    }
}
