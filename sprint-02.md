# Sprint 2 — Advanced Features & PWA Enhancement

**Thời gian**: 3-4 tuần  
**Mục tiêu**: Nâng cấp hệ thống với PWA, camera features nâng cao, animations, anti-cheat, dashboard và integrations

## 📋 Sprint Goals

### Kết quả mong đợi (Deliverables)
- PWA hoàn chỉnh với offline support và installable
- Camera với face detection overlay và quality optimization
- UI/UX với smooth animations và micro-interactions
- Anti-cheat system với GPS, device fingerprinting, liveness detection
- Advanced dashboard với real-time analytics và custom reports
- Integration APIs cho LMS và external systems

### Definition of Done
- PWA manifest và service worker hoạt động
- Camera features test trên multiple devices
- Animations smooth trên mobile và desktop
- Anti-cheat features có thể detect basic fraud attempts
- Dashboard có real-time updates và export functionality
- API documentation và webhook system hoạt động

---

## 🎯 User Stories & Acceptance Criteria

### Epic 1: Progressive Web App (PWA)
- [ ] **US-04**: Web app có thể install và hoạt động như native app
  - AC: PWA manifest, service worker, offline fallback, install prompt cho web browsers
- [ ] **US-05**: App hoạt động offline với cached data
  - AC: Cache strategies, offline indicators, sync when online

### Epic 2: Advanced Camera Features  
- [ ] **US-06**: Camera tự động detect và highlight khuôn mặt
  - AC: Face detection overlay, quality assessment, auto-capture suggestions
- [ ] **US-07**: Tối ưu chất lượng ảnh tự động
  - AC: Auto-focus, exposure control, compression optimization

### Epic 3: Micro-interactions & Animations
- [ ] **US-08**: UI có animations mượt mà và responsive
  - AC: Page transitions, loading states, success/error animations
- [ ] **US-09**: Feedback tức thời cho user actions
  - AC: Button states, form validation, progress indicators

### Epic 4: Advanced Anti-Cheat
- [ ] **US-10**: Hệ thống detect và prevent attendance fraud
  - AC: GPS verification, device fingerprinting, multiple face detection
- [ ] **US-11**: Liveness detection cho face authentication
  - AC: Blink detection, head movement, photo/video spoofing prevention

### Epic 5: Advanced Dashboard
- [ ] **US-12**: Dashboard real-time với advanced analytics
  - AC: Live charts, predictive insights, custom date ranges
- [ ] **US-13**: Export và custom report generation
  - AC: Excel/PDF export, scheduled reports, data visualization

### Epic 6: Integration Ecosystem
- [ ] **US-14**: API ecosystem cho third-party integrations
  - AC: REST/GraphQL APIs, webhook system, rate limiting
- [ ] **US-15**: LMS integration templates
  - AC: Moodle/Canvas connectors, grade sync, SSO support

---

## 🛠 Technical Implementation Plan

### Backend Tasks

#### 1. PWA Support & Offline APIs
```java
// New endpoints for offline support
@RestController
@RequestMapping("/api/offline")
public class OfflineController {
    @GetMapping("/sync-data")
    public OfflineSyncResponse getSyncData();
    
    @PostMapping("/queue-attendance")
    public void queueOfflineAttendance(@RequestBody OfflineAttendanceRequest request);
}
```

#### 2. Advanced Anti-Cheat Service
```java
@Service
public class AntiCheatService {
    // GPS verification
    public boolean verifyLocation(double lat, double lng, String sessionId);
    
    // Device fingerprinting
    public String generateDeviceFingerprint(HttpServletRequest request);
    
    // Liveness detection integration
    public LivenessResult verifyLiveness(MultipartFile image);
}
```

#### 3. Advanced Analytics Service
```java
@Service
public class AdvancedAnalyticsService {
    // Real-time metrics
    public AttendanceMetrics getRealTimeMetrics(String sessionId);
    
    // Predictive analytics
    public PredictiveInsights getPredictiveInsights(String classId);
    
    // Custom reports
    public ReportData generateCustomReport(ReportRequest request);
}
```

#### 4. Integration & Webhook System
```java
@RestController
@RequestMapping("/api/integrations")
public class IntegrationController {
    @PostMapping("/webhooks/register")
    public WebhookResponse registerWebhook(@RequestBody WebhookRequest request);
    
    @GetMapping("/lms/moodle/sync")
    public MoodleSyncResponse syncWithMoodle(@RequestParam String courseId);
}
```

#### 5. Enhanced Face API Integration
```java
@Service
public class EnhancedFaceApiClient {
    // Liveness detection
    public LivenessResponse detectLiveness(byte[] imageBytes);
    
    // Face quality assessment
    public FaceQualityResponse assessQuality(byte[] imageBytes);
    
    // Multiple face detection
    public MultipleFaceResponse detectMultipleFaces(byte[] imageBytes);
}
```

