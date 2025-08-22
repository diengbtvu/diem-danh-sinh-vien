package com.diemdanh.api;

import com.diemdanh.api.dto.AttendanceSubmitResponse;
import com.diemdanh.domain.AttendanceEntity;
import com.diemdanh.domain.StudentEntity;
import com.diemdanh.repo.AttendanceRepository;
import com.diemdanh.repo.StudentRepository;
// import com.diemdanh.service.FaceApiClient; // No longer needed
import com.diemdanh.service.QrTokenService;
import com.diemdanh.service.SessionService;
import com.diemdanh.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;

@RestController
@RequestMapping("/api/attendances")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {
    "https://zettix.net",
    "https://www.zettix.net",
    "http://localhost:8000",
    "http://localhost:5173",
    "http://localhost:5174"
}, allowCredentials = "true")
public class AttendanceController {
    private final QrTokenService qrTokenService;
    private final SessionService sessionService;
    // private final FaceApiClient faceApiClient; // No longer needed - frontend calls Face API directly
    private final StudentRepository studentRepository;
    private final AttendanceRepository attendanceRepository;
    private final NotificationService notificationService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AttendanceSubmitResponse submit(
            @RequestPart("sessionToken") String sessionToken,
            @RequestPart("rotatingToken") String rotatingToken,
            @RequestPart("image") MultipartFile image,
            @RequestPart(value = "faceApiResult", required = false) String faceApiResultJson
    ) throws Exception {
        if (!qrTokenService.validateToken(sessionToken, "SESSION") || !qrTokenService.validateToken(rotatingToken, "STEP")) {
            throw new IllegalArgumentException("Invalid token signature");
        }
        String sessionId = parseSessionId(sessionToken);
        String stepSessionId = parseSessionId(rotatingToken);
        if (!sessionId.equals(stepSessionId)) {
            throw new IllegalArgumentException("Token mismatch");
        }
        var session = sessionService.get(sessionId);
        if (session == null) throw new IllegalArgumentException("Session not found");

        long tokenStep = parseStep(rotatingToken);
        long now = Instant.now().getEpochSecond();
        if (!qrTokenService.isStepValid(session.getStartAt().getEpochSecond(), now, tokenStep)) {
            throw new IllegalArgumentException("Rotating token expired");
        }

        byte[] bytes = image.getBytes();
        log.info("Processing attendance submission: sessionId={}, imageSize={} bytes, fileName={}, hasFaceApiResult={}", 
            sessionId, bytes.length, image.getOriginalFilename(), faceApiResultJson != null);
        
        String label = null;
        Double confidence = null;
        
        // Process face recognition result from frontend
        if (faceApiResultJson != null && !faceApiResultJson.trim().isEmpty()) {
            try {
                log.info("Processing face API result from frontend: {}", faceApiResultJson);
                // Parse the JSON result from frontend
                var objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
                var faceApiResult = objectMapper.readTree(faceApiResultJson);
                
                if (faceApiResult.has("success") && faceApiResult.get("success").asBoolean() 
                    && faceApiResult.has("detections") && faceApiResult.get("detections").isArray() 
                    && faceApiResult.get("detections").size() > 0) {
                    
                    var firstDetection = faceApiResult.get("detections").get(0);
                    label = firstDetection.has("class") ? firstDetection.get("class").asText() : null;
                    confidence = firstDetection.has("confidence") ? firstDetection.get("confidence").asDouble() : null;
                    
                    log.info("Parsed face recognition result from frontend: label={}, confidence={}", label, confidence);
                } else {
                    log.warn("Face API result from frontend indicates no face detected or unsuccessful");
                }
            } catch (Exception e) {
                log.error("Failed to parse face API result from frontend: {}", e.getMessage(), e);
            }
        } else {
            log.info("No face API result provided from frontend, will set status to REVIEW");
        }
        
        log.info("Final face recognition result: label={}, confidence={}", label, confidence);
        
        String mssv = parseMssv(label);
        StudentEntity student = mssv != null ? studentRepository.findById(mssv).orElse(null) : null;
        
        log.info("Student lookup: mssv={}, studentFound={}", mssv, student != null);

        AttendanceEntity.Status status;
        if (student == null || confidence == null) {
            status = AttendanceEntity.Status.REVIEW;
            log.info("Setting status to REVIEW - student not found or no confidence score");
        } else if (confidence >= 0.9) {
            status = AttendanceEntity.Status.ACCEPTED;
            log.info("Setting status to ACCEPTED - high confidence: {}", confidence);
        } else if (confidence >= 0.7) {
            status = AttendanceEntity.Status.REVIEW;
            log.info("Setting status to REVIEW - medium confidence: {}", confidence);
        } else {
            status = AttendanceEntity.Status.REJECTED;
            log.info("Setting status to REJECTED - low confidence: {}", confidence);
        }

        AttendanceEntity record = new AttendanceEntity();
        record.setQrCodeValue("session=" + sessionToken + "&rot=" + rotatingToken);
        record.setSessionId(sessionId);
        record.setMssv(mssv);
        record.setFaceLabel(label);
        record.setFaceConfidence(confidence);
        record.setStatus(status);
        AttendanceEntity saved = attendanceRepository.save(record);
        
        log.info("Attendance record saved: id={}, sessionId={}, mssv={}, status={}, confidence={}", 
            saved.getId(), sessionId, mssv, status, confidence);

        // Send real-time notification
        try {
            NotificationService.AttendanceNotification notification = new NotificationService.AttendanceNotification(
                "NEW_ATTENDANCE",
                sessionId,
                mssv,
                student != null ? student.getHoTen() : "Unknown",
                status.name()
            );
            notificationService.sendAttendanceUpdate(sessionId, notification);
            notificationService.sendGlobalUpdate(new NotificationService.GlobalNotification(
                "ATTENDANCE_UPDATE",
                "New attendance recorded for session " + sessionId
            ));
        } catch (Exception e) {
            // Log error but don't fail the request
            System.err.println("Failed to send notification: " + e.getMessage());
        }

        return AttendanceSubmitResponse.builder()
                .status(status.name())
                .mssv(mssv)
                .hoTen(student != null ? student.getHoTen() : null)
                .capturedAt(Instant.now().toString())
                .confidence(confidence)
                .build();
    }

