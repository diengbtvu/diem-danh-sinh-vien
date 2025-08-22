import React, { useEffect, useRef, useState } from 'react';

interface LivenessCheckerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onLivenessScore: (score: number) => void;
}

interface FrameData {
  timestamp: number;
  brightness: number;
  motion: number;
}

export const LivenessChecker: React.FC<LivenessCheckerProps> = ({
  videoRef,
  onLivenessScore
}) => {
  const livenessIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousFrameRef = useRef<ImageData | null>(null);
  const frameHistoryRef = useRef<FrameData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    const checkLiveness = () => {
      if (video.readyState !== 4) return; // HAVE_ENOUGH_DATA

      try {
        setIsAnalyzing(true);
        
        // Create a temporary canvas to analyze the video frame
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get image data for analysis
        const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Analyze liveness
        const livenessScore = analyzeLiveness(currentFrame);
        
        onLivenessScore(livenessScore);
        
        // Store current frame for next comparison
        previousFrameRef.current = currentFrame;
        
        setIsAnalyzing(false);
      } catch (error) {
        console.error('Liveness check error:', error);
        setIsAnalyzing(false);
      }
    };

    // Start liveness checking interval
    livenessIntervalRef.current = setInterval(checkLiveness, 200); // 5 FPS

    return () => {
      if (livenessIntervalRef.current) {
        clearInterval(livenessIntervalRef.current);
      }
    };
  }, [videoRef, onLivenessScore]);

  const analyzeLiveness = (currentFrame: ImageData): number => {
    const timestamp = Date.now();
    
    // Calculate frame brightness
    const brightness = calculateFrameBrightness(currentFrame);
    
    // Calculate motion if we have a previous frame
    let motion = 0;
    if (previousFrameRef.current) {
      motion = calculateMotion(previousFrameRef.current, currentFrame);
    }
    
    // Store frame data
    const frameData: FrameData = { timestamp, brightness, motion };
    frameHistoryRef.current.push(frameData);
    
    // Keep only last 50 frames (10 seconds at 5 FPS)
    if (frameHistoryRef.current.length > 50) {
      frameHistoryRef.current.shift();
    }
    
    // Calculate liveness metrics
    const motionScore = calculateMotionScore();
    const brightnessVariationScore = calculateBrightnessVariationScore();
    const temporalConsistencyScore = calculateTemporalConsistencyScore();
    
    // Combine scores with weights
    const livenessScore = (
      motionScore * 0.5 +
      brightnessVariationScore * 0.3 +
      temporalConsistencyScore * 0.2
    );
    
    return Math.max(0, Math.min(1, livenessScore));
  };

  const calculateFrameBrightness = (frame: ImageData): number => {
    const data = frame.data;
    let brightnessSum = 0;
    const pixelCount = data.length / 4;
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      brightnessSum += brightness;
    }
    
    return brightnessSum / pixelCount;
  };

  const calculateMotion = (prevFrame: ImageData, currFrame: ImageData): number => {
    const prevData = prevFrame.data;
    const currData = currFrame.data;
    let motionSum = 0;
    const pixelCount = prevData.length / 4;
    
    for (let i = 0; i < prevData.length; i += 4) {
      const prevGray = (prevData[i] + prevData[i + 1] + prevData[i + 2]) / 3;
      const currGray = (currData[i] + currData[i + 1] + currData[i + 2]) / 3;
      const diff = Math.abs(currGray - prevGray);
      motionSum += diff;
    }
    
    return motionSum / pixelCount;
  };

  const calculateMotionScore = (): number => {
    if (frameHistoryRef.current.length < 10) return 0.5; // Not enough data
    
    const recentFrames = frameHistoryRef.current.slice(-10);
    const motionValues = recentFrames.map(frame => frame.motion);
    
    // Calculate average motion
    const averageMotion = motionValues.reduce((sum, motion) => sum + motion, 0) / motionValues.length;
    
    // Good liveness should have some motion but not too much
    // Optimal range: 5-20 (arbitrary units based on pixel differences)
    if (averageMotion < 2) {
      return 0.2; // Too static, might be a photo
    } else if (averageMotion > 30) {
      return 0.3; // Too much motion, might be unstable
    } else {
      return 0.8; // Good motion range
    }
  };

  const calculateBrightnessVariationScore = (): number => {
    if (frameHistoryRef.current.length < 10) return 0.5; // Not enough data
    
    const recentFrames = frameHistoryRef.current.slice(-10);
    const brightnessValues = recentFrames.map(frame => frame.brightness);
    
    // Calculate brightness variation (standard deviation)
    const mean = brightnessValues.reduce((sum, brightness) => sum + brightness, 0) / brightnessValues.length;
    const variance = brightnessValues.reduce((sum, brightness) => sum + Math.pow(brightness - mean, 2), 0) / brightnessValues.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Some brightness variation indicates natural lighting changes
    // But too much variation might indicate artificial manipulation
    if (standardDeviation < 1) {
      return 0.3; // Too stable, might be a static image
    } else if (standardDeviation > 20) {
      return 0.4; // Too much variation, might be artificial
    } else {
      return 0.8; // Good natural variation
    }
  };

  const calculateTemporalConsistencyScore = (): number => {
    if (frameHistoryRef.current.length < 20) return 0.5; // Not enough data
    
    const recentFrames = frameHistoryRef.current.slice(-20);
    
    // Check for periodic patterns that might indicate video replay
    const motionPattern = recentFrames.map(frame => frame.motion);
    const hasPeriodicPattern = detectPeriodicPattern(motionPattern);
    
    if (hasPeriodicPattern) {
      return 0.2; // Detected periodic pattern, might be a video
    }
    
    // Check for sudden changes that might indicate switching between images
    let suddenChanges = 0;
    for (let i = 1; i < recentFrames.length; i++) {
      const motionDiff = Math.abs(recentFrames[i].motion - recentFrames[i - 1].motion);
      const brightnessDiff = Math.abs(recentFrames[i].brightness - recentFrames[i - 1].brightness);
      
      if (motionDiff > 15 || brightnessDiff > 30) {
        suddenChanges++;
      }
    }
    
    const suddenChangeRatio = suddenChanges / (recentFrames.length - 1);
    
    if (suddenChangeRatio > 0.3) {
      return 0.3; // Too many sudden changes, might be artificial
    }
    
    return 0.9; // Good temporal consistency
  };

  const detectPeriodicPattern = (values: number[]): boolean => {
    if (values.length < 10) return false;
    
    // Simple autocorrelation to detect repeating patterns
    const maxLag = Math.min(10, Math.floor(values.length / 2));
    
    for (let lag = 2; lag <= maxLag; lag++) {
      let correlation = 0;
      let count = 0;
      
      for (let i = 0; i < values.length - lag; i++) {
        correlation += values[i] * values[i + lag];
        count++;
      }
      
      correlation /= count;
      
      // Normalize correlation
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      
      if (variance > 0) {
        const normalizedCorrelation = correlation / variance;
        
        // If correlation is high, we might have a periodic pattern
        if (normalizedCorrelation > 0.7) {
          return true;
        }
      }
    }
    
    return false;
  };

  return null; // This component doesn't render anything visible
};
