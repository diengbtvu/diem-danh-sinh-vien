package com.diemdanh.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "attendance")
public class AttendanceConfig {
    
    /**
     * QR B activation window duration in seconds
     * Default: 10 seconds
     */
    private int qrBWindowSeconds = 10;
    
    /**
     * QR token rotation interval in seconds
     * Default: 20 seconds
     */
    private int qrRotateSeconds = 20;
    
    /**
     * QR token step tolerance (how many steps before/after current step are valid)
     * Default: 1 step (allows ±1 step leeway)
     */
    private int qrStepTolerance = 1;
    
    /**
     * Session token validity duration in hours
     * Default: 24 hours
     */
    private int sessionTokenValidityHours = 24;
    
    /**
     * Maximum file size for attendance images in MB
     * Default: 5 MB
     */
    private int maxImageSizeMB = 5;
    
    /**
     * Frontend URL template for QR A
     * Default: http://localhost:5174/attend?session={sessionToken}
     */
    private String frontendUrlTemplate = "http://localhost:5174/attend?session={sessionToken}";

    // Getters and Setters
    public int getQrBWindowSeconds() {
        return qrBWindowSeconds;
    }

    public void setQrBWindowSeconds(int qrBWindowSeconds) {
        this.qrBWindowSeconds = qrBWindowSeconds;
    }

    public int getQrRotateSeconds() {
        return qrRotateSeconds;
    }

    public void setQrRotateSeconds(int qrRotateSeconds) {
        this.qrRotateSeconds = qrRotateSeconds;
    }

    public int getQrStepTolerance() {
        return qrStepTolerance;
    }

    public void setQrStepTolerance(int qrStepTolerance) {
        this.qrStepTolerance = qrStepTolerance;
    }

    public int getSessionTokenValidityHours() {
        return sessionTokenValidityHours;
    }

    public void setSessionTokenValidityHours(int sessionTokenValidityHours) {
        this.sessionTokenValidityHours = sessionTokenValidityHours;
    }

    public int getMaxImageSizeMB() {
        return maxImageSizeMB;
    }

    public void setMaxImageSizeMB(int maxImageSizeMB) {
        this.maxImageSizeMB = maxImageSizeMB;
    }

    public String getFrontendUrlTemplate() {
        return frontendUrlTemplate;
    }

    public void setFrontendUrlTemplate(String frontendUrlTemplate) {
        this.frontendUrlTemplate = frontendUrlTemplate;
    }
}
