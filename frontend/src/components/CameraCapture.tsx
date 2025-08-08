import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Box, Button, Alert, Typography, Stack, IconButton, Tooltip } from '@mui/material'
import { CameraAlt, Cameraswitch, Person } from '@mui/icons-material'
import LoadingButton from './LoadingButton'
import QRScanner from './QRScanner'

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void
  onCameraReady?: (ready: boolean) => void
  onQRDetected?: (qrData: string) => void
  enableQRScanning?: boolean
  disabled?: boolean
}

export default function CameraCapture({ onCapture, onCameraReady, onQRDetected, enableQRScanning = false, disabled }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facing, setFacing] = useState<'user' | 'environment'>('environment')
  const [isStarting, setIsStarting] = useState(false)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log('Stopped track:', track.kind, track.label)
      })
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsReady(false)
    onCameraReady?.(false)
  }, [onCameraReady])

  const startCamera = useCallback(async (facingMode: 'user' | 'environment') => {
    setIsStarting(true)
    setError(null)
    
    try {
      // Stop any existing stream
      stopCamera()
      
      console.log('Requesting camera access with facingMode:', facingMode)
      
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('Got media stream:', stream)
      console.log('Video tracks:', stream.getVideoTracks())
      
      streamRef.current = stream
      
      if (videoRef.current) {
        const video = videoRef.current
        video.setAttribute('playsinline', '')
        video.muted = true
        video.autoplay = true
        video.srcObject = stream

        return new Promise<void>((resolve, reject) => {
          const cleanup = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata)
            video.removeEventListener('canplay', onCanPlay)
            video.removeEventListener('playing', onPlaying)
            video.removeEventListener('resize', onResize)
            video.removeEventListener('error', onError)
          }

          const markReady = (from: string) => {
            console.log(`[Camera] Ready via ${from}. Dimensions:`, video.videoWidth, 'x', video.videoHeight, 'readyState:', video.readyState)
            setIsReady(true)
            setFacing(facingMode)
            onCameraReady?.(true)
            setIsStarting(false)
            cleanup()
            resolve()
          }

          const onLoadedMetadata = () => {
            console.log('[Camera] loadedmetadata')
            video.play().then(() => markReady('loadedmetadata/play')).catch(err => {
              console.warn('[Camera] play() after loadedmetadata failed:', err)
            })
          }
          const onCanPlay = () => {
            console.log('[Camera] canplay')
            if (!isReady) markReady('canplay')
          }
          const onPlaying = () => {
            console.log('[Camera] playing')
            if (!isReady) markReady('playing')
          }
          const onResize = () => {
            console.log('[Camera] resize ->', video.videoWidth, video.videoHeight)
          }
          const onError = (e: Event) => {
            console.error('[Camera] video error:', e)
            cleanup()
            setIsStarting(false)
            reject(new Error('Video failed to load'))
          }

          video.addEventListener('loadedmetadata', onLoadedMetadata)
          video.addEventListener('canplay', onCanPlay)
          video.addEventListener('playing', onPlaying)
          video.addEventListener('resize', onResize)
          video.addEventListener('error', onError)

          video.play().then(() => {
            if (!isReady) markReady('immediate play')
          }).catch(err => {
            console.warn('[Camera] initial play() failed:', err)
          })

          setTimeout(() => {
            if (!isReady && video.videoWidth > 0 && video.videoHeight > 0) {
              markReady('timeout+dimensions')
            } else if (!isReady) {
              console.warn('[Camera] timeout without dimensions - still waiting events')
            }
          }, 1500)
        })
      }
    } catch (err) {
      console.error('Camera error:', err)
      
      // Fallback to user camera if environment fails
      if (facingMode === 'environment') {
        try {
          console.log('Fallback to user camera')
          const fallbackConstraints: MediaStreamConstraints = {
            video: {
              facingMode: 'user',
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 }
            },
            audio: false
          }
          
          const fallbackStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints)
          streamRef.current = fallbackStream
          
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream
            await videoRef.current.play()
            setIsReady(true)
            setFacing('user')
            onCameraReady?.(true)
            setIsStarting(false)
            return
          }
        } catch (fallbackErr) {
          console.error('Fallback camera error:', fallbackErr)
        }
      }
      
      setError('Không thể truy cập camera. Vui lòng cho phép quyền camera.')
      setIsReady(false)
      onCameraReady?.(false)
      setIsStarting(false)
    }
  }, [stopCamera, onCameraReady, isReady])

  const captureImage = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (!video || !canvas || !isReady) {
      console.error('Video or canvas not ready')
      return
    }

    const { videoWidth, videoHeight } = video
    if (videoWidth === 0 || videoHeight === 0) {
      console.error('Video dimensions are 0')
      return
    }

    canvas.width = videoWidth
    canvas.height = videoHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('Cannot get canvas context')
      return
    }

    ctx.drawImage(video, 0, 0, videoWidth, videoHeight)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    
    console.log('Captured image:', dataUrl.substring(0, 50) + '...')
    onCapture(dataUrl)
  }, [isReady, onCapture])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{
        position: 'relative',
        borderRadius: 2,
        overflow: 'hidden',
        mb: 2,
        backgroundColor: '#000',
        minHeight: 300
      }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={() => console.log('[Camera] <video> loadedmetadata')}
          onCanPlay={() => console.log('[Camera] <video> canplay')}
          onPlay={() => console.log('[Camera] <video> play event')}
          onError={(e) => console.error('[Camera] <video> error', e)}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            minHeight: 300,
            objectFit: 'cover'
          }}
        />

        {!isReady && (
          <Box sx={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', color: 'white',
            background: 'rgba(0,0,0,0.4)', p: 2, textAlign: 'center'
          }}>
            <CameraAlt sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
              Bật camera để bắt đầu
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, maxWidth: 420 }}>
              Cho phép truy cập camera để chụp ảnh điểm danh.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <LoadingButton
                variant="contained"
                size="large"
                startIcon={<CameraAlt />}
                onClick={() => startCamera('environment')}
                loading={isStarting}
              >
                Bật camera sau
              </LoadingButton>
              <LoadingButton
                variant="outlined"
                size="large"
                startIcon={<Person />}
                onClick={() => startCamera('user')}
                loading={isStarting}
              >
                Bật camera trước
              </LoadingButton>
            </Stack>
          </Box>
        )}

        {/* QR Scanner Overlay */}
        {enableQRScanning && isReady && (
          <QRScanner
            videoRef={videoRef}
            isActive={enableQRScanning}
            onQRDetected={onQRDetected || (() => {})}
          />
        )}
      </Box>

      {isReady && (
        <Stack direction="row" spacing={2} alignItems="center">
          <Tooltip title={`Đổi sang camera ${facing === 'environment' ? 'trước' : 'sau'}`}>
            <IconButton
              onClick={() => startCamera(facing === 'environment' ? 'user' : 'environment')}
              disabled={disabled}
              sx={{
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider'
              }}
            >
              <Cameraswitch />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            size="large"
            startIcon={<CameraAlt />}
            onClick={captureImage}
            disabled={disabled || !isReady}
            sx={{ flex: 1 }}
          >
            Chụp ảnh
          </Button>
        </Stack>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Box>
  )
}
