package com.diemdanh.api;

import com.diemdanh.dto.VisitorStatsResponse;
import com.diemdanh.service.VisitorStatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/visitor-stats")
@CrossOrigin(origins = "*")
public class VisitorStatsController {
    
    @Autowired
    private VisitorStatsService visitorStatsService;
    
    @PostMapping("/visit")
    public ResponseEntity<VisitorStatsResponse> recordVisit(HttpServletRequest request) {
        try {
            // Use session ID or IP as identifier
            String sessionId = request.getSession().getId();
            if (sessionId == null || sessionId.isEmpty()) {
                sessionId = request.getRemoteAddr();
            }
            
            VisitorStatsResponse stats = visitorStatsService.recordVisit(sessionId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            System.err.println("Error recording visit: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping
    public ResponseEntity<VisitorStatsResponse> getVisitorStats() {
        try {
            VisitorStatsResponse stats = visitorStatsService.getVisitorStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            System.err.println("Error getting visitor stats: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
