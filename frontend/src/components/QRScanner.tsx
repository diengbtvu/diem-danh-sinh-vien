import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Box, Alert, Typography, LinearProgress } from '@mui/material'
import jsQR from 'jsqr'

interface QRScannerProps {
  videoRef: React.RefObject<HTMLVideoElement>
  isActive: boolean
  onQRDetected: (qrData: string) => void
  onError?: (error: string) => void
}

export default function QRScanner({ videoRef, isActive, onQRDetected, onError }: QRScannerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const scanningRef = useRef(false)

  const scanFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (!video || !canvas || !isActive || !scanningRef.current) {
      return
    }

    const { videoWidth, videoHeight } = video
    if (videoWidth === 0 || videoHeight === 0) {
      requestAnimationFrame(scanFrame)
      return
    }

    canvas.width = videoWidth
    canvas.height = videoHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      requestAnimationFrame(scanFrame)
      return
    }

    try {
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight)
      const imageData = ctx.getImageData(0, 0, videoWidth, videoHeight)
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      
      if (code?.data) {
        console.log('[QRScanner] Detected QR:', code.data)
        
        // Check if it's a valid QR B (STEP- format)
        if (code.data.startsWith('STEP-')) {
          setProgress(100)
          onQRDetected(code.data)
          return // Stop scanning
        } else {
          console.log('[QRScanner] Invalid QR format, expected STEP-*')
        }
      }
      
      // Continue scanning
      requestAnimationFrame(scanFrame)
    } catch (error) {
      console.error('[QRScanner] Scan error:', error)
      onError?.('Lỗi quét QR code')
      requestAnimationFrame(scanFrame)
    }
  }, [videoRef, isActive, onQRDetected, onError])

  useEffect(() => {
    if (isActive && videoRef.current) {
      console.log('[QRScanner] Starting QR scan')
      setScanning(true)
      setProgress(0)
      scanningRef.current = true
      
      // Progress simulation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev
          return prev + 1
        })
      }, 100)

      // Start scanning
      scanFrame()

      return () => {
        console.log('[QRScanner] Stopping QR scan')
        scanningRef.current = false
        setScanning(false)
        setProgress(0)
        clearInterval(progressInterval)
      }
    } else {
      scanningRef.current = false
      setScanning(false)
      setProgress(0)
    }
  }, [isActive, scanFrame])

  if (!isActive) return null

  return (
    <Box>
      {/* QR Scanning Overlay */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.3)',
        zIndex: 1
      }}>
        <Box sx={{
          width: 200,
          height: 200,
          border: '3px solid #10b981',
          borderRadius: 2,
          position: 'relative',
          '&::before, &::after': {
            content: '""',
            position: 'absolute',
            width: 20,
            height: 20,
            border: '3px solid #10b981'
          },
          '&::before': {
            top: -3,
            left: -3,
            borderRight: 'none',
            borderBottom: 'none'
          },
          '&::after': {
            bottom: -3,
            right: -3,
            borderLeft: 'none',
            borderTop: 'none'
          }
        }}>
          <Typography
            variant="body2"
            sx={{
              position: 'absolute',
              bottom: -40,
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'white',
              fontWeight: 500,
              textAlign: 'center',
              whiteSpace: 'nowrap'
            }}
          >
            Hướng camera vào QR B
          </Typography>
        </Box>
      </Box>

      {/* Scanning Progress */}
      {scanning && progress > 0 && (
        <Box sx={{ 
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          zIndex: 2
        }}>
          <Alert severity="info" sx={{ mb: 1 }}>
            <Typography variant="body2">
              Đang quét QR B... {Math.round(progress)}%
            </Typography>
          </Alert>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ borderRadius: 1, height: 6 }}
          />
        </Box>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Box>
  )
}
