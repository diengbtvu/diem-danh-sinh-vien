package com.diemdanh.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateSessionSimpleRequest {
    @NotBlank(message = "Mã lớp không được để trống")
    private String maLop;
    
    // Optional: nếu không có sẽ dùng mặc định từ config
    private Integer durationMinutes; // Thời gian điểm danh (phút), mặc định 30 phút
}