    @GetMapping
    public Page<AttendanceEntity> list(@RequestParam("sessionId") String sessionId,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "20") int size) {
        return attendanceRepository.findBySessionId(sessionId, PageRequest.of(page, size));
    }

    private String parseSessionId(String token) {
        int dash = token.indexOf('-');
        int dot = token.indexOf('.', dash + 1);
        if (dash < 0 || dot < 0) return null;
        return token.substring(dash + 1, dot);
    }

    private long parseStep(String rotatingToken) {
        // Format: STEP-{sessionId}.{step}.{sig}
        int firstDot = rotatingToken.indexOf('.');
        int secondDot = rotatingToken.indexOf('.', firstDot + 1);
        if (firstDot < 0 || secondDot < 0) return -1;
        String prefixAndSession = rotatingToken.substring(0, firstDot); // STEP-{sessionId}
        int dash = prefixAndSession.indexOf('-');
        String stepStr = rotatingToken.substring(firstDot + 1, secondDot);
        return Long.parseLong(stepStr);
    }

    private String parseMssv(String label) {
        if (!StringUtils.hasText(label)) return null;
        // Extract MSSV before first '_' or space (supports both formats)
        int underscore = label.indexOf('_');
        int space = label.indexOf(' ');
        int cut = -1;
        if (underscore >= 0 && space >= 0) {
            cut = Math.min(underscore, space);
        } else if (underscore >= 0) {
            cut = underscore;
        } else if (space >= 0) {
            cut = space;
        }
        if (cut > 0) {
            return label.substring(0, cut);
        }
        // If no delimiter, return whole label if it looks like an MSSV (digits-only)
        String trimmed = label.trim();
        return trimmed.matches("^\\d{6,}$") ? trimmed : null;
    }
}
