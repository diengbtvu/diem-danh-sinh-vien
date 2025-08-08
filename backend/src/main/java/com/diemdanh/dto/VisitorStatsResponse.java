package com.diemdanh.dto;

public class VisitorStatsResponse {
    private Long totalVisits;
    private Long todayVisits;
    private Integer onlineUsers;
    
    public VisitorStatsResponse() {}
    
    public VisitorStatsResponse(Long totalVisits, Long todayVisits, Integer onlineUsers) {
        this.totalVisits = totalVisits;
        this.todayVisits = todayVisits;
        this.onlineUsers = onlineUsers;
    }
    
    // Getters and Setters
    public Long getTotalVisits() {
        return totalVisits;
    }
    
    public void setTotalVisits(Long totalVisits) {
        this.totalVisits = totalVisits;
    }
    
    public Long getTodayVisits() {
        return todayVisits;
    }
    
    public void setTodayVisits(Long todayVisits) {
        this.todayVisits = todayVisits;
    }
    
    public Integer getOnlineUsers() {
        return onlineUsers;
    }
    
    public void setOnlineUsers(Integer onlineUsers) {
        this.onlineUsers = onlineUsers;
    }
}
