# Face Recognition API Configuration

## Server Information

**Face API Server**: https://server.zettix.net

## Available Endpoints

### Health Check
```
GET /api/v1/face-recognition/health
```
Response:
```json
{
    "status": "healthy",
    "model_loaded": true,
    "device": "cuda"
}
```

### Face Recognition - Base64
```
POST /api/v1/face-recognition/predict/base64
Content-Type: application/json

{
    "image": "base64_string"
}
```

### Face Recognition - File Upload
```
POST /api/v1/face-recognition/predict/file
Content-Type: multipart/form-data

Form field: image (file)
```

Response format:
```json
{
    "success": true,
    "total_faces": 1,
    "detections": [
        {
            "face_id": 0,
            "class": "110122050_TranMinhDien",
            "confidence": 0.95
        }
    ]
}
```

### Legacy Endpoints (Not Recommended)
- `GET /health` - Use `/api/v1/face-recognition/health` instead
- `POST /predict` - Use `/api/v1/face-recognition/predict/file` instead

## Backend Configuration

### application.yml
```yaml
app:
  faceApiUrl: https://server.zettix.net
```

### FaceApiClient.java
Main client for face recognition. Uses:
- **Endpoint**: `/api/v1/face-recognition/predict/file`
- **Method**: POST with multipart/form-data
- **Response**: Mapped to `RecognizeResponse` with label and confidence

### EnhancedFaceApiClient.java
Enhanced client with additional features:

#### Face Recognition
- **Endpoint**: `/api/v1/face-recognition/predict/file` ✅
- **Status**: WORKING

#### Liveness Detection
- **Status**: MOCK IMPLEMENTATION ⚠️
- **Reason**: Endpoint not available on server.zettix.net
- Returns mock response based on image size

#### Face Quality Assessment
- **Status**: MOCK IMPLEMENTATION ⚠️
- **Reason**: Endpoint not available on server.zettix.net
- Returns mock quality scores

#### Multiple Face Detection
- **Status**: MOCK IMPLEMENTATION ⚠️
- **Reason**: Endpoint not available on server.zettix.net
- Returns mock detection (always 1 face)

## Frontend Configuration

### api.ts
```typescript
FACE_API_BASE_URL: import.meta.env.VITE_FACE_API_BASE_URL || 'https://server.zettix.net'

ENDPOINTS: {
  FACE_API: {
    HEALTH: '/api/v1/face-recognition/health',
    PREDICT_BASE64: '/api/v1/face-recognition/predict/base64',
    PREDICT_FILE: '/api/v1/face-recognition/predict/file',
  }
}
```

## Testing

### Test Health Endpoint
```bash
curl https://server.zettix.net/api/v1/face-recognition/health
```

### Test Face Recognition (from backend)
The backend automatically calls the Face API when processing attendance images.

### Check Backend Logs
```bash
sudo journalctl -u diemdanh-backend -f | grep -i "face"
```

## Troubleshooting

### Backend not connecting to Face API
1. Check backend logs:
   ```bash
   sudo journalctl -u diemdanh-backend -n 100 | grep -E "Face|face|ERROR"
   ```

2. Test connectivity from server:
   ```bash
   curl -v https://server.zettix.net/api/v1/face-recognition/health
   ```

3. Check application.yml configuration:
   ```bash
   grep faceApiUrl /root/Desktop/diem-danh-sinh-vien/backend/src/main/resources/application.yml
   ```

### Frontend not connecting to Face API
1. Check browser console for errors
2. Verify CORS is enabled on server.zettix.net
3. Check network tab in browser DevTools

## Future Enhancements

If server.zettix.net adds these endpoints in the future, update:

### Liveness Detection
```java
// In EnhancedFaceApiClient.java, replace mock with:
return webClient.post()
    .uri("/api/v1/face-recognition/liveness")
    .contentType(MediaType.MULTIPART_FORM_DATA)
    .body(BodyInserters.fromMultipartData("image", resource))
    .retrieve()
    .bodyToMono(LivenessApiResponse.class)
    .timeout(Duration.ofSeconds(15))
    .block();
```

### Face Quality
```java
return webClient.post()
    .uri("/api/v1/face-recognition/quality")
    // ... similar implementation
```

### Multiple Face Detection
```java
return webClient.post()
    .uri("/api/v1/face-recognition/detect-faces")
    // ... similar implementation
```

---

**Last Updated**: 2025-10-07  
**Backend Version**: 0.0.1-SNAPSHOT  
**Face API Server**: https://server.zettix.net