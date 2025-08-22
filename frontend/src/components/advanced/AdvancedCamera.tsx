import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Box, Button, Alert, Typography, Stack, IconButton, Tooltip, LinearProgress } from '@mui/material';
import { CameraAlt, FlipCameraAndroid, Person, CheckCircle, Warning, Error as ErrorIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingButton from '../LoadingButton';
import { FaceDetectionOverlay } from './FaceDetectionOverlay';
import { QualityAssessment } from './QualityAssessment';
import { LivenessChecker } from './LivenessChecker';

interface CaptureResult {
  imageDataUrl: string;
  imageFile: File;
  faceDetected: boolean;
  qualityScore: number;
  livenessScore: number;
  metadata: {
    timestamp: number;
    deviceInfo: string;
    resolution: string;
  };
}

interface AdvancedCameraProps {
  onCapture: (result: CaptureResult) => void;
  onCameraReady?: (ready: boolean) => void;
  onQRDetected?: (qrData: string) => void;
  enableFaceDetection?: boolean;
  enableQualityAssessment?: boolean;
  enableLivenessCheck?: boolean;
  enableQRScanning?: boolean;
  disabled?: boolean;
  autoCapture?: boolean;
  qualityThreshold?: number;
}

export const AdvancedCamera: React.FC<AdvancedCameraProps> = ({
  onCapture,
  onCameraReady,
  onQRDetected,
  enableFaceDetection = true,
  enableQualityAssessment = true,
  enableLivenessCheck = false,
  enableQRScanning = false,
  disabled = false,
  autoCapture = false,
  qualityThreshold = 0.7
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [isStarting, setIsStarting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Face detection states
  const [faceBoxes, setFaceBoxes] = useState<any[]>([]);
  const [faceDetected, setFaceDetected] = useState(false);
  const [qualityScore, setQualityScore] = useState<number>(0);
  const [livenessScore, setLivenessScore] = useState<number>(0);
  const [captureProgress, setCaptureProgress] = useState(0);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind, track.label);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
    setFaceDetected(false);
    setFaceBoxes([]);
    onCameraReady?.(false);
  }, [onCameraReady]);

  const startCamera = useCallback(async (facingMode: 'user' | 'environment') => {
    setIsStarting(true);
    setError(null);
    
    try {
      stopCamera();
      
      console.log('Requesting camera access with facingMode:', facingMode);
      
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Got media stream:', stream);
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        const video = videoRef.current;
        video.setAttribute('playsinline', '');
        video.muted = true;
        video.autoplay = true;
        video.srcObject = stream;

        return new Promise<void>((resolve, reject) => {
          const cleanup = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('canplay', onCanPlay);
            video.removeEventListener('error', onError);
          };

          const markReady = (from: string) => {
            console.log(`[Camera] Ready via ${from}. Dimensions:`, video.videoWidth, 'x', video.videoHeight);
            setIsReady(true);
            setFacing(facingMode);
            onCameraReady?.(true);
            setIsStarting(false);
            cleanup();
            resolve();
          };

          const onLoadedMetadata = () => {
            console.log('[Camera] loadedmetadata');
            video.play().then(() => markReady('loadedmetadata/play')).catch(err => {
              console.warn('[Camera] play() after loadedmetadata failed:', err);
            });
          };

          const onCanPlay = () => {
            console.log('[Camera] canplay');
            if (!isReady) markReady('canplay');
          };

          const onError = (e: Event) => {
            console.error('[Camera] video error:', e);
            cleanup();
            reject(new Error('Video playback failed'));
          };

          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('canplay', onCanPlay);
          video.addEventListener('error', onError);

          setTimeout(() => {
            if (!isReady) {
              console.log('[Camera] Timeout, forcing ready state');
              markReady('timeout');
            }
          }, 3000);
        });
      }
    } catch (error: any) {
      console.error('Camera access failed:', error);
      setError(`Camera access failed: ${error.message}`);
      setIsStarting(false);
      throw error;
    }
  }, [stopCamera, onCameraReady, isReady]);

  const switchCamera = useCallback(() => {
    const newFacing = facing === 'user' ? 'environment' : 'user';
    startCamera(newFacing);
  }, [facing, startCamera]);

  const captureImage = useCallback(async (): Promise<CaptureResult | null> => {
    if (!videoRef.current || !canvasRef.current || !isReady) {
      return null;
    }

    setIsCapturing(true);
    setCaptureProgress(0);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setCaptureProgress(25);

      // Get image data
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Convert to blob and file
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/jpeg', 0.9);
      });
      setCaptureProgress(50);

      const imageFile = new File([blob], `capture_${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });

      // Create metadata
      const metadata = {
        timestamp: Date.now(),
        deviceInfo: navigator.userAgent,
        resolution: `${canvas.width}x${canvas.height}`
      };
      setCaptureProgress(75);

      const result: CaptureResult = {
        imageDataUrl,
        imageFile,
        faceDetected,
        qualityScore,
        livenessScore,
        metadata
      };

      setCaptureProgress(100);
      setTimeout(() => setCaptureProgress(0), 1000);

      return result;
    } catch (error: any) {
      console.error('Image capture failed:', error);
      setError(`Capture failed: ${error.message}`);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [isReady, faceDetected, qualityScore, livenessScore]);

  const handleCapture = useCallback(async () => {
    const result = await captureImage();
    if (result) {
      onCapture(result);
    }
  }, [captureImage, onCapture]);

  // Auto-capture when conditions are met
  useEffect(() => {
    if (autoCapture && faceDetected && qualityScore >= qualityThreshold && !isCapturing) {
      const timer = setTimeout(() => {
        handleCapture();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoCapture, faceDetected, qualityScore, qualityThreshold, isCapturing, handleCapture]);

  // Initialize camera
  useEffect(() => {
    if (!disabled) {
      startCamera(facing);
    }
    return () => {
      stopCamera();
    };
  }, [disabled, facing]); // Remove startCamera, stopCamera from deps to prevent loop

  const getStatusColor = () => {
    if (!isReady) return 'grey';
    if (error) return 'error';
    if (faceDetected && qualityScore >= qualityThreshold) return 'success';
    if (faceDetected) return 'warning';
    return 'info';
  };

  const getStatusMessage = () => {
    if (!isReady) return 'Đang khởi động camera...';
    if (error) return error;
    if (!faceDetected) return 'Hãy đưa khuôn mặt vào khung hình';
    if (qualityScore < qualityThreshold) return 'Chất lượng ảnh chưa đủ tốt';
    return 'Sẵn sàng chụp ảnh';
  };

  return (
    <Box position="relative" width="100%" maxWidth={640} mx="auto">
      {/* Video Container */}
      <Box
        position="relative"
        width="100%"
        height={480}
        borderRadius={2}
        overflow="hidden"
        bgcolor="black"
        border={2}
        borderColor={getStatusColor() + '.main'}
        sx={{
          transition: 'border-color 0.3s ease'
        }}
      >
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          playsInline
          muted
        />

        {/* Face Detection Overlay */}
        {enableFaceDetection && isReady && (
          <FaceDetectionOverlay
            videoRef={videoRef}
            onFaceDetected={setFaceDetected}
            onFaceBoxes={setFaceBoxes}
          />
        )}

        {/* Quality Assessment */}
        {enableQualityAssessment && isReady && (
          <QualityAssessment
            videoRef={videoRef}
            onQualityScore={setQualityScore}
          />
        )}

        {/* Liveness Checker */}
        {enableLivenessCheck && isReady && (
          <LivenessChecker
            videoRef={videoRef}
            onLivenessScore={setLivenessScore}
          />
        )}

        {/* Loading Overlay */}
        <AnimatePresence>
          {(isStarting || isCapturing) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}
            >
              <Stack alignItems="center" spacing={2}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <CameraAlt fontSize="large" />
                </motion.div>
                <Typography variant="body1">
                  {isStarting ? 'Đang khởi động camera...' : 'Đang chụp ảnh...'}
                </Typography>
                {isCapturing && (
                  <LinearProgress
                    variant="determinate"
                    value={captureProgress}
                    sx={{ width: 200 }}
                  />
                )}
              </Stack>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera Controls */}
        <Box
          position="absolute"
          top={16}
          right={16}
          display="flex"
          gap={1}
        >
          <Tooltip title="Chuyển camera">
            <IconButton
              onClick={switchCamera}
              disabled={!isReady || isStarting}
              sx={{
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.7)'
                }
              }}
            >
              <FlipCameraAndroid />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Status Indicator */}
        <Box
          position="absolute"
          top={16}
          left={16}
          display="flex"
          alignItems="center"
          gap={1}
          px={2}
          py={1}
          borderRadius={1}
          bgcolor="rgba(0, 0, 0, 0.7)"
          color="white"
        >
          {getStatusColor() === 'success' && <CheckCircle color="success" fontSize="small" />}
          {getStatusColor() === 'warning' && <Warning color="warning" fontSize="small" />}
          {getStatusColor() === 'error' && <ErrorIcon color="error" fontSize="small" />}
          <Typography variant="caption">
            {getStatusMessage()}
          </Typography>
        </Box>

        {/* Quality Indicators */}
        {enableQualityAssessment && isReady && (
          <Box
            position="absolute"
            bottom={16}
            left={16}
            display="flex"
            gap={2}
          >
            <Box
              px={1}
              py={0.5}
              borderRadius={1}
              bgcolor="rgba(0, 0, 0, 0.7)"
              color="white"
            >
              <Typography variant="caption">
                Chất lượng: {Math.round(qualityScore * 100)}%
              </Typography>
            </Box>
            {enableLivenessCheck && (
              <Box
                px={1}
                py={0.5}
                borderRadius={1}
                bgcolor="rgba(0, 0, 0, 0.7)"
                color="white"
              >
                <Typography variant="caption">
                  Liveness: {Math.round(livenessScore * 100)}%
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Hidden Canvas */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />

      {/* Controls */}
      <Stack direction="row" spacing={2} mt={2} justifyContent="center">
        <LoadingButton
          onClick={handleCapture}
          disabled={!isReady || disabled || isCapturing}
          loading={isCapturing}
          variant="contained"
          size="large"
          startIcon={<CameraAlt />}
          sx={{
            minWidth: 160,
            background: faceDetected && qualityScore >= qualityThreshold
              ? 'linear-gradient(45deg, #10b981 30%, #059669 90%)'
              : undefined
          }}
        >
          {autoCapture ? 'Tự động chụp' : 'Chụp ảnh'}
        </LoadingButton>
      </Stack>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};
