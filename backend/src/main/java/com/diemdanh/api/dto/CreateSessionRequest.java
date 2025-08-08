package com.diemdanh.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateSessionRequest {
    @NotBlank
    private String maLop;
    private String startAt; // ISO8601 optional
    private String endAt;   // ISO8601 optional
    private Integer rotateSeconds; // optional
}
