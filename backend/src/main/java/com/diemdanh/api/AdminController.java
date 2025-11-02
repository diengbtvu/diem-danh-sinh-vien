package com.diemdanh.api;

import com.diemdanh.domain.AttendanceEntity;
import com.diemdanh.domain.SessionEntity;
import com.diemdanh.domain.StudentEntity;
import com.diemdanh.domain.UserEntity;
import com.diemdanh.repo.AttendanceRepository;
import com.diemdanh.repo.SessionRepository;
import com.diemdanh.repo.StudentRepository;
import com.diemdanh.repo.UserRepository;
import com.diemdanh.service.QrTokenService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
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
    private final UserRepository userRepository;

    /**
     * Helper method to get current authenticated user
     */
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }

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

            // Set createdBy
            String currentUsername = getCurrentUsername();
            if (currentUsername != null) {
                UserEntity createdBy = userRepository.findByUsername(currentUsername).orElse(null);
                s.setCreatedBy(createdBy);
            }

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

    // Bulk import students via CSV (MSSV,Họ tên,Mã lớp) header optional
    @PostMapping(value = "/students/import", consumes = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<?> importStudents(@RequestBody String csv) {
        String[] lines = csv.split("\n");
        boolean hasHeader = lines.length > 0 && lines[0].toLowerCase().contains("mssv");
        java.util.List<StudentEntity> batch = new java.util.ArrayList<>();
        
        int totalLines = 0;
        int skippedExists = 0;
        int skippedInvalid = 0;
        
        for (int i = hasHeader ? 1 : 0; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) continue;
            
            totalLines++;
            String[] cols = line.split(",");
            if (cols.length < 3) {
                skippedInvalid++;
                System.err.println("Skipped invalid line: " + line);
                continue;
            }
            
            String mssv = cols[0].trim();
            String hoTen = cols[1].trim();  // ✅ FIXED: cols[1] = Họ tên
            String maLop = cols[2].trim();  // ✅ FIXED: cols[2] = Mã lớp
            
            // Skip if student already exists
            if (studentRepository.existsById(mssv)) {
                skippedExists++;
                continue;
            }
            
            StudentEntity s = new StudentEntity();
            s.setMssv(mssv);
            s.setHoTen(hoTen);  // ✅ FIXED: hoTen vào đúng field
            s.setMaLop(maLop);  // ✅ FIXED: maLop vào đúng field
            batch.add(s);
        }
        
        List<StudentEntity> saved = studentRepository.saveAll(batch);
        
        // Return detailed response
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("imported", saved.size());
        response.put("totalLines", totalLines);
        response.put("skippedExists", skippedExists);
        response.put("skippedInvalid", skippedInvalid);
        response.put("message", String.format("Đã import %d sinh viên. Bỏ qua: %d (đã tồn tại), %d (dữ liệu không hợp lệ)", 
            saved.size(), skippedExists, skippedInvalid));
        
        return ResponseEntity.ok(response);
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
    public ResponseEntity<Stats> stats(@PathVariable String sessionId) {
        try {
            System.out.println("Getting stats for sessionId: " + sessionId);

            // Validate sessionId
            if (sessionId == null || sessionId.trim().isEmpty()) {
                System.err.println("Invalid sessionId: " + sessionId);
                return ResponseEntity.badRequest().build();
            }

            // Check if session exists
            boolean sessionExists = sessionRepository.existsById(sessionId);
            if (!sessionExists) {
                System.err.println("Session not found: " + sessionId);
                return ResponseEntity.notFound().build();
            }

            long accepted = attendanceRepository.countBySessionIdAndStatus(sessionId, AttendanceEntity.Status.ACCEPTED);
            long review = attendanceRepository.countBySessionIdAndStatus(sessionId, AttendanceEntity.Status.REVIEW);
            long rejected = attendanceRepository.countBySessionIdAndStatus(sessionId, AttendanceEntity.Status.REJECTED);

            System.out.println("Stats for session " + sessionId + ": accepted=" + accepted + ", review=" + review + ", rejected=" + rejected);

            Stats s = new Stats();
            s.setAccepted(accepted);
            s.setReview(review);
            s.setRejected(rejected);
            s.setTotal(accepted + review + rejected);

            return ResponseEntity.ok(s);
        } catch (Exception e) {
            System.err.println("Error getting stats for sessionId " + sessionId + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
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

    @GetMapping("/dashboard/stats")
    public ResponseEntity<Stats> getDashboardStats() {
        try {
            // Get all attendances
            List<AttendanceEntity> allAttendances = attendanceRepository.findAll();

            long accepted = allAttendances.stream().mapToLong(a -> a.getStatus() == AttendanceEntity.Status.ACCEPTED ? 1 : 0).sum();
            long review = allAttendances.stream().mapToLong(a -> a.getStatus() == AttendanceEntity.Status.REVIEW ? 1 : 0).sum();
            long rejected = allAttendances.stream().mapToLong(a -> a.getStatus() == AttendanceEntity.Status.REJECTED ? 1 : 0).sum();

            Stats stats = new Stats();
            stats.setAccepted(accepted);
            stats.setReview(review);
            stats.setRejected(rejected);
            stats.setTotal(accepted + review + rejected);

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            System.err.println("Error getting dashboard stats: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/stats/time-range")
    public ResponseEntity<TimeRangeStats> getTimeRangeStats(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(required = false) String maLop) {
        try {
            Instant start = Instant.parse(startDate + "T00:00:00Z");
            Instant end = Instant.parse(endDate + "T23:59:59Z");

            TimeRangeStats stats = new TimeRangeStats();
            stats.setStartDate(startDate);
            stats.setEndDate(endDate);
            stats.setMaLop(maLop);

            // Get all attendances in time range
            List<AttendanceEntity> attendances;
            if (maLop != null && !maLop.trim().isEmpty()) {
                // Filter by class - need to join with sessions
                attendances = attendanceRepository.findByDateRangeAndClass(start, end, maLop.trim());
            } else {
                attendances = attendanceRepository.findByDateRange(start, end);
            }

            // Calculate stats
            long totalAttendances = attendances.size();
            long acceptedCount = attendances.stream().mapToLong(a -> a.getStatus() == AttendanceEntity.Status.ACCEPTED ? 1 : 0).sum();
            long reviewCount = attendances.stream().mapToLong(a -> a.getStatus() == AttendanceEntity.Status.REVIEW ? 1 : 0).sum();
            long rejectedCount = attendances.stream().mapToLong(a -> a.getStatus() == AttendanceEntity.Status.REJECTED ? 1 : 0).sum();

            stats.setTotalAttendances(totalAttendances);
            stats.setAcceptedCount(acceptedCount);
            stats.setReviewCount(reviewCount);
            stats.setRejectedCount(rejectedCount);

            // Get unique sessions count
            long uniqueSessions = attendances.stream().map(AttendanceEntity::getSessionId).distinct().count();
            stats.setUniqueSessions(uniqueSessions);

            // Get unique students count
            long uniqueStudents = attendances.stream().map(AttendanceEntity::getMssv).distinct().count();
            stats.setUniqueStudents(uniqueStudents);

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            System.err.println("Error getting time range stats: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/stats/class")
    public ResponseEntity<List<ClassDetailStats>> getClassStats(@RequestParam(required = false) String maLop) {
        try {
            List<ClassDetailStats> result = new ArrayList<>();

            if (maLop != null && !maLop.trim().isEmpty()) {
                // Get stats for specific class
                ClassDetailStats stats = getStatsForClass(maLop.trim());
                if (stats != null) {
                    result.add(stats);
                }
            } else {
                // Get stats for all classes
                List<String> classes = sessionRepository.findDistinctMaLop();
                for (String className : classes) {
                    ClassDetailStats stats = getStatsForClass(className);
                    if (stats != null) {
                        result.add(stats);
                    }
                }
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("Error getting class stats: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    private ClassDetailStats getStatsForClass(String maLop) {
        try {
            ClassDetailStats stats = new ClassDetailStats();
            stats.setMaLop(maLop);

            // Basic counts
            stats.setSessionCount(sessionRepository.countByMaLop(maLop));
            stats.setStudentCount(studentRepository.countByMaLop(maLop));

            // Attendance stats for this class
            List<AttendanceEntity> attendances = attendanceRepository.findByClassMaLop(maLop);
            stats.setTotalAttendances(attendances.size());

            long acceptedCount = attendances.stream().mapToLong(a -> a.getStatus() == AttendanceEntity.Status.ACCEPTED ? 1 : 0).sum();
            long reviewCount = attendances.stream().mapToLong(a -> a.getStatus() == AttendanceEntity.Status.REVIEW ? 1 : 0).sum();
            long rejectedCount = attendances.stream().mapToLong(a -> a.getStatus() == AttendanceEntity.Status.REJECTED ? 1 : 0).sum();

            stats.setAcceptedCount(acceptedCount);
            stats.setReviewCount(reviewCount);
            stats.setRejectedCount(rejectedCount);

            // Calculate attendance rate
            if (stats.getStudentCount() > 0 && stats.getSessionCount() > 0) {
                double maxPossibleAttendances = stats.getStudentCount() * stats.getSessionCount();
                stats.setAttendanceRate((double) acceptedCount / maxPossibleAttendances * 100);
            } else {
                stats.setAttendanceRate(0.0);
            }

            return stats;
        } catch (Exception e) {
            System.err.println("Error getting stats for class " + maLop + ": " + e.getMessage());
            return null;
        }
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

    @PostMapping("/attendances/bulk-update")
    public ResponseEntity<BulkUpdateResult> bulkUpdateAttendances(@RequestBody BulkUpdateRequest req) {
        try {
            AttendanceEntity.Status fromStatus = AttendanceEntity.Status.valueOf(req.getFromStatus().toUpperCase());
            AttendanceEntity.Status toStatus = AttendanceEntity.Status.valueOf(req.getToStatus().toUpperCase());

            List<AttendanceEntity> attendances = attendanceRepository.findBySessionIdAndStatus(req.getSessionId(), fromStatus);

            for (AttendanceEntity attendance : attendances) {
                attendance.setStatus(toStatus);
            }

            List<AttendanceEntity> updated = attendanceRepository.saveAll(attendances);

            BulkUpdateResult result = new BulkUpdateResult();
            result.setUpdatedCount(updated.size());
            result.setFromStatus(req.getFromStatus());
            result.setToStatus(req.getToStatus());
            result.setSessionId(req.getSessionId());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
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

    // Export detailed report with student names
    @GetMapping(value = "/export/detailed/{sessionId}")
    public ResponseEntity<byte[]> exportDetailed(@PathVariable String sessionId) {
        try {
            var page = attendanceRepository.findBySessionId(sessionId, PageRequest.of(0, Integer.MAX_VALUE));
            var session = sessionRepository.findById(sessionId);

            if (session.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            // Get all students in the class
            var students = studentRepository.findByMaLopContainingIgnoreCase(session.get().getMaLop(), PageRequest.of(0, Integer.MAX_VALUE));

            StringBuilder sb = new StringBuilder();
            sb.append("MSSV,Họ tên,Trạng thái điểm danh,Thời gian điểm danh,Độ tin cậy,Face Label,Ghi chú\n");

            // Create a map of attendance by MSSV
            var attendanceMap = page.getContent().stream()
                .collect(java.util.stream.Collectors.toMap(
                    AttendanceEntity::getMssv,
                    a -> a,
                    (existing, replacement) -> existing // Keep first occurrence
                ));

            // Export all students with their attendance status
            students.getContent().forEach(student -> {
                AttendanceEntity attendance = attendanceMap.get(student.getMssv());
                sb.append(student.getMssv()).append(',')
                  .append(student.getHoTen()).append(',');

                if (attendance != null) {
                    sb.append(attendance.getStatus() != null ? getStatusText(attendance.getStatus().name()) : "Chưa điểm danh").append(',')
                      .append(attendance.getCapturedAt() != null ? attendance.getCapturedAt() : "").append(',')
                      .append(attendance.getFaceConfidence() != null ? attendance.getFaceConfidence() : "").append(',')
                      .append(attendance.getFaceLabel() != null ? attendance.getFaceLabel() : "").append(',')
                      .append(attendance.getMeta() != null ? attendance.getMeta() : "");
                } else {
                    sb.append("Vắng mặt,,,,,");
                }
                sb.append("\n");
            });

            byte[] bytes = sb.toString().getBytes(StandardCharsets.UTF_8);
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=detailed-attendance-" + sessionId + ".csv")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(bytes);
        } catch (Exception e) {
            System.err.println("Error exporting detailed report: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Export class summary report
    @GetMapping(value = "/export/class-summary")
    public ResponseEntity<byte[]> exportClassSummary(@RequestParam(required = false) String maLop) {
        try {
            StringBuilder sb = new StringBuilder();
            sb.append("Mã lớp,Số buổi học,Số sinh viên,Tổng lượt điểm danh,Thành công,Cần xem xét,Thất bại,Tỷ lệ điểm danh (%)\n");

            List<String> classes;
            if (maLop != null && !maLop.trim().isEmpty()) {
                classes = List.of(maLop.trim());
            } else {
                classes = sessionRepository.findDistinctMaLop();
            }

            for (String className : classes) {
                ClassDetailStats stats = getStatsForClass(className);
                if (stats != null) {
                    sb.append(stats.getMaLop()).append(',')
                      .append(stats.getSessionCount()).append(',')
                      .append(stats.getStudentCount()).append(',')
                      .append(stats.getTotalAttendances()).append(',')
                      .append(stats.getAcceptedCount()).append(',')
                      .append(stats.getReviewCount()).append(',')
                      .append(stats.getRejectedCount()).append(',')
                      .append(String.format("%.2f", stats.getAttendanceRate()))
                      .append("\n");
                }
            }

            byte[] bytes = sb.toString().getBytes(StandardCharsets.UTF_8);
            String filename = maLop != null ? "class-summary-" + maLop + ".csv" : "all-classes-summary.csv";
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=" + filename)
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(bytes);
        } catch (Exception e) {
            System.err.println("Error exporting class summary: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    private String getStatusText(String status) {
        switch (status) {
            case "ACCEPTED": return "Thành công";
            case "REVIEW": return "Cần xem xét";
            case "REJECTED": return "Thất bại";
            default: return status;
        }
    }

    // Real-time stats endpoint
    @GetMapping("/stats/realtime/{sessionId}")
    public ResponseEntity<RealtimeStats> getRealtimeStats(@PathVariable String sessionId) {
        try {
            // Get basic stats
            ResponseEntity<Stats> statsResponse = stats(sessionId);
            if (!statsResponse.getStatusCode().is2xxSuccessful() || statsResponse.getBody() == null) {
                return ResponseEntity.notFound().build();
            }
            Stats basicStats = statsResponse.getBody();

            // Get recent activity (last 5 minutes)
            Instant fiveMinutesAgo = Instant.now().minusSeconds(5 * 60);
            List<AttendanceEntity> recentAttendances = attendanceRepository.findBySessionIdAndDateRange(
                sessionId, fiveMinutesAgo, Instant.now()
            );

            RealtimeStats realtimeStats = new RealtimeStats();
            realtimeStats.setSessionId(sessionId);
            realtimeStats.setTotal(basicStats.getTotal());
            realtimeStats.setAccepted(basicStats.getAccepted());
            realtimeStats.setReview(basicStats.getReview());
            realtimeStats.setRejected(basicStats.getRejected());
            realtimeStats.setRecentCount(recentAttendances.size());
            realtimeStats.setLastUpdated(Instant.now().toString());

            // Get latest attendance
            if (!recentAttendances.isEmpty()) {
                AttendanceEntity latest = recentAttendances.get(0);
                realtimeStats.setLatestMssv(latest.getMssv());
                realtimeStats.setLatestStatus(latest.getStatus().name());
                realtimeStats.setLatestTime(latest.getCapturedAt().toString());
            }

            return ResponseEntity.ok(realtimeStats);
        } catch (Exception e) {
            System.err.println("Error getting realtime stats: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
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

    @Data
    public static class TimeRangeStats {
        private String startDate;
        private String endDate;
        private String maLop;
        private long totalAttendances;
        private long acceptedCount;
        private long reviewCount;
        private long rejectedCount;
        private long uniqueSessions;
        private long uniqueStudents;
    }

    @Data
    public static class ClassDetailStats {
        private String maLop;
        private long sessionCount;
        private long studentCount;
        private long totalAttendances;
        private long acceptedCount;
        private long reviewCount;
        private long rejectedCount;
        private double attendanceRate;
    }

    @Data
    public static class RealtimeStats {
        private String sessionId;
        private long total;
        private long accepted;
        private long review;
        private long rejected;
        private long recentCount;
        private String lastUpdated;
        private String latestMssv;
        private String latestStatus;
        private String latestTime;
    }

    @Data
    public static class BulkUpdateRequest {
        @NotBlank(message = "Session ID không được để trống")
        private String sessionId;

        @NotBlank(message = "Trạng thái nguồn không được để trống")
        private String fromStatus;

        @NotBlank(message = "Trạng thái đích không được để trống")
        private String toStatus;
    }

    @Data
    public static class BulkUpdateResult {
        private int updatedCount;
        private String fromStatus;
        private String toStatus;
        private String sessionId;
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