### Frontend Tasks

#### 1. PWA Implementation
```typescript
// public/sw.js - Service Worker
const CACHE_NAME = 'attendance-v2.0.0';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/api/sessions/config'
];

// src/hooks/usePWA.ts
export const usePWA = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const installPWA = async () => {
    // Install prompt logic
  };
  
  return { isInstallable, isOffline, installPWA };
};
```

#### 2. Advanced Camera Component
```typescript
// src/components/AdvancedCamera.tsx
interface AdvancedCameraProps {
  onCapture: (imageData: CaptureResult) => void;
  enableFaceDetection?: boolean;
  enableQualityAssessment?: boolean;
  enableLivenessCheck?: boolean;
}

export const AdvancedCamera: React.FC<AdvancedCameraProps> = ({
  onCapture,
  enableFaceDetection = true,
  enableQualityAssessment = true,
  enableLivenessCheck = false
}) => {
  // Face detection overlay
  const [faceBoxes, setFaceBoxes] = useState<FaceBox[]>([]);
  const [qualityScore, setQualityScore] = useState<number>(0);
  const [livenessStatus, setLivenessStatus] = useState<LivenessStatus>('pending');
  
  // Real-time face detection
  useEffect(() => {
    if (enableFaceDetection && videoRef.current) {
      const detectFaces = async () => {
        // Use MediaPipe or face-api.js for client-side detection
      };
      
      const interval = setInterval(detectFaces, 100);
      return () => clearInterval(interval);
    }
  }, [enableFaceDetection]);
};
```

#### 3. Animation System
```typescript
// src/components/animations/AnimatedPage.tsx
import { motion, AnimatePresence } from 'framer-motion';

export const AnimatedPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
  >
    {children}
  </motion.div>
);

// src/components/animations/LoadingSpinner.tsx
export const LoadingSpinner: React.FC = () => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    className="loading-spinner"
  />
);
```

#### 4. Advanced Dashboard
```typescript
// src/pages/AdvancedDashboard.tsx
export const AdvancedDashboard: React.FC = () => {
  const [realTimeData, setRealTimeData] = useState<DashboardData>();
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>();
  const [customReports, setCustomReports] = useState<Report[]>([]);
  
  // Real-time WebSocket connection
  useEffect(() => {
    const ws = new WebSocket('/ws/dashboard');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setRealTimeData(data);
    };
    
    return () => ws.close();
  }, []);
  
  // Custom report builder
  const generateReport = async (config: ReportConfig) => {
    const response = await fetch('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify(config)
    });
    return response.blob();
  };
};
```

#### 5. Anti-Cheat Integration
```typescript
// src/hooks/useAntiCheat.ts
export const useAntiCheat = () => {
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>('');
  const [locationData, setLocationData] = useState<GeolocationData>();
  const [suspiciousActivity, setSuspiciousActivity] = useState<boolean>(false);
  
  // Generate device fingerprint
  useEffect(() => {
    const generateFingerprint = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
      
      const fingerprint = btoa(JSON.stringify({
        canvas: canvas.toDataURL(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }));
      
      setDeviceFingerprint(fingerprint);
    };
    
    generateFingerprint();
  }, []);
  
  // Get location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationData({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => console.warn('Location access denied:', error)
      );
    }
  }, []);
  
  return { deviceFingerprint, locationData, suspiciousActivity };
};
```

---

## 📦 New Dependencies

### Backend Dependencies
```xml
<!-- pom.xml additions -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi-ooxml</artifactId>
    <version>5.2.4</version>
</dependency>
<dependency>
    <groupId>com.itextpdf</groupId>
    <artifactId>itext7-core</artifactId>
    <version>7.2.5</version>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>
```

### Frontend Dependencies
```json
{
  "dependencies": {
    "framer-motion": "^10.16.4",
    "workbox-webpack-plugin": "^7.0.0",
    "face-api.js": "^0.22.2",
    "@mediapipe/face_detection": "^0.4.1646425229",
    "recharts": "^2.8.0",
    "date-fns": "^2.30.0",
    "react-query": "^3.39.3",
    "socket.io-client": "^4.7.2",
    "@types/canvas-fingerprinting": "^1.0.0"
  },
  "devDependencies": {
    "workbox-cli": "^7.0.0"
  }
}
```

---

## 🗂 New File Structure

