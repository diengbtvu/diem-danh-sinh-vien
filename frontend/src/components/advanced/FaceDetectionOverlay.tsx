import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

interface FaceDetectionOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onFaceDetected: (detected: boolean) => void;
  onFaceBoxes: (boxes: FaceBox[]) => void;
}

export const FaceDetectionOverlay: React.FC<FaceDetectionOverlayProps> = ({
  videoRef,
  onFaceDetected,
  onFaceBoxes
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        // In a real implementation, you would load face-api.js models
        // For now, we'll simulate face detection
        console.log('Loading face detection models...');
        
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsLoaded(true);
        console.log('Face detection models loaded');
      } catch (error) {
        console.error('Failed to load face detection models:', error);
      }
    };

    loadModels();
  }, []);

  // Start face detection when models are loaded and video is ready
  useEffect(() => {
    if (!isLoaded || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const detectFaces = async () => {
      if (video.readyState !== 4) return; // HAVE_ENOUGH_DATA

      try {
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Clear previous drawings
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Simulate face detection (in real implementation, use face-api.js)
        const mockFaces = simulateFaceDetection(video);
        
        // Draw face boxes
        mockFaces.forEach(face => {
          drawFaceBox(ctx, face);
        });

        // Update state
        onFaceDetected(mockFaces.length > 0);
        onFaceBoxes(mockFaces);

      } catch (error) {
        console.error('Face detection error:', error);
      }
    };

    // Start detection interval
    detectionIntervalRef.current = setInterval(detectFaces, 500); // 2 FPS - reduced to prevent jitter

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isLoaded, videoRef, onFaceDetected, onFaceBoxes]);

  const simulateFaceDetection = (video: HTMLVideoElement): FaceBox[] => {
    // This is a mock implementation
    // In a real app, you would use face-api.js or MediaPipe
    
    const width = video.videoWidth;
    const height = video.videoHeight;
    
    // Simulate detecting a face in the center area
    const centerX = width * 0.3;
    const centerY = height * 0.2;
    const faceWidth = width * 0.4;
    const faceHeight = height * 0.5;
    
    // Random chance of detection to simulate real behavior
    const detectionChance = Math.random();
    
    if (detectionChance > 0.3) { // 70% chance of detection
      return [{
        x: centerX,
        y: centerY,
        width: faceWidth,
        height: faceHeight,
        confidence: 0.8 + Math.random() * 0.2 // 80-100% confidence
      }];
    }
    
    return [];
  };

  const drawFaceBox = (ctx: CanvasRenderingContext2D, face: FaceBox) => {
    const { x, y, width, height, confidence } = face;
    
    // Set style based on confidence
    const color = confidence > 0.8 ? '#10b981' : confidence > 0.6 ? '#f59e0b' : '#ef4444';
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    
    // Draw main rectangle
    ctx.strokeRect(x, y, width, height);
    
    // Draw corner markers
    const cornerLength = 20;
    ctx.lineWidth = 4;
    
    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(x, y + cornerLength);
    ctx.lineTo(x, y);
    ctx.lineTo(x + cornerLength, y);
    ctx.stroke();
    
    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(x + width - cornerLength, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + cornerLength);
    ctx.stroke();
    
    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(x, y + height - cornerLength);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x + cornerLength, y + height);
    ctx.stroke();
    
    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(x + width - cornerLength, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width, y + height - cornerLength);
    ctx.stroke();
    
    // Draw confidence label
    ctx.fillStyle = color;
    ctx.font = '16px Arial';
    ctx.fillText(
      `${Math.round(confidence * 100)}%`,
      x,
      y - 10
    );
    
    // Draw center dot
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw animated pulse effect
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15 + Math.sin(Date.now() / 200) * 5, 0, 2 * Math.PI);
    ctx.stroke();
  };

  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      width="100%"
      height="100%"
      pointerEvents="none"
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
      
      {/* Face detection guide overlay */}
      <Box
        position="absolute"
        top="20%"
        left="25%"
        width="50%"
        height="60%"
        border="2px dashed rgba(255, 255, 255, 0.5)"
        borderRadius={2}
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%': {
              opacity: 0.5
            },
            '50%': {
              opacity: 1
            },
            '100%': {
              opacity: 0.5
            }
          }
        }}
      >
        <Box
          width={40}
          height={40}
          borderRadius="50%"
          border="2px solid rgba(255, 255, 255, 0.7)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="white"
          fontSize="20px"
        >
          👤
        </Box>
      </Box>
    </Box>
  );
};
