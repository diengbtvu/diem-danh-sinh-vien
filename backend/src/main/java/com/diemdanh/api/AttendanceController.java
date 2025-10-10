package com.diemdanh.api;

import com.diemdanh.api.dto.AttendanceSubmitResponse;
import com.diemdanh.domain.AttendanceEntity;
import com.diemdanh.domain.StudentEntity;
import com.diemdanh.repo.AttendanceRepository;
import com.diemdanh.repo.StudentRepository;
import com.diemdanh.service.FaceApiClient;
import com.diemdanh.service.QrTokenService;
import com.diemdanh.service.SessionService;
import com.diemdanh.service.NotificationService;
import lombok.RequiredArgsConstructor;
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
    private final FaceApiClient faceApiClient;
    private final StudentRepository studentRepository;
    private final AttendanceRepository attendanceRepository;
    private final NotificationService notificationService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AttendanceSubmitResponse submit(
            @RequestPart("sessionToken") String sessionToken,
            @RequestPart("rotatingToken") String rotatingToken,
            @RequestPart("image") MultipartFile image
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
        
        // Check if session has expired
        if (session.getEndAt() != null && Instant.now().isAfter(session.getEndAt())) {
            throw new IllegalArgumentException("Session has expired");
        }

        long tokenStep = parseStep(rotatingToken);
        long now = Instant.now().getEpochSecond();
        if (!qrTokenService.isStepValid(session.getStartAt().getEpochSecond(), now, tokenStep)) {
            throw new IllegalArgumentException("Rotating token expired");
        }

        byte[] bytes = image.getBytes();
        
        var faceResp = faceApiClient.recognize(bytes, image.getOriginalFilename() != null ? image.getOriginalFilename() : "image.jpg").block();
        String label = faceResp != null ? faceResp.getLabel() : null;
        Double confidence = faceResp != null ? faceResp.getConfidence() : null;
        String mssv = parseMssv(label);
        StudentEntity student = mssv != null ? studentRepository.findById(mssv).orElse(null) : null;

        AttendanceEntity.Status status;
        if (student == null || confidence == null) {
            status = AttendanceEntity.Status.REVIEW;
        } else if (confidence >= 0.9) {
            status = AttendanceEntity.Status.ACCEPTED;
        } else if (confidence >= 0.7) {
            status = AttendanceEntity.Status.REVIEW;
        } else {
            status = AttendanceEntity.Status.REJECTED;
        }

        AttendanceEntity record = new AttendanceEntity();
        record.setQrCodeValue("session=" + sessionToken + "&rot=" + rotatingToken);
        record.setSessionId(sessionId);
        record.setMssv(mssv);
        record.setFaceLabel(label);
        record.setFaceConfidence(confidence);
        record.setStatus(status);
        record.setImageData(bytes);  // Lưu ảnh trực tiếp vào DB
        AttendanceEntity saved = attendanceRepository.save(record);

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

    @GetMapping("/{id}/image")
    public org.springframework.http.ResponseEntity<byte[]> getAttendanceImage(@PathVariable java.util.UUID id) {
        var attendance = attendanceRepository.findById(id).orElse(null);
        if (attendance == null || attendance.getImageData() == null) {
            return org.springframework.http.ResponseEntity.notFound().build();
        }
        
        return org.springframework.http.ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .header(org.springframework.http.HttpHeaders.CACHE_CONTROL, "max-age=3600")
                .body(attendance.getImageData());
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