### Backend
```
backend/src/main/java/com/diemdanh/
├── api/
│   ├── AdvancedAnalyticsController.java
│   ├── AntiCheatController.java
│   ├── IntegrationController.java
│   ├── OfflineController.java
│   └── WebhookController.java
├── service/
│   ├── AntiCheatService.java
│   ├── AdvancedAnalyticsService.java
│   ├── ReportGenerationService.java
│   ├── WebhookService.java
│   └── LMSIntegrationService.java
├── domain/
│   ├── DeviceFingerprintEntity.java
│   ├── LocationVerificationEntity.java
│   ├── WebhookEntity.java
│   └── ReportConfigEntity.java
├── dto/
│   ├── AntiCheatRequest.java
│   ├── LivenessResponse.java
│   ├── ReportRequest.java
│   └── WebhookRequest.java
└── config/
    ├── WebSocketConfig.java
    ├── RedisConfig.java
    └── IntegrationConfig.java
```

### Frontend
```
frontend/src/
├── components/
│   ├── advanced/
│   │   ├── AdvancedCamera.tsx
│   │   ├── FaceDetectionOverlay.tsx
│   │   ├── LivenessChecker.tsx
│   │   └── QualityAssessment.tsx
│   ├── animations/
│   │   ├── AnimatedPage.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── SuccessAnimation.tsx
│   │   └── ErrorAnimation.tsx
│   ├── dashboard/
│   │   ├── RealTimeChart.tsx
│   │   ├── CustomReportBuilder.tsx
│   │   ├── MetricsCard.tsx
│   │   └── ExportButton.tsx
│   └── pwa/
│       ├── InstallPrompt.tsx
│       ├── OfflineIndicator.tsx
│       └── UpdateNotification.tsx
├── hooks/
│   ├── usePWA.ts
│   ├── useAntiCheat.ts
│   ├── useRealTimeData.ts
│   └── useFaceDetection.ts
├── services/
│   ├── pwaService.ts
│   ├── antiCheatService.ts
│   ├── analyticsService.ts
│   └── integrationService.ts
├── pages/
│   ├── AdvancedDashboard.tsx
│   ├── ReportCenter.tsx
│   └── IntegrationSettings.tsx
└── utils/
    ├── deviceFingerprint.ts
    ├── faceDetection.ts
    └── reportGenerator.ts
```

---

## 🚀 Implementation Timeline

### Week 1: Foundation & PWA
- [ ] Setup PWA manifest và service worker
- [ ] Implement offline data sync
- [ ] Basic animation system với framer-motion
- [ ] Enhanced camera component structure

### Week 2: Advanced Features
- [ ] Face detection integration
- [ ] Anti-cheat service implementation
- [ ] Real-time dashboard với WebSocket
- [ ] Device fingerprinting

### Week 3: Analytics & Integrations
- [ ] Advanced analytics service
- [ ] Report generation system
- [ ] Webhook infrastructure
- [ ] LMS integration templates

### Week 4: Polish & Testing
- [ ] Performance optimization
- [ ] Cross-browser testing
- [ ] Security testing
- [ ] Documentation và deployment

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] Anti-cheat algorithms
- [ ] Report generation logic
- [ ] PWA service worker
- [ ] Face detection utilities

### Integration Tests
- [ ] WebSocket real-time updates
- [ ] Webhook delivery system
- [ ] LMS integration flows
- [ ] Offline sync mechanisms

### E2E Tests
- [ ] Complete attendance flow với advanced features
- [ ] PWA installation và offline usage
- [ ] Dashboard interactions
- [ ] Anti-cheat detection scenarios

---

## 📊 Success Metrics

- **PWA**: 90%+ users can install web app
- **Camera**: 95%+ face detection accuracy
- **Performance**: <2s page load, 60fps animations
- **Anti-cheat**: Detect 80%+ basic fraud attempts
- **Dashboard**: Real-time updates <500ms latency
- **Integration**: Support 3+ LMS platforms

---

## 🔄 Sprint Backlog

### Khởi tạo & chuẩn bị
- [ ] Update dependencies (backend + frontend)
- [ ] Setup new project structure
- [ ] Configure build tools for PWA

### Backend Implementation
- [ ] WebSocket configuration
- [ ] Anti-cheat service và entities
- [ ] Advanced analytics service
- [ ] Report generation với Excel/PDF
- [ ] Webhook system
- [ ] Integration APIs
- [ ] Enhanced Face API client

### Frontend Implementation
- [ ] PWA manifest và service worker
- [ ] Animation system với framer-motion
- [ ] Advanced camera với face detection
- [ ] Anti-cheat hooks và utilities
- [ ] Real-time dashboard
- [ ] Report center
- [ ] Integration settings page

### Testing & Deployment
- [ ] Unit tests cho new features
- [ ] Integration tests
- [ ] E2E testing scenarios
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation update
- [ ] Production deployment
```
