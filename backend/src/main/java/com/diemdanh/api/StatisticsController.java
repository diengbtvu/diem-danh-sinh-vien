package com.diemdanh.api;

import com.diemdanh.domain.AttendanceEntity;
import com.diemdanh.domain.SessionEntity;
import com.diemdanh.repo.AttendanceRepository;
import com.diemdanh.repo.SessionRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final AttendanceRepository attendanceRepository;
    private final SessionRepository sessionRepository;

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }

    /**
     * Get attendance statistics by date range
     * Period: week, month, year, custom
     */
    @GetMapping("/attendance")
    public ResponseEntity<AttendanceStats> getAttendanceStats(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(required = false) String maLop,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return ResponseEntity.status(401).build();
        }

        // Calculate date range based on period
        Instant start;
        Instant end;
        
        if (startDate != null && endDate != null) {
            // Custom date range
            start = LocalDate.parse(startDate).atStartOfDay(ZoneId.systemDefault()).toInstant();
            end = LocalDate.parse(endDate).plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        } else {
            end = Instant.now();
            LocalDate now = LocalDate.now();
            
            switch (period.toLowerCase()) {
                case "week":
                    // Current week (Monday to Sunday)
                    LocalDate weekStart = now.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                    start = weekStart.atStartOfDay(ZoneId.systemDefault()).toInstant();
                    break;
                case "month":
                    // Current month
                    LocalDate monthStart = now.with(TemporalAdjusters.firstDayOfMonth());
                    start = monthStart.atStartOfDay(ZoneId.systemDefault()).toInstant();
                    break;
                case "year":
                    // Current year
                    LocalDate yearStart = now.with(TemporalAdjusters.firstDayOfYear());
                    start = yearStart.atStartOfDay(ZoneId.systemDefault()).toInstant();
                    break;
                case "last7days":
                    start = end.minus(7, ChronoUnit.DAYS);
                    break;
                case "last30days":
                    start = end.minus(30, ChronoUnit.DAYS);
                    break;
                case "last365days":
                    start = end.minus(365, ChronoUnit.DAYS);
                    break;
                default:
                    start = end.minus(30, ChronoUnit.DAYS);
            }
        }

        // Get attendances in date range
        List<AttendanceEntity> attendances;
        if (maLop != null && !maLop.trim().isEmpty()) {
            attendances = attendanceRepository.findByDateRangeAndClass(start, end, maLop);
        } else {
            attendances = attendanceRepository.findByDateRange(start, end);
        }
        
        // Get sessions in date range
        List<SessionEntity> sessions;
        if (maLop != null && !maLop.trim().isEmpty()) {
            sessions = sessionRepository.findByMaLopAndStartAtBetween(maLop, start, end);
        } else {
            sessions = sessionRepository.findByStartAtBetween(start, end);
        }

        // Calculate statistics
        long totalAttendances = attendances.size();
        long acceptedCount = attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.ACCEPTED).count();
        long reviewCount = attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.REVIEW).count();
        long rejectedCount = attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.REJECTED).count();

        // Group by date for chart
        Map<String, DailyStats> dailyStats = new LinkedHashMap<>();
        attendances.forEach(attendance -> {
            LocalDate date = attendance.getCapturedAt().atZone(ZoneId.systemDefault()).toLocalDate();
            String dateKey = date.toString();
            
            DailyStats stats = dailyStats.computeIfAbsent(dateKey, k -> new DailyStats(dateKey));
            stats.total++;
            switch (attendance.getStatus()) {
                case ACCEPTED: stats.accepted++; break;
                case REVIEW: stats.review++; break;
                case REJECTED: stats.rejected++; break;
            }
        });

        // Calculate average confidence
        double avgConfidence = attendances.stream()
                .filter(a -> a.getFaceConfidence() != null)
                .mapToDouble(AttendanceEntity::getFaceConfidence)
                .average()
                .orElse(0.0);

        // Get unique students
        long uniqueStudents = attendances.stream()
                .map(AttendanceEntity::getMssv)
                .filter(Objects::nonNull)
                .distinct()
                .count();

        // Count sessions
        long totalSessions = sessions.size();
        long activeSessions = sessions.stream().filter(SessionEntity::isActive).count();
        long completedSessions = totalSessions - activeSessions;
        
        // Build response
        AttendanceStats stats = new AttendanceStats();
        stats.setPeriod(period);
        stats.setStartDate(start.toString());
        stats.setEndDate(end.toString());
        stats.setTotalAttendances(totalAttendances);
        stats.setAcceptedCount(acceptedCount);
        stats.setReviewCount(reviewCount);
        stats.setRejectedCount(rejectedCount);
        stats.setAcceptanceRate(totalAttendances > 0 ? (double) acceptedCount / totalAttendances * 100 : 0);
        stats.setAverageConfidence(avgConfidence * 100);
        stats.setUniqueStudents(uniqueStudents);
        stats.setDailyStats(new ArrayList<>(dailyStats.values()));
        stats.setTotalSessions(totalSessions);
        stats.setActiveSessions(activeSessions);
        stats.setCompletedSessions(completedSessions);
        stats.setAverageAttendancePerSession(totalSessions > 0 ? (double) totalAttendances / totalSessions : 0);

        return ResponseEntity.ok(stats);
    }

    /**
     * Get statistics by class for teacher
     */
    @GetMapping("/by-class")
    public ResponseEntity<List<ClassStats>> getStatsByClass(
            @RequestParam(defaultValue = "month") String period) {

        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return ResponseEntity.status(401).build();
        }

        // Get teacher's classes
        List<String> teacherClasses = sessionRepository.findDistinctMaLopByCreatedByUsername(currentUsername);
        
        if (teacherClasses.isEmpty()) {
            return ResponseEntity.ok(new ArrayList<>());
        }

        // Calculate date range
        Instant endDate = Instant.now();
        Instant startDate;
        switch (period.toLowerCase()) {
            case "week":
                startDate = endDate.minus(7, ChronoUnit.DAYS);
                break;
            case "month":
                startDate = endDate.minus(30, ChronoUnit.DAYS);
                break;
            case "year":
                startDate = endDate.minus(365, ChronoUnit.DAYS);
                break;
            default:
                startDate = endDate.minus(30, ChronoUnit.DAYS);
        }

        // Get stats for each class
        List<ClassStats> classStatsList = new ArrayList<>();
        for (String maLop : teacherClasses) {
            List<AttendanceEntity> attendances = attendanceRepository.findByDateRangeAndClass(startDate, endDate, maLop);
            
            if (!attendances.isEmpty()) {
                ClassStats classStats = new ClassStats();
                classStats.setMaLop(maLop);
                classStats.setTotalAttendances(attendances.size());
                classStats.setAcceptedCount(attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.ACCEPTED).count());
                classStats.setReviewCount(attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.REVIEW).count());
                classStats.setRejectedCount(attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.REJECTED).count());
                classStats.setUniqueStudents(attendances.stream().map(AttendanceEntity::getMssv).filter(Objects::nonNull).distinct().count());
                
                classStatsList.add(classStats);
            }
        }

        return ResponseEntity.ok(classStatsList);
    }

    /**
     * Get statistics summary by period (week, month, year)
     */
    @GetMapping("/summary")
    public ResponseEntity<StatsSummary> getStatsSummary(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(required = false) String maLop) {
        
        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return ResponseEntity.status(401).build();
        }
        
        Instant end = Instant.now();
        LocalDate now = LocalDate.now();
        Instant start;
        
        switch (period.toLowerCase()) {
            case "week":
                LocalDate weekStart = now.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                start = weekStart.atStartOfDay(ZoneId.systemDefault()).toInstant();
                break;
            case "month":
                LocalDate monthStart = now.with(TemporalAdjusters.firstDayOfMonth());
                start = monthStart.atStartOfDay(ZoneId.systemDefault()).toInstant();
                break;
            case "year":
                LocalDate yearStart = now.with(TemporalAdjusters.firstDayOfYear());
                start = yearStart.atStartOfDay(ZoneId.systemDefault()).toInstant();
                break;
            default:
                start = end.minus(30, ChronoUnit.DAYS);
        }
        
        // Get data
        List<AttendanceEntity> attendances;
        List<SessionEntity> sessions;
        
        if (maLop != null && !maLop.trim().isEmpty()) {
            attendances = attendanceRepository.findByDateRangeAndClass(start, end, maLop);
            sessions = sessionRepository.findByMaLopAndStartAtBetween(maLop, start, end);
        } else {
            attendances = attendanceRepository.findByDateRange(start, end);
            sessions = sessionRepository.findByStartAtBetween(start, end);
        }
        
        StatsSummary summary = new StatsSummary();
        summary.setPeriod(period);
        summary.setTotalSessions(sessions.size());
        summary.setTotalAttendances(attendances.size());
        summary.setAcceptedCount(attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.ACCEPTED).count());
        summary.setUniqueStudents(attendances.stream().map(AttendanceEntity::getMssv).filter(Objects::nonNull).distinct().count());
        
        return ResponseEntity.ok(summary);
    }
    
    /**
     * Get weekly breakdown statistics
     */
    @GetMapping("/weekly")
    public ResponseEntity<List<PeriodStats>> getWeeklyStats(
            @RequestParam(required = false, defaultValue = "12") int weeks,
            @RequestParam(required = false) String maLop) {
        
        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return ResponseEntity.status(401).build();
        }
        
        List<PeriodStats> weeklyStats = new ArrayList<>();
        LocalDate now = LocalDate.now();
        
        for (int i = weeks - 1; i >= 0; i--) {
            LocalDate weekStart = now.minusWeeks(i).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            LocalDate weekEnd = weekStart.plusDays(6);
            
            Instant start = weekStart.atStartOfDay(ZoneId.systemDefault()).toInstant();
            Instant end = weekEnd.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
            
            List<AttendanceEntity> attendances;
            List<SessionEntity> sessions;
            
            if (maLop != null && !maLop.trim().isEmpty()) {
                attendances = attendanceRepository.findByDateRangeAndClass(start, end, maLop);
                sessions = sessionRepository.findByMaLopAndStartAtBetween(maLop, start, end);
            } else {
                attendances = attendanceRepository.findByDateRange(start, end);
                sessions = sessionRepository.findByStartAtBetween(start, end);
            }
            
            PeriodStats stats = new PeriodStats();
            stats.setPeriodLabel("Tuần " + weekStart.get(WeekFields.ISO.weekOfWeekBasedYear()) + ", " + weekStart.getYear());
            stats.setStartDate(weekStart.toString());
            stats.setEndDate(weekEnd.toString());
            stats.setTotalSessions(sessions.size());
            stats.setTotalAttendances(attendances.size());
            stats.setAcceptedCount(attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.ACCEPTED).count());
            stats.setReviewCount(attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.REVIEW).count());
            stats.setRejectedCount(attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.REJECTED).count());
            stats.setUniqueStudents(attendances.stream().map(AttendanceEntity::getMssv).filter(Objects::nonNull).distinct().count());
            
            weeklyStats.add(stats);
        }
        
        return ResponseEntity.ok(weeklyStats);
    }
    
    /**
     * Get monthly breakdown statistics
     */
    @GetMapping("/monthly")
    public ResponseEntity<List<PeriodStats>> getMonthlyStats(
            @RequestParam(required = false, defaultValue = "12") int months,
            @RequestParam(required = false) String maLop) {
        
        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return ResponseEntity.status(401).build();
        }
        
        List<PeriodStats> monthlyStats = new ArrayList<>();
        YearMonth now = YearMonth.now();
        
        for (int i = months - 1; i >= 0; i--) {
            YearMonth month = now.minusMonths(i);
            LocalDate monthStart = month.atDay(1);
            LocalDate monthEnd = month.atEndOfMonth();
            
            Instant start = monthStart.atStartOfDay(ZoneId.systemDefault()).toInstant();
            Instant end = monthEnd.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
            
            List<AttendanceEntity> attendances;
            List<SessionEntity> sessions;
            
            if (maLop != null && !maLop.trim().isEmpty()) {
                attendances = attendanceRepository.findByDateRangeAndClass(start, end, maLop);
                sessions = sessionRepository.findByMaLopAndStartAtBetween(maLop, start, end);
            } else {
                attendances = attendanceRepository.findByDateRange(start, end);
                sessions = sessionRepository.findByStartAtBetween(start, end);
            }
            
            PeriodStats stats = new PeriodStats();
            stats.setPeriodLabel("Tháng " + month.getMonthValue() + "/" + month.getYear());
            stats.setStartDate(monthStart.toString());
            stats.setEndDate(monthEnd.toString());
            stats.setTotalSessions(sessions.size());
            stats.setTotalAttendances(attendances.size());
            stats.setAcceptedCount(attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.ACCEPTED).count());
            stats.setReviewCount(attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.REVIEW).count());
            stats.setRejectedCount(attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.REJECTED).count());
            stats.setUniqueStudents(attendances.stream().map(AttendanceEntity::getMssv).filter(Objects::nonNull).distinct().count());
            
            monthlyStats.add(stats);
        }
        
        return ResponseEntity.ok(monthlyStats);
    }
    
    /**
     * Get yearly breakdown statistics  
     */
    @GetMapping("/yearly")
    public ResponseEntity<List<PeriodStats>> getYearlyStats(
            @RequestParam(required = false, defaultValue = "5") int years,
            @RequestParam(required = false) String maLop) {
        
        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return ResponseEntity.status(401).build();
        }
        
        List<PeriodStats> yearlyStats = new ArrayList<>();
        int currentYear = LocalDate.now().getYear();
        
        for (int i = years - 1; i >= 0; i--) {
            int year = currentYear - i;
            LocalDate yearStart = LocalDate.of(year, 1, 1);
            LocalDate yearEnd = LocalDate.of(year, 12, 31);
            
            Instant start = yearStart.atStartOfDay(ZoneId.systemDefault()).toInstant();
            Instant end = yearEnd.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
            
            List<AttendanceEntity> attendances;
            List<SessionEntity> sessions;
            
            if (maLop != null && !maLop.trim().isEmpty()) {
                attendances = attendanceRepository.findByDateRangeAndClass(start, end, maLop);
                sessions = sessionRepository.findByMaLopAndStartAtBetween(maLop, start, end);
            } else {
                attendances = attendanceRepository.findByDateRange(start, end);
                sessions = sessionRepository.findByStartAtBetween(start, end);
            }
            
            PeriodStats stats = new PeriodStats();
            stats.setPeriodLabel("Năm " + year);
            stats.setStartDate(yearStart.toString());
            stats.setEndDate(yearEnd.toString());
            stats.setTotalSessions(sessions.size());
            stats.setTotalAttendances(attendances.size());
            stats.setAcceptedCount(attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.ACCEPTED).count());
            stats.setReviewCount(attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.REVIEW).count());
            stats.setRejectedCount(attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.REJECTED).count());
            stats.setUniqueStudents(attendances.stream().map(AttendanceEntity::getMssv).filter(Objects::nonNull).distinct().count());
            
            yearlyStats.add(stats);
        }
        
        return ResponseEntity.ok(yearlyStats);
    }

    @Data
    public static class AttendanceStats {
        private String period;
        private String startDate;
        private String endDate;
        private long totalAttendances;
        private long acceptedCount;
        private long reviewCount;
        private long rejectedCount;
        private double acceptanceRate;
        private double averageConfidence;
        private long uniqueStudents;
        private List<DailyStats> dailyStats;
        private long totalSessions;
        private long activeSessions;
        private long completedSessions;
        private double averageAttendancePerSession;
    }
    
    @Data
    public static class StatsSummary {
        private String period;
        private long totalSessions;
        private long totalAttendances;
        private long acceptedCount;
        private long uniqueStudents;
    }
    
    @Data
    public static class PeriodStats {
        private String periodLabel;
        private String startDate;
        private String endDate;
        private long totalSessions;
        private long totalAttendances;
        private long acceptedCount;
        private long reviewCount;
        private long rejectedCount;
        private long uniqueStudents;
    }

    @Data
    public static class DailyStats {
        private String date;
        private int total;
        private int accepted;
        private int review;
        private int rejected;

        public DailyStats(String date) {
            this.date = date;
            this.total = 0;
            this.accepted = 0;
            this.review = 0;
            this.rejected = 0;
        }
    }

    @Data
    public static class ClassStats {
        private String maLop;
        private long totalAttendances;
        private long acceptedCount;
        private long reviewCount;
        private long rejectedCount;
        private long uniqueStudents;
    }
}
