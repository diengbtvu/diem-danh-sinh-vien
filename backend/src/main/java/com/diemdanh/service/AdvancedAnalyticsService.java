package com.diemdanh.service;

import com.diemdanh.domain.AttendanceEntity;
import com.diemdanh.domain.SessionEntity;
import com.diemdanh.domain.StudentEntity;
import com.diemdanh.repo.AttendanceRepository;
import com.diemdanh.repo.SessionRepository;
import com.diemdanh.repo.StudentRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdvancedAnalyticsService {

    private final AttendanceRepository attendanceRepository;
    private final SessionRepository sessionRepository;
    private final StudentRepository studentRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Data
    public static class AttendanceMetrics {
        private long totalAttendances;
        private long acceptedCount;
        private long reviewCount;
        private long rejectedCount;
        private double acceptanceRate;
        private double averageConfidence;
        private Map<String, Long> statusDistribution;
        private List<HourlyStats> hourlyStats;
        private List<DailyStats> dailyStats;
        private long recentAttendances; // Last 24 hours
        private double qualityScore;
    }

    @Data
    public static class HourlyStats {
        private int hour;
        private long count;
        private double averageConfidence;
    }

    @Data
    public static class DailyStats {
        private LocalDate date;
        private long count;
        private double acceptanceRate;
    }

    @Data
    public static class PredictiveInsights {
        private double expectedAttendanceRate;
        private List<String> riskStudents;
        private Map<String, Double> classPerformance;
        private List<String> recommendations;
        private Map<String, Object> trends;
    }

    @Data
    public static class ReportData {
        private String reportId;
        private String title;
        private Instant generatedAt;
        private Map<String, Object> data;
        private String format; // PDF, EXCEL, CSV
        private byte[] content;
    }

    public AttendanceMetrics getRealTimeMetrics(String sessionId) {
        try {
            List<AttendanceEntity> attendances;
            
            if (sessionId != null && !sessionId.isEmpty()) {
                attendances = attendanceRepository.findBySessionId(sessionId, null).getContent();
            } else {
                // Get all attendances from last 30 days
                Instant since = Instant.now().minus(30, ChronoUnit.DAYS);
                attendances = attendanceRepository.findByDateRange(since, Instant.now());
            }

            AttendanceMetrics metrics = new AttendanceMetrics();
            
            // Basic counts
            metrics.setTotalAttendances(attendances.size());
            metrics.setAcceptedCount(attendances.stream()
                .filter(a -> a.getStatus() == AttendanceEntity.Status.ACCEPTED)
                .count());
            metrics.setReviewCount(attendances.stream()
                .filter(a -> a.getStatus() == AttendanceEntity.Status.REVIEW)
                .count());
            metrics.setRejectedCount(attendances.stream()
                .filter(a -> a.getStatus() == AttendanceEntity.Status.REJECTED)
                .count());

            // Acceptance rate
            if (metrics.getTotalAttendances() > 0) {
                metrics.setAcceptanceRate((double) metrics.getAcceptedCount() / metrics.getTotalAttendances() * 100);
            }

            // Average confidence
            double avgConfidence = attendances.stream()
                .filter(a -> a.getFaceConfidence() != null)
                .mapToDouble(AttendanceEntity::getFaceConfidence)
                .average()
                .orElse(0.0);
            metrics.setAverageConfidence(avgConfidence);

            // Status distribution
            Map<String, Long> statusDist = attendances.stream()
                .collect(Collectors.groupingBy(
                    a -> a.getStatus().toString(),
                    Collectors.counting()
                ));
            metrics.setStatusDistribution(statusDist);

            // Hourly stats
            Map<Integer, List<AttendanceEntity>> hourlyGroups = attendances.stream()
                .collect(Collectors.groupingBy(a -> 
                    a.getCapturedAt().atZone(ZoneId.systemDefault()).getHour()
                ));

            List<HourlyStats> hourlyStats = hourlyGroups.entrySet().stream()
                .map(entry -> {
                    HourlyStats stats = new HourlyStats();
                    stats.setHour(entry.getKey());
                    stats.setCount(entry.getValue().size());
                    stats.setAverageConfidence(
                        entry.getValue().stream()
                            .filter(a -> a.getFaceConfidence() != null)
                            .mapToDouble(AttendanceEntity::getFaceConfidence)
                            .average()
                            .orElse(0.0)
                    );
                    return stats;
                })
                .sorted(Comparator.comparing(HourlyStats::getHour))
                .collect(Collectors.toList());
            metrics.setHourlyStats(hourlyStats);

            // Daily stats
            Map<LocalDate, List<AttendanceEntity>> dailyGroups = attendances.stream()
                .collect(Collectors.groupingBy(a -> 
                    a.getCapturedAt().atZone(ZoneId.systemDefault()).toLocalDate()
                ));

            List<DailyStats> dailyStats = dailyGroups.entrySet().stream()
                .map(entry -> {
                    DailyStats stats = new DailyStats();
                    stats.setDate(entry.getKey());
                    stats.setCount(entry.getValue().size());
                    
                    long accepted = entry.getValue().stream()
                        .filter(a -> a.getStatus() == AttendanceEntity.Status.ACCEPTED)
                        .count();
                    stats.setAcceptanceRate(entry.getValue().size() > 0 ? 
                        (double) accepted / entry.getValue().size() * 100 : 0.0);
                    return stats;
                })
                .sorted(Comparator.comparing(DailyStats::getDate))
                .collect(Collectors.toList());
            metrics.setDailyStats(dailyStats);

            // Recent attendances (last 24 hours)
            Instant last24Hours = Instant.now().minus(24, ChronoUnit.HOURS);
            metrics.setRecentAttendances(
                attendanceRepository.countRecentAttendances(last24Hours)
            );

            // Quality score (based on confidence and acceptance rate)
            metrics.setQualityScore(calculateQualityScore(avgConfidence, metrics.getAcceptanceRate()));

            // Send real-time update via WebSocket
            messagingTemplate.convertAndSend("/topic/metrics", metrics);

            return metrics;
        } catch (Exception e) {
            log.error("Error calculating real-time metrics: {}", e.getMessage());
            return new AttendanceMetrics();
        }
    }

    public PredictiveInsights getPredictiveInsights(String classId) {
        try {
            PredictiveInsights insights = new PredictiveInsights();
            
            // Get historical data for the class
            List<StudentEntity> students = studentRepository.findByMaLopOrderByHoTenAsc(classId);
            List<AttendanceEntity> attendances = new ArrayList<>();
            
            for (StudentEntity student : students) {
                attendances.addAll(attendanceRepository.findByMssv(student.getMssv(), null).getContent());
            }

            // Calculate expected attendance rate
            if (!attendances.isEmpty()) {
                long acceptedCount = attendances.stream()
                    .filter(a -> a.getStatus() == AttendanceEntity.Status.ACCEPTED)
                    .count();
                insights.setExpectedAttendanceRate((double) acceptedCount / attendances.size() * 100);
            }

            // Identify risk students (low attendance or confidence)
            Map<String, Double> studentPerformance = new HashMap<>();
            for (StudentEntity student : students) {
                List<AttendanceEntity> studentAttendances = attendances.stream()
                    .filter(a -> student.getMssv().equals(a.getMssv()))
                    .collect(Collectors.toList());
                
                if (!studentAttendances.isEmpty()) {
                    long accepted = studentAttendances.stream()
                        .filter(a -> a.getStatus() == AttendanceEntity.Status.ACCEPTED)
                        .count();
                    double rate = (double) accepted / studentAttendances.size() * 100;
                    studentPerformance.put(student.getMssv(), rate);
                }
            }

            List<String> riskStudents = studentPerformance.entrySet().stream()
                .filter(entry -> entry.getValue() < 70.0) // Less than 70% attendance
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
            insights.setRiskStudents(riskStudents);

            // Class performance comparison
            Map<String, Double> classPerformance = new HashMap<>();
            classPerformance.put(classId, insights.getExpectedAttendanceRate());
            insights.setClassPerformance(classPerformance);

            // Generate recommendations
            List<String> recommendations = generateRecommendations(insights, attendances);
            insights.setRecommendations(recommendations);

            // Trends analysis
            Map<String, Object> trends = analyzeTrends(attendances);
            insights.setTrends(trends);

            return insights;
        } catch (Exception e) {
            log.error("Error generating predictive insights: {}", e.getMessage());
            return new PredictiveInsights();
        }
    }

    public ReportData generateCustomReport(ReportRequest request) {
        try {
            ReportData report = new ReportData();
            report.setReportId(UUID.randomUUID().toString());
            report.setTitle(request.getTitle());
            report.setGeneratedAt(Instant.now());
            report.setFormat(request.getFormat());

            // Collect data based on request parameters
            Map<String, Object> data = new HashMap<>();
            
            if (request.getSessionIds() != null && !request.getSessionIds().isEmpty()) {
                for (String sessionId : request.getSessionIds()) {
                    AttendanceMetrics metrics = getRealTimeMetrics(sessionId);
                    data.put("session_" + sessionId, metrics);
                }
            }

            if (request.getDateRange() != null) {
                List<AttendanceEntity> attendances = attendanceRepository.findByDateRange(
                    request.getDateRange().getStart(),
                    request.getDateRange().getEnd()
                );
                data.put("attendances", attendances);
                data.put("summary", summarizeAttendances(attendances));
            }

            report.setData(data);

            // Generate report content based on format
            byte[] content = generateReportContent(report, request.getFormat());
            report.setContent(content);

            return report;
        } catch (Exception e) {
            log.error("Error generating custom report: {}", e.getMessage());
            throw new RuntimeException("Failed to generate report", e);
        }
    }

    private double calculateQualityScore(double avgConfidence, double acceptanceRate) {
        // Weighted score: 60% confidence, 40% acceptance rate
        return (avgConfidence * 0.6) + (acceptanceRate / 100.0 * 0.4);
    }

    private List<String> generateRecommendations(PredictiveInsights insights, List<AttendanceEntity> attendances) {
        List<String> recommendations = new ArrayList<>();
        
        if (insights.getExpectedAttendanceRate() < 80.0) {
            recommendations.add("Tỷ lệ điểm danh thấp. Khuyến nghị tăng cường động viên sinh viên.");
        }
        
        if (insights.getRiskStudents().size() > 5) {
            recommendations.add("Có nhiều sinh viên có nguy cơ. Cần can thiệp sớm.");
        }
        
        long lowConfidenceCount = attendances.stream()
            .filter(a -> a.getFaceConfidence() != null && a.getFaceConfidence() < 0.8)
            .count();
        
        if (lowConfidenceCount > attendances.size() * 0.2) {
            recommendations.add("Chất lượng nhận diện khuôn mặt cần cải thiện. Kiểm tra điều kiện ánh sáng.");
        }
        
        return recommendations;
    }

    private Map<String, Object> analyzeTrends(List<AttendanceEntity> attendances) {
        Map<String, Object> trends = new HashMap<>();
        
        // Weekly trend
        Map<Integer, Long> weeklyTrend = attendances.stream()
            .collect(Collectors.groupingBy(
                a -> a.getCapturedAt().atZone(ZoneId.systemDefault()).getDayOfWeek().getValue(),
                Collectors.counting()
            ));
        trends.put("weeklyTrend", weeklyTrend);
        
        // Monthly trend
        Map<Integer, Long> monthlyTrend = attendances.stream()
            .collect(Collectors.groupingBy(
                a -> a.getCapturedAt().atZone(ZoneId.systemDefault()).getMonthValue(),
                Collectors.counting()
            ));
        trends.put("monthlyTrend", monthlyTrend);
        
        return trends;
    }

    private Map<String, Object> summarizeAttendances(List<AttendanceEntity> attendances) {
        Map<String, Object> summary = new HashMap<>();
        summary.put("total", attendances.size());
        summary.put("accepted", attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.ACCEPTED).count());
        summary.put("review", attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.REVIEW).count());
        summary.put("rejected", attendances.stream().filter(a -> a.getStatus() == AttendanceEntity.Status.REJECTED).count());
        return summary;
    }

    private byte[] generateReportContent(ReportData report, String format) {
        // This is a simplified implementation
        // In production, you would use libraries like Apache POI for Excel, iText for PDF
        String content = "Report: " + report.getTitle() + "\n" +
                        "Generated: " + report.getGeneratedAt() + "\n" +
                        "Data: " + report.getData().toString();
        return content.getBytes();
    }

    @Data
    public static class ReportRequest {
        private String title;
        private String format; // PDF, EXCEL, CSV
        private List<String> sessionIds;
        private DateRange dateRange;
        private List<String> metrics;
        private Map<String, Object> filters;
    }

    @Data
    public static class DateRange {
        private Instant start;
        private Instant end;
    }
}
