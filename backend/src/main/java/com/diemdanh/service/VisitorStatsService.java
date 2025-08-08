package com.diemdanh.service;

import com.diemdanh.domain.VisitorStatsEntity;
import com.diemdanh.dto.VisitorStatsResponse;
import com.diemdanh.repo.VisitorStatsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class VisitorStatsService {
    
    @Autowired
    private VisitorStatsRepository visitorStatsRepository;
    
    // Simulate online users counter
    private final AtomicInteger onlineUsers = new AtomicInteger(0);
    private final ConcurrentHashMap<String, Long> sessionTracker = new ConcurrentHashMap<>();
    private final Random random = new Random();
    
    @Transactional
    public VisitorStatsResponse recordVisit(String sessionId) {
        LocalDate today = LocalDate.now();
        
        // Check if this session already visited today
        boolean isNewVisit = !sessionTracker.containsKey(sessionId + "_" + today.toString());
        
        if (isNewVisit) {
            // Track this session for today
            sessionTracker.put(sessionId + "_" + today.toString(), System.currentTimeMillis());
            
            // Get or create today's stats
            VisitorStatsEntity todayStats = visitorStatsRepository.findByVisitDate(today)
                .orElse(new VisitorStatsEntity(today, 0L, 0L));
            
            // Get max total visits to continue the sequence
            Long maxTotal = visitorStatsRepository.findMaxTotalVisits();
            if (maxTotal == null) maxTotal = 1250L; // Starting number
            
            // Increment counters
            todayStats.setDailyVisits(todayStats.getDailyVisits() + 1);
            todayStats.setTotalVisits(maxTotal + 1);
            
            // Save updated stats
            visitorStatsRepository.save(todayStats);
        }
        
        return getVisitorStats();
    }
    
    public VisitorStatsResponse getVisitorStats() {
        LocalDate today = LocalDate.now();
        
        // Get today's stats
        VisitorStatsEntity todayStats = visitorStatsRepository.findByVisitDate(today)
            .orElse(new VisitorStatsEntity(today, 0L, 1250L)); // Default starting values
        
        // Get total visits (latest record)
        Long totalVisits = visitorStatsRepository.findMaxTotalVisits();
        if (totalVisits == null) totalVisits = 1250L;
        
        // Simulate online users (5-25 users)
        int currentOnline = 5 + random.nextInt(21);
        onlineUsers.set(currentOnline);
        
        return new VisitorStatsResponse(
            totalVisits,
            todayStats.getDailyVisits(),
            onlineUsers.get()
        );
    }
    
    // Method to simulate online user activity
    public void updateOnlineUsers() {
        int current = onlineUsers.get();
        int change = random.nextInt(5) - 2; // -2 to +2 change
        int newValue = Math.max(5, Math.min(25, current + change));
        onlineUsers.set(newValue);
    }
}
