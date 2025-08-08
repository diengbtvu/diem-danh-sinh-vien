package com.diemdanh.api;

import com.diemdanh.domain.AttendanceEntity;
import com.diemdanh.domain.SessionEntity;
import com.diemdanh.domain.StudentEntity;
import com.diemdanh.repo.AttendanceRepository;
import com.diemdanh.repo.SessionRepository;
import com.diemdanh.repo.StudentRepository;
import com.diemdanh.service.QrTokenService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.UUID;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = {
    "https://zettix.net",
    "https://www.zettix.net",
    "http://localhost:8000",
    "http://localhost:5173",
    "http://localhost:5174"
}, allowCredentials = "true")
public class AdminController {
    private final SessionRepository sessionRepository;
    private final StudentRepository studentRepository;
    private final AttendanceRepository attendanceRepository;
    private final QrTokenService qrTokenService;

    // Sessions CRUD
    @GetMapping("/sessions")
    public Page<SessionEntity> listSessions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String maLop) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        PageRequest pageRequest = PageRequest.of(page, size, sort);

        if (search != null && !search.trim().isEmpty()) {
            return sessionRepository.findBySessionIdContainingIgnoreCaseOrMaLopContainingIgnoreCase(
                search.trim(), search.trim(), pageRequest);
        }

        if (maLop != null && !maLop.trim().isEmpty()) {
            return sessionRepository.findByMaLopContainingIgnoreCase(maLop.trim(), pageRequest);
        }

        return sessionRepository.findAll(pageRequest);
    }

    @GetMapping("/sessions/{id}")
    public ResponseEntity<SessionEntity> getSession(@PathVariable String id) {
        return sessionRepository.findById(id)
            .map(session -> ResponseEntity.ok(session))
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping(value = "/sessions", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<SessionEntity> createSession(@Valid @RequestBody CreateSession req) {
        try {
            // Check if custom session ID already exists
            if (hasText(req.getSessionId()) && sessionRepository.existsById(req.getSessionId().trim())) {
                return ResponseEntity.badRequest().build();
            }

            SessionEntity s = new SessionEntity();
            s.setSessionId(hasText(req.getSessionId()) ? req.getSessionId().trim() : UUID.randomUUID().toString());
            s.setMaLop(req.getMaLop().trim());
            s.setStartAt(parseInstantOrNow(req.getStartAt()));
            s.setEndAt(parseInstantOrNull(req.getEndAt()));
            s.setRotateSeconds(req.getRotateSeconds() != null ? req.getRotateSeconds() : qrTokenService.getRotateSeconds());

            SessionEntity saved = sessionRepository.save(s);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping(value = "/sessions/{sessionId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<SessionEntity> updateSession(@PathVariable String sessionId,
                                                       @Valid @RequestBody UpdateSession req) {
        Optional<SessionEntity> sessionOpt = sessionRepository.findById(sessionId);
        if (sessionOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            SessionEntity session = sessionOpt.get();
            if (hasText(req.getMaLop())) {
                session.setMaLop(req.getMaLop().trim());
            }
            if (hasText(req.getStartAt())) {
                Instant v = parseInstant(req.getStartAt());
                if (v != null) session.setStartAt(v);
            }
            if (hasText(req.getEndAt())) {
                Instant v = parseInstant(req.getEndAt());
                session.setEndAt(v);
            }
            if (req.getRotateSeconds() != null) {
                session.setRotateSeconds(req.getRotateSeconds());
            }
            return ResponseEntity.ok(sessionRepository.save(session));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Void> deleteSession(@PathVariable String sessionId) {
        if (sessionRepository.existsById(sessionId)) {
            sessionRepository.deleteById(sessionId);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Students CRUD
    @GetMapping("/students")
    public Page<StudentEntity> listStudents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "hoTen") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String maLop) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        PageRequest pageRequest = PageRequest.of(page, size, sort);

        if (search != null && !search.trim().isEmpty()) {
            String searchTerm = search.trim();
            return studentRepository.findByMssvContainingIgnoreCaseOrHoTenContainingIgnoreCaseOrMaLopContainingIgnoreCase(
                searchTerm, searchTerm, searchTerm, pageRequest);
        }

        if (maLop != null && !maLop.trim().isEmpty()) {
            return studentRepository.findByMaLopContainingIgnoreCase(maLop.trim(), pageRequest);
        }

        return studentRepository.findAll(pageRequest);
    }

    @GetMapping("/students/{mssv}")
    public ResponseEntity<StudentEntity> getStudent(@PathVariable String mssv) {
        return studentRepository.findById(mssv)
            .map(student -> ResponseEntity.ok(student))
            .orElse(ResponseEntity.notFound().build());
    }

    // Bulk import students via CSV (mssv,maLop,hoTen) header optional
    @PostMapping(value = "/students/import", consumes = MediaType.TEXT_PLAIN_VALUE)
    public List<StudentEntity> importStudents(@RequestBody String csv) {
        String[] lines = csv.split("\n");
        new java.util.ArrayList<String>();
        boolean hasHeader = lines.length > 0 && lines[0].toLowerCase().contains("mssv");
        java.util.List<StudentEntity> batch = new java.util.ArrayList<>();
        for (int i = hasHeader ? 1 : 0; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) continue;
            String[] cols = line.split(",");
            if (cols.length < 3) continue;
            StudentEntity s = new StudentEntity();
            s.setMssv(cols[0].trim());
            s.setMaLop(cols[1].trim());
            s.setHoTen(cols[2].trim());
            batch.add(s);
        }
        return studentRepository.saveAll(batch);
    }

    @PostMapping(value = "/students", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<StudentEntity> createStudent(@Valid @RequestBody CreateStudent req) {
        try {
            // Check if student already exists
            if (studentRepository.existsById(req.getMssv())) {
                return ResponseEntity.badRequest().build();
            }

            StudentEntity student = new StudentEntity();
            student.setMssv(req.getMssv().trim());
            student.setMaLop(req.getMaLop().trim());
            student.setHoTen(req.getHoTen().trim());

            StudentEntity saved = studentRepository.save(student);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping(value = "/students/{mssv}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<StudentEntity> updateStudent(@PathVariable String mssv,
                                                       @Valid @RequestBody UpdateStudent req) {
        Optional<StudentEntity> studentOpt = studentRepository.findById(mssv);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            StudentEntity student = studentOpt.get();
            if (hasText(req.getMaLop())) {
                student.setMaLop(req.getMaLop().trim());
            }
            if (hasText(req.getHoTen())) {
                student.setHoTen(req.getHoTen().trim());
            }
            return ResponseEntity.ok(studentRepository.save(student));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/students/{mssv}")
    public ResponseEntity<Void> deleteStudent(@PathVariable String mssv) {
        if (studentRepository.existsById(mssv)) {
            studentRepository.deleteById(mssv);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/students")
    public ResponseEntity<Void> deleteStudents(@RequestBody List<String> mssvList) {
        try {
            List<StudentEntity> studentsToDelete = studentRepository.findAllById(mssvList);
            studentRepository.deleteAll(studentsToDelete);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Dashboard stats
    @GetMapping("/stats/{sessionId}")
    public Stats stats(@PathVariable String sessionId) {
        long accepted = attendanceRepository.countBySessionIdAndStatus(sessionId, AttendanceEntity.Status.ACCEPTED);
        long review = attendanceRepository.countBySessionIdAndStatus(sessionId, AttendanceEntity.Status.REVIEW);
        long rejected = attendanceRepository.countBySessionIdAndStatus(sessionId, AttendanceEntity.Status.REJECTED);
        Stats s = new Stats();
        s.setAccepted(accepted);
        s.setReview(review);
        s.setRejected(rejected);
        s.setTotal(accepted + review + rejected);
        return s;
    }

    @GetMapping("/dashboard/overview")
    public DashboardOverview getDashboardOverview() {
        DashboardOverview overview = new DashboardOverview();
        overview.setTotalSessions(sessionRepository.count());
        overview.setTotalStudents(studentRepository.count());
        overview.setTotalAttendances(attendanceRepository.count());

        // Recent attendances (last 24 hours)
        Instant since = Instant.now().minusSeconds(24 * 60 * 60);
        overview.setRecentAttendances(attendanceRepository.countRecentAttendances(since));

        return overview;
    }

    @GetMapping("/dashboard/classes")
    public List<ClassStats> getClassStats() {
        List<String> classes = sessionRepository.findDistinctMaLop();
        return classes.stream().map(maLop -> {
            ClassStats stats = new ClassStats();
            stats.setMaLop(maLop);
            stats.setSessionCount(sessionRepository.countByMaLop(maLop));
            stats.setStudentCount(studentRepository.countByMaLop(maLop));
            return stats;
        }).toList();
    }

    // Attendance CRUD
    @GetMapping("/attendances")
    public Page<AttendanceEntity> listAttendances(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "capturedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String sessionId,
            @RequestParam(required = false) String mssv,
            @RequestParam(required = false) String status) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        PageRequest pageRequest = PageRequest.of(page, size, sort);

        if (sessionId != null && !sessionId.trim().isEmpty()) {
            if (status != null && !status.trim().isEmpty()) {
                try {
                    AttendanceEntity.Status statusEnum = AttendanceEntity.Status.valueOf(status.trim().toUpperCase());
                    return attendanceRepository.findBySessionIdAndStatus(sessionId.trim(), statusEnum, pageRequest);
                } catch (IllegalArgumentException e) {
                    // Invalid status, ignore filter
                }
            }
            return attendanceRepository.findBySessionId(sessionId.trim(), pageRequest);
        }

        if (mssv != null && !mssv.trim().isEmpty()) {
            return attendanceRepository.findByMssvContainingIgnoreCase(mssv.trim(), pageRequest);
        }

        return attendanceRepository.findAll(pageRequest);
    }

    @PutMapping("/attendances/{id}")
    public ResponseEntity<AttendanceEntity> updateAttendance(@PathVariable UUID id,
                                                            @RequestBody UpdateAttendance req) {
        Optional<AttendanceEntity> attendanceOpt = attendanceRepository.findById(id);
        if (attendanceOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            AttendanceEntity attendance = attendanceOpt.get();
            if (req.getStatus() != null) {
                attendance.setStatus(AttendanceEntity.Status.valueOf(req.getStatus().toUpperCase()));
            }
            if (hasText(req.getMeta())) {
                attendance.setMeta(req.getMeta().trim());
            }
            return ResponseEntity.ok(attendanceRepository.save(attendance));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/attendances/{id}")
    public ResponseEntity<Void> deleteAttendance(@PathVariable UUID id) {
        if (attendanceRepository.existsById(id)) {
            attendanceRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Export CSV attendances for a session
    @GetMapping(value = "/export/{sessionId}")
    public ResponseEntity<byte[]> export(@PathVariable String sessionId) {
        var page = attendanceRepository.findBySessionId(sessionId, PageRequest.of(0, Integer.MAX_VALUE));
        StringBuilder sb = new StringBuilder("id,mssv,status,capturedAt,confidence,faceLabel\n");
        page.getContent().forEach(a -> {
            sb.append(a.getId()).append(',')
              .append(a.getMssv() != null ? a.getMssv() : "").append(',')
              .append(a.getStatus() != null ? a.getStatus().name() : "").append(',')
              .append(a.getCapturedAt() != null ? a.getCapturedAt() : "").append(',')
              .append(a.getFaceConfidence() != null ? a.getFaceConfidence() : "").append(',')
              .append(a.getFaceLabel() != null ? a.getFaceLabel() : "")
              .append("\n");
        });
        byte[] bytes = sb.toString().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=attendances-" + sessionId + ".csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
    }

    @Data
    public static class CreateSession {
        @NotBlank(message = "Mã lớp không được để trống")
        private String maLop;
        private String sessionId; // allow custom id to match QR/session service
        private String startAt;
        private String endAt;
        @Min(value = 5, message = "Thời gian xoay QR phải ít nhất 5 giây")
        private Integer rotateSeconds;
    }

    @Data
    public static class UpdateSession {
        private String maLop;
        private String startAt;
        private String endAt;
        @Min(value = 5, message = "Thời gian xoay QR phải ít nhất 5 giây")
        private Integer rotateSeconds;
    }

    @Data
    public static class CreateStudent {
        @NotBlank(message = "MSSV không được để trống")
        @Size(max = 32, message = "MSSV không được quá 32 ký tự")
        private String mssv;

        @NotBlank(message = "Mã lớp không được để trống")
        @Size(max = 64, message = "Mã lớp không được quá 64 ký tự")
        private String maLop;

        @NotBlank(message = "Họ tên không được để trống")
        @Size(max = 128, message = "Họ tên không được quá 128 ký tự")
        private String hoTen;
    }

    @Data
    public static class UpdateStudent {
        @Size(max = 64, message = "Mã lớp không được quá 64 ký tự")
        private String maLop;

        @Size(max = 128, message = "Họ tên không được quá 128 ký tự")
        private String hoTen;
    }

    @Data
    public static class Stats {
        private long total;
        private long accepted;
        private long review;
        private long rejected;
    }

    @Data
    public static class DashboardOverview {
        private long totalSessions;
        private long totalStudents;
        private long totalAttendances;
        private long recentAttendances;
    }

    @Data
    public static class ClassStats {
        private String maLop;
        private long sessionCount;
        private long studentCount;
    }

    @Data
    public static class UpdateAttendance {
        private String status;
        private String meta;
    }

    // helpers
    private static boolean hasText(String s) {
        return s != null && !s.trim().isEmpty();
    }

    private static Instant parseInstantOrNow(String s) {
        Instant v = parseInstant(s);
        return v != null ? v : Instant.now();
    }

    private static Instant parseInstantOrNull(String s) {
        return parseInstant(s);
    }

    private static Instant parseInstant(String s) {
        if (!hasText(s)) return null;
        try {
            return Instant.parse(s.trim());
        } catch (DateTimeParseException e) {
            return null;
        }
    }
}

