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

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AttendanceRepository attendanceRepository;
    private final SessionRepository sessionRepository;

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }

    private boolean isAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && 
               authentication.getAuthorities().stream()
                   .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    /**
     * Get statistics by week/month/year
     * period: week, month, year
     * offset: 0 = current, -1 = previous, etc.
     */
    @GetMapping("/stats")
    public ResponseEntity<StatisticsResponse> getStatistics(
            @RequestParam(defaultValue = "week") String period,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(required = false) String maLop) {

        String currentUsername = getCurrentUsername();
        boolean admin = isAdmin();

        Instant[] range = getDateRange(period, offset);
        Instant startDate = range[0];
        Instant endDate = range[1];

        List<AttendanceEntity> attendances;
        List<SessionEntity> sessions;

        if (admin && maLop == null) {
            // Admin: All data
            attendances = attendanceRepository.findByDateRange(startDate, endDate);
            sessions = sessionRepository.findByStartAtBetween(startDate, endDate);
        } else if (admin && maLop != null) {
            // Admin: Filter by class
            attendances = attendanceRepository.findByDateRangeAndClass(startDate, endDate, maLop);
            sessions = sessionRepository.findByMaLopAndStartAtBetween(maLop, startDate, endDate);
        } else if (currentUsername != null) {
            // Teacher: Only their data
            List<SessionEntity> teacherSessions = sessionRepository.findByCreatedByUsernameAndStartAtBetween(
                currentUsername, startDate, endDate);
            sessions = teacherSessions;
            
            List<String> sessionIds = teacherSessions.stream()
                .map(SessionEntity::getSessionId)
                .collect(Collectors.toList());
            
            if (sessionIds.isEmpty()) {
                attendances = Collections.emptyList();
            } else {
                attendances = sessionIds.stream()
                    .flatMap(sid -> attendanceRepository.findBySessionId(sid, 
                        org.springframework.data.domain.Pageable.unpaged()).getContent().stream())
                    .filter(a -> a.getCapturedAt().isAfter(startDate) && a.getCapturedAt().isBefore(endDate))
                    .collect(Collectors.toList());
            }
        } else {
            return ResponseEntity.status(401).build();
        }

        // Calculate statistics
        StatisticsResponse response = calculateStatistics(attendances, sessions, startDate, endDate, period);
        return ResponseEntity.ok(response);
    }

    /**
     * Get trend data for charts (last N periods)
     */
    @GetMapping("/trend")
    public ResponseEntity<TrendResponse> getTrend(
            @RequestParam(defaultValue = "week") String period,
            @RequestParam(defaultValue = "8") int periods,
            @RequestParam(required = false) String maLop) {

        String currentUsername = getCurrentUsername();
        boolean admin = isAdmin();

        List<TrendDataPoint> dataPoints = new ArrayList<>();

        for (int i = periods - 1; i >= 0; i--) {
            Instant[] range = getDateRange(period, -i);
            Instant startDate = range[0];
            Instant endDate = range[1];

            List<AttendanceEntity> attendances;
            
            if (admin && maLop == null) {
                attendances = attendanceRepository.findByDateRange(startDate, endDate);
            } else if (admin && maLop != null) {
                attendances = attendanceRepository.findByDateRangeAndClass(startDate, endDate, maLop);
            } else if (currentUsername != null) {
                List<SessionEntity> teacherSessions = sessionRepository.findByCreatedByUsernameAndStartAtBetween(
                    currentUsername, startDate, endDate);
                
                List<String> sessionIds = teacherSessions.stream()
                    .map(SessionEntity::getSessionId)
                    .collect(Collectors.toList());
                
                if (sessionIds.isEmpty()) {
                    attendances = Collections.emptyList();
                } else {
                    attendances = sessionIds.stream()
                        .flatMap(sid -> attendanceRepository.findBySessionId(sid, 
                            org.springframework.data.domain.Pageable.unpaged()).getContent().stream())
                        .filter(a -> a.getCapturedAt().isAfter(startDate) && a.getCapturedAt().isBefore(endDate))
                        .collect(Collectors.toList());
                }
            } else {
                return ResponseEntity.status(401).build();
            }

            TrendDataPoint point = new TrendDataPoint();
            point.setPeriodLabel(getPeriodLabel(startDate, period));
            point.setStartDate(startDate.toString());
            point.setEndDate(endDate.toString());
            point.setTotalAttendances(attendances.size());
            point.setAcceptedCount(attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.ACCEPTED).count());
            point.setReviewCount(attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.REVIEW).count());
            point.setRejectedCount(attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.REJECTED).count());
            
            dataPoints.add(point);
        }

        TrendResponse response = new TrendResponse();
        response.setPeriod(period);
        response.setPeriods(periods);
        response.setData(dataPoints);
        
        return ResponseEntity.ok(response);
    }

    private Instant[] getDateRange(String period, int offset) {
        LocalDate now = LocalDate.now();
        LocalDate start, end;

        switch (period.toLowerCase()) {
            case "week":
                start = now.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY))
                          .plusWeeks(offset);
                end = start.plusWeeks(1);
                break;
            case "month":
                start = now.with(TemporalAdjusters.firstDayOfMonth()).plusMonths(offset);
                end = start.with(TemporalAdjusters.lastDayOfMonth()).plusDays(1);
                break;
            case "year":
                start = now.with(TemporalAdjusters.firstDayOfYear()).plusYears(offset);
                end = start.with(TemporalAdjusters.lastDayOfYear()).plusDays(1);
                break;
            default:
                start = now.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                end = start.plusWeeks(1);
        }

        return new Instant[]{
            start.atStartOfDay(ZoneId.systemDefault()).toInstant(),
            end.atStartOfDay(ZoneId.systemDefault()).toInstant()
        };
    }

    private String getPeriodLabel(Instant date, String period) {
        LocalDate localDate = date.atZone(ZoneId.systemDefault()).toLocalDate();
        
        switch (period.toLowerCase()) {
            case "week":
                return "Tuần " + localDate.get(java.time.temporal.WeekFields.ISO.weekOfWeekBasedYear()) + 
                       "/" + localDate.getYear();
            case "month":
                return "T" + localDate.getMonthValue() + "/" + localDate.getYear();
            case "year":
                return "Năm " + localDate.getYear();
            default:
                return localDate.toString();
        }
    }

    private StatisticsResponse calculateStatistics(
            List<AttendanceEntity> attendances, 
            List<SessionEntity> sessions,
            Instant startDate,
            Instant endDate,
            String period) {

        StatisticsResponse response = new StatisticsResponse();
        response.setPeriod(period);
        response.setStartDate(startDate.toString());
        response.setEndDate(endDate.toString());
        response.setPeriodLabel(getPeriodLabel(startDate, period));

        // Basic counts
        response.setTotalAttendances(attendances.size());
        response.setTotalSessions(sessions.size());
        
        long acceptedCount = attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.ACCEPTED).count();
        long reviewCount = attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.REVIEW).count();
        long rejectedCount = attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.REJECTED).count();
        
        response.setAcceptedCount(acceptedCount);
        response.setReviewCount(reviewCount);
        response.setRejectedCount(rejectedCount);

        // Percentages
        if (attendances.size() > 0) {
            response.setAcceptedRate((double) acceptedCount / attendances.size() * 100);
            response.setReviewRate((double) reviewCount / attendances.size() * 100);
            response.setRejectedRate((double) rejectedCount / attendances.size() * 100);
        }

        // Average confidence
        double avgConfidence = attendances.stream()
            .filter(a -> a.getFaceConfidence() != null)
            .mapToDouble(AttendanceEntity::getFaceConfidence)
            .average()
            .orElse(0.0);
        response.setAverageConfidence(avgConfidence);

        // Unique students
        long uniqueStudents = attendances.stream()
            .map(AttendanceEntity::getMssv)
            .filter(Objects::nonNull)
            .distinct()
            .count();
        response.setUniqueStudents(uniqueStudents);

        // Daily breakdown (for week/month view)
        if (!period.equals("year")) {
            Map<String, DailyStats> dailyMap = new LinkedHashMap<>();
            
            attendances.forEach(a -> {
                String day = a.getCapturedAt().atZone(ZoneId.systemDefault())
                    .toLocalDate().toString();
                
                dailyMap.computeIfAbsent(day, k -> new DailyStats(day));
                DailyStats stats = dailyMap.get(day);
                stats.total++;
                
                if (a.getStatus() == AttendanceEntity.Status.ACCEPTED) stats.accepted++;
                else if (a.getStatus() == AttendanceEntity.Status.REVIEW) stats.review++;
                else if (a.getStatus() == AttendanceEntity.Status.REJECTED) stats.rejected++;
            });
            
            response.setDailyBreakdown(new ArrayList<>(dailyMap.values()));
        }

        return response;
    }

    @Data
    public static class StatisticsResponse {
        private String period;
        private String periodLabel;
        private String startDate;
        private String endDate;
        
        private long totalAttendances;
        private long totalSessions;
        private long acceptedCount;
        private long reviewCount;
        private long rejectedCount;
        
        private double acceptedRate;
        private double reviewRate;
        private double rejectedRate;
        
        private double averageConfidence;
        private long uniqueStudents;
        
        private List<DailyStats> dailyBreakdown;
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
    public static class TrendResponse {
        private String period;
        private int periods;
        private List<TrendDataPoint> data;
    }

    @Data
    public static class TrendDataPoint {
        private String periodLabel;
        private String startDate;
        private String endDate;
        private long totalAttendances;
        private long acceptedCount;
        private long reviewCount;
        private long rejectedCount;
    }
}
