import React, { useEffect, useRef } from 'react';

interface QualityAssessmentProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onQualityScore: (score: number) => void;
}

export const QualityAssessment: React.FC<QualityAssessmentProps> = ({
  videoRef,
  onQualityScore
}) => {
  const assessmentIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    const assessQuality = () => {
      if (video.readyState !== 4) return; // HAVE_ENOUGH_DATA

      try {
        // Create a temporary canvas to analyze the video frame
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get image data for analysis
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Calculate quality metrics
        const quality = calculateImageQuality(imageData);
        
        onQualityScore(quality);
      } catch (error) {
        console.error('Quality assessment error:', error);
      }
    };

    // Start quality assessment interval
    assessmentIntervalRef.current = setInterval(assessQuality, 1000); // 1 FPS - reduced to prevent jitter

    return () => {
      if (assessmentIntervalRef.current) {
        clearInterval(assessmentIntervalRef.current);
      }
    };
  }, [videoRef, onQualityScore]);

  const calculateImageQuality = (imageData: ImageData): number => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Calculate various quality metrics
    const sharpness = calculateSharpness(data, width, height);
    const brightness = calculateBrightness(data);
    const contrast = calculateContrast(data);
    const noise = calculateNoise(data, width, height);
    
    // Weighted quality score
    const qualityScore = (
      sharpness * 0.4 +
      brightness * 0.2 +
      contrast * 0.3 +
      (1 - noise) * 0.1
    );
    
    return Math.max(0, Math.min(1, qualityScore));
  };

  const calculateSharpness = (data: Uint8ClampedArray, width: number, height: number): number => {
    // Sobel edge detection for sharpness
    let sharpnessSum = 0;
    let pixelCount = 0;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Convert to grayscale
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        // Sobel X kernel
        const sobelX = 
          -1 * getGrayValue(data, x - 1, y - 1, width) +
           1 * getGrayValue(data, x + 1, y - 1, width) +
          -2 * getGrayValue(data, x - 1, y, width) +
           2 * getGrayValue(data, x + 1, y, width) +
          -1 * getGrayValue(data, x - 1, y + 1, width) +
           1 * getGrayValue(data, x + 1, y + 1, width);
        
        // Sobel Y kernel
        const sobelY = 
          -1 * getGrayValue(data, x - 1, y - 1, width) +
          -2 * getGrayValue(data, x, y - 1, width) +
          -1 * getGrayValue(data, x + 1, y - 1, width) +
           1 * getGrayValue(data, x - 1, y + 1, width) +
           2 * getGrayValue(data, x, y + 1, width) +
           1 * getGrayValue(data, x + 1, y + 1, width);
        
        const magnitude = Math.sqrt(sobelX * sobelX + sobelY * sobelY);
        sharpnessSum += magnitude;
        pixelCount++;
      }
    }
    
    const averageSharpness = sharpnessSum / pixelCount;
    return Math.min(1, averageSharpness / 100); // Normalize
  };

  const getGrayValue = (data: Uint8ClampedArray, x: number, y: number, width: number): number => {
    const idx = (y * width + x) * 4;
    return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
  };

  const calculateBrightness = (data: Uint8ClampedArray): number => {
    let brightnessSum = 0;
    const pixelCount = data.length / 4;
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      brightnessSum += brightness;
    }
    
    const averageBrightness = brightnessSum / pixelCount;
    
    // Optimal brightness is around 128 (middle gray)
    const deviation = Math.abs(averageBrightness - 128) / 128;
    return 1 - deviation;
  };

  const calculateContrast = (data: Uint8ClampedArray): number => {
    const pixelCount = data.length / 4;
    let brightnessSum = 0;
    const brightnesses: number[] = [];
    
    // Calculate all brightness values
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      brightnesses.push(brightness);
      brightnessSum += brightness;
    }
    
    const averageBrightness = brightnessSum / pixelCount;
    
    // Calculate standard deviation (contrast)
    let varianceSum = 0;
    for (const brightness of brightnesses) {
      varianceSum += Math.pow(brightness - averageBrightness, 2);
    }
    
    const standardDeviation = Math.sqrt(varianceSum / pixelCount);
    
    // Normalize contrast (good contrast is around 40-60)
    return Math.min(1, standardDeviation / 60);
  };

  const calculateNoise = (data: Uint8ClampedArray, width: number, height: number): number => {
    // Simple noise estimation using local variance
    let noiseSum = 0;
    let regionCount = 0;
    
    const regionSize = 8;
    
    for (let y = 0; y < height - regionSize; y += regionSize) {
      for (let x = 0; x < width - regionSize; x += regionSize) {
        const regionVariance = calculateRegionVariance(data, x, y, regionSize, width);
        noiseSum += regionVariance;
        regionCount++;
      }
    }
    
    const averageNoise = noiseSum / regionCount;
    return Math.min(1, averageNoise / 1000); // Normalize
  };

  const calculateRegionVariance = (
    data: Uint8ClampedArray,
    startX: number,
    startY: number,
    size: number,
    width: number
  ): number => {
    let sum = 0;
    let count = 0;
    const values: number[] = [];
    
    for (let y = startY; y < startY + size; y++) {
      for (let x = startX; x < startX + size; x++) {
        const idx = (y * width + x) * 4;
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        values.push(gray);
        sum += gray;
        count++;
      }
    }
    
    const mean = sum / count;
    let varianceSum = 0;
    
    for (const value of values) {
      varianceSum += Math.pow(value - mean, 2);
    }
    
    return varianceSum / count;
  };

  return null; // This component doesn't render anything visible
};
