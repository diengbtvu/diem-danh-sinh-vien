package com.diemdanh.api;

import com.diemdanh.service.AdvancedAnalyticsService;
import com.diemdanh.service.AdvancedAnalyticsService.AttendanceMetrics;
import com.diemdanh.service.AdvancedAnalyticsService.PredictiveInsights;
import com.diemdanh.service.AdvancedAnalyticsService.ReportData;
import com.diemdanh.service.AdvancedAnalyticsService.ReportRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {
    "https://zettix.net",
    "https://www.zettix.net",
    "http://localhost:8000",
    "http://localhost:5173",
    "http://localhost:5174"
}, allowCredentials = "true")
public class AdvancedAnalyticsController {

    private final AdvancedAnalyticsService analyticsService;

    @GetMapping("/metrics")
    public ResponseEntity<AttendanceMetrics> getRealTimeMetrics(
            @RequestParam(required = false) String sessionId) {
        try {
            AttendanceMetrics metrics = analyticsService.getRealTimeMetrics(sessionId);
            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            log.error("Error fetching real-time metrics: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/insights/{classId}")
    public ResponseEntity<PredictiveInsights> getPredictiveInsights(
            @PathVariable String classId) {
        try {
            PredictiveInsights insights = analyticsService.getPredictiveInsights(classId);
            return ResponseEntity.ok(insights);
        } catch (Exception e) {
            log.error("Error fetching predictive insights: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/reports/generate")
    public ResponseEntity<Map<String, Object>> generateReport(
            @RequestBody ReportRequest request) {
        try {
            ReportData report = analyticsService.generateCustomReport(request);
            
            Map<String, Object> response = new HashMap<>();
            response.put("reportId", report.getReportId());
            response.put("title", report.getTitle());
            response.put("generatedAt", report.getGeneratedAt());
            response.put("format", report.getFormat());
            response.put("size", report.getContent().length);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error generating report: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Report generation failed");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/reports/{reportId}/download")
    public ResponseEntity<byte[]> downloadReport(@PathVariable String reportId) {
        try {
            // In a real implementation, you would store and retrieve reports
            // For now, we'll generate a sample report
            ReportRequest sampleRequest = new ReportRequest();
            sampleRequest.setTitle("Sample Report");
            sampleRequest.setFormat("PDF");
            
            ReportData report = analyticsService.generateCustomReport(sampleRequest);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", 
                "report_" + reportId + "." + report.getFormat().toLowerCase());
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(report.getContent());
        } catch (Exception e) {
            log.error("Error downloading report: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/dashboard/summary")
    public ResponseEntity<Map<String, Object>> getDashboardSummary() {
        try {
            AttendanceMetrics metrics = analyticsService.getRealTimeMetrics(null);
            
            Map<String, Object> summary = new HashMap<>();
            summary.put("totalAttendances", metrics.getTotalAttendances());
            summary.put("acceptanceRate", metrics.getAcceptanceRate());
            summary.put("averageConfidence", metrics.getAverageConfidence());
            summary.put("recentAttendances", metrics.getRecentAttendances());
            summary.put("qualityScore", metrics.getQualityScore());
            summary.put("statusDistribution", metrics.getStatusDistribution());
            
            // Add some additional dashboard metrics
            summary.put("activeSessions", 5); // Mock data
            summary.put("onlineUsers", 23); // Mock data
            summary.put("systemHealth", "healthy");
            summary.put("lastUpdate", System.currentTimeMillis());
            
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            log.error("Error fetching dashboard summary: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/trends/hourly")
    public ResponseEntity<Map<String, Object>> getHourlyTrends(
            @RequestParam(required = false) String sessionId) {
        try {
            AttendanceMetrics metrics = analyticsService.getRealTimeMetrics(sessionId);
            
            Map<String, Object> trends = new HashMap<>();
            trends.put("hourlyStats", metrics.getHourlyStats());
            trends.put("peakHour", findPeakHour(metrics.getHourlyStats()));
            trends.put("averagePerHour", calculateAveragePerHour(metrics.getHourlyStats()));
            
            return ResponseEntity.ok(trends);
        } catch (Exception e) {
            log.error("Error fetching hourly trends: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/trends/daily")
    public ResponseEntity<Map<String, Object>> getDailyTrends(
            @RequestParam(required = false) String sessionId) {
        try {
            AttendanceMetrics metrics = analyticsService.getRealTimeMetrics(sessionId);
            
            Map<String, Object> trends = new HashMap<>();
            trends.put("dailyStats", metrics.getDailyStats());
            trends.put("trend", calculateTrend(metrics.getDailyStats()));
            trends.put("averagePerDay", calculateAveragePerDay(metrics.getDailyStats()));
            
            return ResponseEntity.ok(trends);
        } catch (Exception e) {
            log.error("Error fetching daily trends: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/performance/classes")
    public ResponseEntity<Map<String, Object>> getClassPerformance() {
        try {
            // Mock class performance data
            Map<String, Object> performance = new HashMap<>();
            
            Map<String, Double> classRates = new HashMap<>();
            classRates.put("22DTHA1", 95.5);
            classRates.put("22DTHA2", 87.3);
            classRates.put("22DTHA3", 92.1);
            classRates.put("22DTHB1", 89.7);
            
            performance.put("attendanceRates", classRates);
            performance.put("topPerforming", "22DTHA1");
            performance.put("needsAttention", "22DTHA2");
            performance.put("averageRate", 91.15);
            
            return ResponseEntity.ok(performance);
        } catch (Exception e) {
            log.error("Error fetching class performance: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // WebSocket endpoints for real-time updates
    @MessageMapping("/analytics/subscribe")
    @SendTo("/topic/analytics")
    public Map<String, Object> subscribeToAnalytics() {
        try {
            AttendanceMetrics metrics = analyticsService.getRealTimeMetrics(null);
            Map<String, Object> update = new HashMap<>();
            update.put("type", "metrics_update");
            update.put("data", metrics);
            update.put("timestamp", System.currentTimeMillis());
            return update;
        } catch (Exception e) {
            log.error("Error in analytics subscription: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("type", "error");
            error.put("message", e.getMessage());
            return error;
        }
    }

    @MessageMapping("/analytics/session/{sessionId}")
    @SendTo("/topic/session/{sessionId}")
    public Map<String, Object> subscribeToSessionAnalytics(@PathVariable String sessionId) {
        try {
            AttendanceMetrics metrics = analyticsService.getRealTimeMetrics(sessionId);
            Map<String, Object> update = new HashMap<>();
            update.put("type", "session_metrics");
            update.put("sessionId", sessionId);
            update.put("data", metrics);
            update.put("timestamp", System.currentTimeMillis());
            return update;
        } catch (Exception e) {
            log.error("Error in session analytics subscription: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("type", "error");
            error.put("sessionId", sessionId);
            error.put("message", e.getMessage());
            return error;
        }
    }

    // Helper methods
    private int findPeakHour(java.util.List<AdvancedAnalyticsService.HourlyStats> hourlyStats) {
        return hourlyStats.stream()
            .max(java.util.Comparator.comparing(AdvancedAnalyticsService.HourlyStats::getCount))
            .map(AdvancedAnalyticsService.HourlyStats::getHour)
            .orElse(0);
    }

    private double calculateAveragePerHour(java.util.List<AdvancedAnalyticsService.HourlyStats> hourlyStats) {
        return hourlyStats.stream()
            .mapToLong(AdvancedAnalyticsService.HourlyStats::getCount)
            .average()
            .orElse(0.0);
    }

    private String calculateTrend(java.util.List<AdvancedAnalyticsService.DailyStats> dailyStats) {
        if (dailyStats.size() < 2) return "insufficient_data";
        
        long recent = dailyStats.get(dailyStats.size() - 1).getCount();
        long previous = dailyStats.get(dailyStats.size() - 2).getCount();
        
        if (recent > previous) return "increasing";
        else if (recent < previous) return "decreasing";
        else return "stable";
    }

    private double calculateAveragePerDay(java.util.List<AdvancedAnalyticsService.DailyStats> dailyStats) {
        return dailyStats.stream()
            .mapToLong(AdvancedAnalyticsService.DailyStats::getCount)
            .average()
            .orElse(0.0);
    }
}
