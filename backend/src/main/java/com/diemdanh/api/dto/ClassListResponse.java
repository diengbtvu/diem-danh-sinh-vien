package com.diemdanh.api.dto;

import lombok.Data;

import java.util.List;

@Data
public class ClassListResponse {
    private List<ClassInfo> classes;
    
    @Data
    public static class ClassInfo {
        private String maLop;
        private long studentCount;
        private long sessionCount;
        
        public ClassInfo(String maLop, long studentCount, long sessionCount) {
            this.maLop = maLop;
            this.studentCount = studentCount;
            this.sessionCount = sessionCount;
        }
    }
}
