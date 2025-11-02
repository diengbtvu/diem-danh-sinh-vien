package com.diemdanh.api;

import com.diemdanh.domain.AttendanceEntity;
import com.diemdanh.domain.ClassEntity;
import com.diemdanh.domain.SessionEntity;
import com.diemdanh.domain.StudentEntity;
import com.diemdanh.repo.AttendanceRepository;
import com.diemdanh.repo.ClassRepository;
import com.diemdanh.repo.SessionRepository;
import com.diemdanh.repo.StudentRepository;
import com.diemdanh.repo.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import lombok.Data;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.springframework.util.StringUtils.hasText;

@RestController
@RequestMapping("/api/teacher")
@PreAuthorize("hasRole('GIANGVIEN')")
public class TeacherController {

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ClassRepository classRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    /**
     * Helper method to get current authenticated user
     */
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }

    /**
     * Get sessions created by the current teacher
     */
    @GetMapping("/sessions")
    public ResponseEntity<Map<String, Object>> getTeacherSessions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "startAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String search) {

        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return ResponseEntity.status(401).build();
        }

        Sort sort = Sort.by(sortDir.equals("desc") ? Sort.Direction.DESC : Sort.Direction.ASC, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<SessionEntity> sessions;

        if (search != null && !search.trim().isEmpty()) {
            // Search sessions by class name for this teacher
            sessions = sessionRepository.findByCreatedByUsernameAndMaLopContainingIgnoreCase(
                currentUsername, search.trim(), pageable);
        } else {
            // Get all sessions created by this teacher
            sessions = sessionRepository.findByCreatedByUsername(currentUsername, pageable);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("content", sessions.getContent());
        response.put("totalElements", sessions.getTotalElements());
        response.put("totalPages", sessions.getTotalPages());
        response.put("number", sessions.getNumber());
        response.put("size", sessions.getSize());

        return ResponseEntity.ok(response);
    }

    /**
     * Get students in classes taught by the current teacher
     */
    @GetMapping("/students")
    public ResponseEntity<Map<String, Object>> getTeacherStudents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "hoTen") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String search) {

        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return ResponseEntity.status(401).build();
        }

        // Get all class codes that this teacher has created sessions for
        List<String> teacherClasses = sessionRepository.findDistinctMaLopByCreatedByUsername(currentUsername);

        if (teacherClasses.isEmpty()) {
            // Teacher has no classes yet
            Map<String, Object> response = new HashMap<>();
            response.put("content", List.of());
            response.put("totalElements", 0);
            response.put("totalPages", 0);
            response.put("number", page);
            response.put("size", size);
            return ResponseEntity.ok(response);
        }

        Sort sort = Sort.by(sortDir.equals("desc") ? Sort.Direction.DESC : Sort.Direction.ASC, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<StudentEntity> students;
        
        if (search != null && !search.trim().isEmpty()) {
            // Search students in teacher's classes
            students = studentRepository.findByMaLopInAndHoTenContainingIgnoreCase(
                teacherClasses, search.trim(), pageable);
        } else {
            // Get all students in teacher's classes
            students = studentRepository.findByMaLopIn(teacherClasses, pageable);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("content", students.getContent());
        response.put("totalElements", students.getTotalElements());
        response.put("totalPages", students.getTotalPages());
        response.put("number", students.getNumber());
        response.put("size", students.getSize());

        return ResponseEntity.ok(response);
    }

    /**
     * Get teacher's classes with pagination
     */
    @GetMapping("/classes")
    public ResponseEntity<Map<String, Object>> getTeacherClasses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "maLop") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String search) {

        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return ResponseEntity.status(401).build();
        }

        Sort sort = Sort.by(sortDir.equals("desc") ? Sort.Direction.DESC : Sort.Direction.ASC, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ClassEntity> classes;

        if (search != null && !search.trim().isEmpty()) {
            // Search classes by code or name
            classes = classRepository.findByCreatedByUsernameAndSearch(
                currentUsername, search.trim(), pageable);
        } else {
            // Get all classes created by this teacher
            classes = classRepository.findByCreatedByUsername(currentUsername, pageable);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("content", classes.getContent());
        response.put("totalElements", classes.getTotalElements());
        response.put("totalPages", classes.getTotalPages());
        response.put("number", classes.getNumber());
        response.put("size", classes.getSize());

        return ResponseEntity.ok(response);
    }

    /**
     * Get teacher's class codes for dropdown
     */
    @GetMapping("/classes/codes")
    public ResponseEntity<Map<String, Object>> getTeacherClassCodes() {
        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return ResponseEntity.status(401).build();
        }

        List<String> classCodes = classRepository.findMaLopByCreatedByUsername(currentUsername);

        Map<String, Object> response = new HashMap<>();
        response.put("classes", classCodes);

        return ResponseEntity.ok(response);
    }

    /**
     * Get teacher dashboard statistics
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getTeacherDashboard() {
        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return ResponseEntity.status(401).build();
        }

        String username = currentUsername;
        
        // Get statistics for this teacher only
        long totalSessions = sessionRepository.countByCreatedByUsername(username);
        long activeSessions = sessionRepository.countByCreatedByUsernameAndEndAtAfter(username, java.time.Instant.now());

        List<String> teacherClasses = sessionRepository.findDistinctMaLopByCreatedByUsername(username);
        long totalStudents = teacherClasses.isEmpty() ? 0 : 
            studentRepository.countByMaLopIn(teacherClasses);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSessions", totalSessions);
        stats.put("activeSessions", activeSessions);
        stats.put("totalStudents", totalStudents);
        stats.put("totalClasses", teacherClasses.size());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("stats", stats);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Create a new class
     */
    @PostMapping(value = "/classes", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createClass(@RequestBody Map<String, String> request) {
        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return ResponseEntity.status(401).build();
        }

        String maLop = Optional.ofNullable(request.get("maLop")).map(String::trim).orElse("");
        String tenLop = Optional.ofNullable(request.get("tenLop")).map(String::trim).orElse("");
        String moTa = Optional.ofNullable(request.get("moTa")).map(String::trim).orElse("");

        if (!hasText(maLop) || !hasText(tenLop)) {
            return ResponseEntity
                .badRequest()
                .contentType(MediaType.TEXT_PLAIN)
                .body("Thiếu mã lớp hoặc tên lớp");
        }

        try {
            // Check if class already exists
            if (classRepository.existsById(maLop)) {
                return ResponseEntity
                    .status(409)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("Mã lớp đã tồn tại");
            }

            ClassEntity classEntity = new ClassEntity();
            classEntity.setMaLop(maLop);
            classEntity.setTenLop(tenLop);
            classEntity.setMoTa(moTa);
            classEntity.setCreatedByUsername(currentUsername);

            ClassEntity saved = classRepository.save(classEntity);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Update a class
     */
    @PutMapping(value = "/classes/{maLop}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ClassEntity> updateClass(@PathVariable String maLop, @RequestBody Map<String, String> request) {
        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            ClassEntity classEntity = classRepository.findById(maLop).orElse(null);
            if (classEntity == null || !classEntity.getCreatedByUsername().equals(currentUsername)) {
                return ResponseEntity.status(403).build(); // Not teacher's class
            }

            String tenLop = request.get("tenLop");
            String moTa = request.get("moTa");

            if (tenLop != null) {
                classEntity.setTenLop(tenLop.trim());
            }
            if (moTa != null) {
                classEntity.setMoTa(moTa.trim());
            }

            ClassEntity saved = classRepository.save(classEntity);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Delete a class
     */
    @DeleteMapping("/classes/{maLop}")
    public ResponseEntity<Void> deleteClass(@PathVariable String maLop) {
        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            ClassEntity classEntity = classRepository.findById(maLop).orElse(null);
            if (classEntity == null || !classEntity.getCreatedByUsername().equals(currentUsername)) {
                return ResponseEntity.status(403).build(); // Not teacher's class
            }

            classRepository.deleteById(maLop);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // REMOVED: Student import is now ADMIN-only
    // Teachers can only view students in their classes

    /**
     * Get session details (only for sessions created by this teacher)
     */
    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<SessionEntity> getSessionDetails(@PathVariable String sessionId) {
        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return ResponseEntity.status(401).build();
        }

        // Find session and verify it belongs to this teacher
        SessionEntity session = sessionRepository.findBySessionIdAndCreatedByUsername(sessionId, currentUsername);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(session);
    }

    /**
     * Get attendances for a session (only for sessions created by this teacher)
     */
    @GetMapping("/sessions/{sessionId}/attendances")
    public ResponseEntity<Map<String, Object>> getSessionAttendances(
            @PathVariable String sessionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "capturedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {

        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return ResponseEntity.status(401).build();
        }

        // Verify session belongs to this teacher
        SessionEntity session = sessionRepository.findBySessionIdAndCreatedByUsername(sessionId, currentUsername);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }

        Sort sort = Sort.by(sortDir.equals("desc") ? Sort.Direction.DESC : Sort.Direction.ASC, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<AttendanceEntity> attendances;

        if (status != null && !status.trim().isEmpty()) {
            try {
                AttendanceEntity.Status statusEnum = AttendanceEntity.Status.valueOf(status.toUpperCase());
                if (search != null && !search.trim().isEmpty()) {
                    attendances = attendanceRepository.findBySessionIdAndStatusAndMssvContainingIgnoreCase(
                        sessionId, statusEnum, search.trim(), pageable);
                } else {
                    attendances = attendanceRepository.findBySessionIdAndStatus(sessionId, statusEnum, pageable);
                }
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        } else {
            if (search != null && !search.trim().isEmpty()) {
                attendances = attendanceRepository.findBySessionIdAndMssvContainingIgnoreCase(
                    sessionId, search.trim(), pageable);
            } else {
                attendances = attendanceRepository.findBySessionId(sessionId, pageable);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("content", attendances.getContent());
        response.put("totalElements", attendances.getTotalElements());
        response.put("totalPages", attendances.getTotalPages());
        response.put("number", attendances.getNumber());
        response.put("size", attendances.getSize());

        return ResponseEntity.ok(response);
    }

    /**
     * Get session statistics (only for sessions created by this teacher)
     */
    @GetMapping("/sessions/{sessionId}/stats")
    public ResponseEntity<Map<String, Object>> getSessionStats(@PathVariable String sessionId) {
        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return ResponseEntity.status(401).build();
        }

        // Verify session belongs to this teacher
        SessionEntity session = sessionRepository.findBySessionIdAndCreatedByUsername(sessionId, currentUsername);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }

        // Calculate statistics
        long total = attendanceRepository.countBySessionId(sessionId);
        long accepted = attendanceRepository.countBySessionIdAndStatus(sessionId, AttendanceEntity.Status.ACCEPTED);
        long review = attendanceRepository.countBySessionIdAndStatus(sessionId, AttendanceEntity.Status.REVIEW);
        long rejected = attendanceRepository.countBySessionIdAndStatus(sessionId, AttendanceEntity.Status.REJECTED);

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("accepted", accepted);
        stats.put("review", review);
        stats.put("rejected", rejected);

        return ResponseEntity.ok(stats);
    }

    /**
     * Get real-time statistics for a session (only for sessions created by this teacher)
     */
    @GetMapping("/stats/realtime/{sessionId}")
    public ResponseEntity<RealtimeStats> getRealtimeStats(@PathVariable String sessionId) {
        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return ResponseEntity.status(401).build();
        }

        // Verify session belongs to this teacher
        SessionEntity session = sessionRepository.findBySessionIdAndCreatedByUsername(sessionId, currentUsername);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            // Get basic stats
            long total = attendanceRepository.countBySessionId(sessionId);
            long accepted = attendanceRepository.countBySessionIdAndStatus(sessionId, AttendanceEntity.Status.ACCEPTED);
            long review = attendanceRepository.countBySessionIdAndStatus(sessionId, AttendanceEntity.Status.REVIEW);
            long rejected = attendanceRepository.countBySessionIdAndStatus(sessionId, AttendanceEntity.Status.REJECTED);

            // Get recent activity (last 5 minutes)
            Instant fiveMinutesAgo = Instant.now().minusSeconds(5 * 60);
            List<AttendanceEntity> recentAttendances = attendanceRepository.findBySessionIdAndDateRange(
                sessionId, fiveMinutesAgo, Instant.now()
            );

            RealtimeStats realtimeStats = new RealtimeStats();
            realtimeStats.setSessionId(sessionId);
            realtimeStats.setTotal(total);
            realtimeStats.setAccepted(accepted);
            realtimeStats.setReview(review);
            realtimeStats.setRejected(rejected);
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

    /**
     * Update attendance record (only for teacher's sessions)
     */
    @PutMapping("/attendances/{id}")
    public ResponseEntity<?> updateAttendance(
            @PathVariable java.util.UUID id,
            @RequestBody Map<String, Object> updates) {
        
        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            AttendanceEntity attendance = attendanceRepository.findById(id).orElse(null);
            if (attendance == null) {
                return ResponseEntity.notFound().build();
            }

            // Verify session belongs to this teacher
            SessionEntity session = sessionRepository.findBySessionIdAndCreatedByUsername(
                attendance.getSessionId(), currentUsername);
            if (session == null) {
                return ResponseEntity.status(403).build(); // Not teacher's session
            }

            // Update allowed fields
            if (updates.containsKey("status")) {
                String statusStr = (String) updates.get("status");
                attendance.setStatus(AttendanceEntity.Status.valueOf(statusStr));
            }
            if (updates.containsKey("meta")) {
                attendance.setMeta((String) updates.get("meta"));
            }

            AttendanceEntity saved = attendanceRepository.save(attendance);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Delete attendance record (only for teacher's sessions)
     */
    @DeleteMapping("/attendances/{id}")
    public ResponseEntity<Void> deleteAttendance(@PathVariable java.util.UUID id) {
        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            AttendanceEntity attendance = attendanceRepository.findById(id).orElse(null);
            if (attendance == null) {
                return ResponseEntity.notFound().build();
            }

            // Verify session belongs to this teacher
            SessionEntity session = sessionRepository.findBySessionIdAndCreatedByUsername(
                attendance.getSessionId(), currentUsername);
            if (session == null) {
                return ResponseEntity.status(403).build(); // Not teacher's session
            }

            attendanceRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
