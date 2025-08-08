package com.diemdanh.api.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BulkStudentsRequest {
    @NotEmpty
    private List<StudentItem> students;

    @Data
    public static class StudentItem {
        private String mssv;
        private String maLop;
        private String hoTen;
    }
}
