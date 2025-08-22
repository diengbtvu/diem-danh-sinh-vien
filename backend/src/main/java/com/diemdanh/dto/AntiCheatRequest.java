package com.diemdanh.dto;

import lombok.Data;

@Data
public class AntiCheatRequest {
    private String sessionId;
    private String mssv;
    private LocationData location;
    private DeviceFingerprint deviceFingerprint;
    private String ipAddress;
    private String userAgent;

    @Data
    public static class LocationData {
        private Double latitude;
        private Double longitude;
        private Double accuracy;
        private String method; // GPS, NETWORK, PASSIVE
    }

    @Data
    public static class DeviceFingerprint {
        private String fingerprintHash;
        private String userAgent;
        private String screenResolution;
        private String timezone;
        private String language;
        private String platform;
        private String canvasFingerprint;
    }
}
