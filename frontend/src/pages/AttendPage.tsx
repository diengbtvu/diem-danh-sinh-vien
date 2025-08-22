import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  AppBar, Toolbar, Typography, Container, Grid, Paper, Button, Alert, Stack, Card, CardContent,
  Box, Fade, Chip, LinearProgress, IconButton, Tooltip
} from '@mui/material'
import {
  CameraAlt, CheckCircle, QrCodeScanner, Person,
  Refresh, Info, Warning, Error as ErrorIcon
} from '@mui/icons-material'
import LoadingButton from '../components/LoadingButton'
import StepIndicator from '../components/StepIndicator'
import { AdvancedCamera } from '../components/advanced/AdvancedCamera'
import useWebSocket from '../hooks/useWebSocket'

function useQuery() { return new URLSearchParams(window.location.search) }

function parseSessionIdFromSessionToken(token: string): string | null {
  // Format: SESSION-{sessionId}.{issuedAt}.{sig}
  const dash = token.indexOf('-')
  const dot = token.indexOf('.', dash + 1)
  if (dash < 0 || dot < 0) return null
  return token.substring(dash + 1, dot)
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return await res.blob()
}

export default function AttendPage() {
  const query = useQuery()
  const sessionToken = query.get('session') || ''
  const [rotatingToken, setRotatingToken] = useState<string>('')

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [scanningProgress, setScanningProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [wsConnected, setWsConnected] = useState(false)

  // WebSocket connection for real-time QR B updates
  const { connected: wsConnectionStatus, subscribe, unsubscribe } = useWebSocket({
    onConnect: () => {
      console.log('[AttendPage] WebSocket connected')
      setWsConnected(true)
    },
    onDisconnect: () => {
      console.log('[AttendPage] WebSocket disconnected')
      setWsConnected(false)
    },
    onError: (error) => {
      console.error('[AttendPage] WebSocket error:', error)
      setWsConnected(false)
    }
  })

  // Define steps for the attendance process
  const steps = [
    {
      label: 'Quét QR A',
      description: 'Quét mã QR A từ màn hình lớp học',
      status: sessionToken ? 'completed' : 'active'
    },
    {
      label: 'Bật camera',
      description: 'Cho phép truy cập camera để chụp ảnh',
      status: !sessionToken ? 'pending' : cameraReady ? 'completed' : 'active'
    },
    {
      label: 'Quét QR B',
      description: 'Hướng camera vào QR B để tự động quét',
      status: !cameraReady ? 'pending' : rotatingToken ? 'completed' : 'active'
    },
    {
      label: 'Chụp ảnh',
      description: 'Chụp ảnh khuôn mặt để xác thực',
      status: !rotatingToken ? 'pending' : previewUrl ? 'completed' : 'active'
    },
    {
      label: 'Hoàn thành',
      description: 'Gửi thông tin điểm danh',
      status: !previewUrl ? 'pending' : result ? 'completed' : 'active'
    }
  ] as const

  useEffect(() => {
    console.log('AttendPage useEffect triggered, sessionToken:', sessionToken)
    if (!sessionToken) {
      setError('Thiếu token phiên (QR A). Hãy quét QR A trên màn hình lớp học.')
      setCurrentStep(0)
    } else {
      setCurrentStep(1)
      const sid = parseSessionIdFromSessionToken(sessionToken)
      console.log('Parsed session ID:', sid)
      if (sid) {
        console.log('Calling activate-qr2 API for session:', sid)
        fetch(`/api/sessions/${encodeURIComponent(sid)}/activate-qr2`, { method: 'POST' })
          .then(response => {
            console.log('activate-qr2 response status:', response.status)
            if (response.status === 410) {
              setError('Phiên điểm danh đã hết hạn. Vui lòng quét lại QR A mới từ giảng viên.')
              return null
            }
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`)
            }
            return response.json()
          })
          .then(data => {
            if (data) {
              console.log('activate-qr2 response data:', data)
            }
          })
          .catch(error => {
            console.error('activate-qr2 error:', error)
            if (error.message.includes('Session has expired')) {
              setError('Phiên điểm danh đã hết hạn. Vui lòng quét lại QR A mới từ giảng viên.')
            }
          })
      }
    }
  }, [sessionToken])

  // WebSocket subscription for real-time QR B updates
  useEffect(() => {
    if (!sessionToken || rotatingToken || !wsConnectionStatus) return

    const sessionId = parseSessionIdFromSessionToken(sessionToken)
    if (!sessionId) return

    const topic = `/topic/session/${sessionId}`
    console.log(`[AttendPage] Subscribing to ${topic} for QR B updates`)

    const subscription = subscribe(topic, (message) => {
      console.log('[AttendPage] WebSocket message received:', message)
      
      if (message.type === 'QR_B_ACTIVATED' && message.data) {
        const { qr2Active, rotatingToken: newRotatingToken } = message.data
        
        if (qr2Active && newRotatingToken && !rotatingToken) {
          console.log('[AttendPage] QR B activated via WebSocket, setting token:', newRotatingToken)
          setRotatingToken(newRotatingToken)
          setCurrentStep(3)
          setError(null) // Clear any previous errors
        }
      }
    })

    return () => {
      if (subscription) {
        console.log(`[AttendPage] Unsubscribing from ${topic}`)
        unsubscribe(topic)
      }
    }
  }, [sessionToken, rotatingToken, wsConnectionStatus, subscribe, unsubscribe])

  // Fallback polling for cases where WebSocket fails (reduced frequency)
  useEffect(() => {
    if (!sessionToken || rotatingToken || wsConnected) return

    const sessionId = parseSessionIdFromSessionToken(sessionToken)
    if (!sessionId) return

    console.log('[AttendPage] WebSocket not connected, using fallback polling')
    let isActive = true
    let pollCount = 0
    const maxPollCount = 150 // Reduced: Stop after 5 minutes (150 * 2s)
    
    const pollQRStatus = async () => {
      try {
        pollCount++
        if (pollCount > maxPollCount) {
          console.log('Fallback polling timeout after 5 minutes')
          setError('Không thể kết nối real-time. Vui lòng tải lại trang.')
          return
        }

        const response = await fetch(`/api/sessions/${sessionId}/status`)
        if (!response.ok) {
          if (response.status === 404 || response.status === 400) {
            console.log('Session not found, stopping fallback polling')
            return
          }
          if (response.status === 410) {
            console.log('Session has expired, stopping fallback polling')
            setError('Phiên điểm danh đã hết hạn. Vui lòng quét lại QR A mới từ giảng viên.')
            return
          }
          return
        }
        
        const data = await response.json()
        if (isActive && data.qr2Active && data.rotatingToken && !rotatingToken) {
          console.log('QR B is now active from fallback polling, setting token:', data.rotatingToken)
          setRotatingToken(data.rotatingToken)
          setCurrentStep(3)
        }
      } catch (error) {
        console.error('Error in fallback polling:', error)
      }
    }

    // Start fallback polling after 3 seconds to give WebSocket time to connect
    const timeout = setTimeout(() => {
      if (!wsConnected && isActive) {
        pollQRStatus()
        const interval = setInterval(pollQRStatus, 5000) // Poll every 5 seconds instead of 2
        
        // Store interval in a ref or something to clean up
        const cleanup = () => {
          clearInterval(interval)
        }
        
        // Return cleanup function
        return cleanup
      }
    }, 3000)

    return () => {
      isActive = false
      clearTimeout(timeout)
    }
  }, [sessionToken, rotatingToken, wsConnected])

  useEffect(() => {
    if (cameraReady && !rotatingToken) {
      setCurrentStep(2)
    } else if (rotatingToken && !previewUrl) {
      setCurrentStep(3)
    } else if (previewUrl && !result) {
      setCurrentStep(4)
    }
  }, [cameraReady, rotatingToken, previewUrl, result])

  const handleCameraReady = useCallback((ready: boolean) => {
    setCameraReady(ready)
    if (ready) {
      setCurrentStep(2)
    }
  }, [])

  const handleCapture = useCallback((result: any) => {
    // AdvancedCamera returns CaptureResult object
    setPreviewUrl(result.imageDataUrl)
    setCurrentStep(4)
    console.log('Advanced capture result:', {
      faceDetected: result.faceDetected,
      qualityScore: result.qualityScore,
      livenessScore: result.livenessScore
    })
  }, [])

  const handleQRDetected = useCallback((qrData: string) => {
    console.log('QR detected:', qrData)
    setRotatingToken(qrData)
    setCurrentStep(3)
  }, [])

  // Validate QR B with backend
  const validateQRB = useCallback(async (qrData: string) => {
    if (!sessionToken) return false

    const sessionId = parseSessionIdFromSessionToken(sessionToken)
    if (!sessionId) return false

    try {
      const response = await fetch(`/api/sessions/${sessionId}/validate-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rotatingToken: qrData })
      })

      return response.ok
    } catch (error) {
      console.error('Error validating QR B:', error)
      return false
    }
  }, [sessionToken])

  // Handle QR detection and validation
  const handleValidatedQR = useCallback(async (qrData: string) => {
    // Debounce: if already have rotatingToken, ignore further scans
    if (rotatingToken) return
    const isValid = await validateQRB(qrData)
    if (isValid) {
      handleQRDetected(qrData)
    } else {
      setError('QR B không hợp lệ hoặc đã hết hạn')
    }
  }, [validateQRB, handleQRDetected, rotatingToken])

  const submit = useCallback(async () => {
    if (!previewUrl) return
    if (!sessionToken || !rotatingToken) {
      setError('Chưa quét được QR B. Vui lòng hướng camera vào QR B trên màn hình lớp.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const blob = await dataUrlToBlob(previewUrl)
      const form = new FormData()
      form.append('sessionToken', sessionToken)
      form.append('rotatingToken', rotatingToken)
      form.append('image', blob, 'capture.jpg')
      const res = await fetch('/api/attendances', {
        method: 'POST',
        body: form,
      })
      if (!res.ok) throw new Error('Gửi điểm danh thất bại')
      const json = await res.json()
      setResult(json)
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }, [previewUrl, sessionToken, rotatingToken])

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#1976d2', borderRadius: 0, boxShadow: 'none', border: 'none' }}>
        <Toolbar>
          <QrCodeScanner sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Điểm danh sinh viên
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip
              label={sessionToken ? 'Đã kết nối' : 'Chưa kết nối'}
              color={sessionToken ? 'success' : 'warning'}
              size="small"
              sx={{ color: 'white', fontWeight: 500 }}
            />
            <Chip
              label={wsConnected ? 'Real-time' : 'Polling'}
              color={wsConnected ? 'success' : 'info'}
              size="small"
              sx={{ color: 'white', fontWeight: 500 }}
            />
          </Stack>
        </Toolbar>
      </AppBar>



      <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <Container sx={{ py: 4 }}>
          <Grid container spacing={3}>
            {/* Main Camera Section */}
            <Grid item xs={12} lg={8}>
              <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <CameraAlt sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Camera điểm danh
                  </Typography>
                </Box>

                {error && (
                  <Fade in={!!error}>
                    <Alert
                      severity="error"
                      sx={{ mb: 3 }}
                      icon={<ErrorIcon />}
                      action={
                        <IconButton size="small" onClick={() => setError(null)}>
                          <Refresh />
                        </IconButton>
                      }
                    >
                      {error}
                    </Alert>
                  </Fade>
                )}

                <AdvancedCamera
                  onCapture={handleCapture}
                  onCameraReady={handleCameraReady}
                  onQRDetected={handleValidatedQR}
                  enableQRScanning={!!(cameraReady && !rotatingToken)}
                  enableFaceDetection={true}
                  enableQualityAssessment={true}
                  enableLivenessCheck={false}
                  autoCapture={false}
                  qualityThreshold={0.7}
                  disabled={submitting}
                />

                {/* QR B Status */}
                {cameraReady && !rotatingToken && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      {wsConnected 
                        ? 'Đang chờ giảng viên kích hoạt QR B (Real-time)...' 
                        : 'Đang kiểm tra QR B từ giảng viên...'
                      }
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {wsConnected 
                        ? 'Hệ thống sẽ tự động nhận QR B ngay khi giảng viên kích hoạt'
                        : 'Khi QR B xuất hiện, hệ thống sẽ tự động nhận diện hoặc bạn có thể hướng camera vào QR để quét'
                      }
                    </Typography>
                  </Alert>
                )}

                {rotatingToken && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Đã nhận QR B thành công! Bây giờ hãy chụp ảnh khuôn mặt để hoàn tất điểm danh.
                    </Typography>
                  </Alert>
                )}

                {previewUrl && (
                  <Box sx={{ mt: 2 }}>
                    <LoadingButton
                      color="success"
                      variant="contained"
                      size="large"
                      onClick={submit}
                      loading={submitting}
                      startIcon={<CheckCircle />}
                      fullWidth
                    >
                      Gửi điểm danh
                    </LoadingButton>
                  </Box>
                )}
              </Paper>
            </Grid>
            {/* Sidebar */}
            <Grid item xs={12} lg={4}>
              <Stack spacing={3}>
                {/* Progress Steps */}
                <Paper elevation={3} sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Info sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Tiến trình điểm danh
                    </Typography>
                  </Box>
                  <StepIndicator steps={steps} />
                </Paper>

                {/* QR Status */}
                {sessionToken && (
                  <Fade in={!!sessionToken}>
                    <Paper elevation={3} sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <QrCodeScanner sx={{ mr: 2, color: rotatingToken ? 'success.main' : 'warning.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Trạng thái QR
                        </Typography>
                      </Box>
                      <Alert
                        severity={rotatingToken ? 'success' : 'info'}
                        icon={rotatingToken ? <CheckCircle /> : <QrCodeScanner />}
                      >
                        {rotatingToken ? 'Đã quét QR B thành công!' : 'Đang chờ quét QR B...'}
                      </Alert>
                    </Paper>
                  </Fade>
                )}

                {/* Image Preview */}
                {previewUrl && (
                  <Fade in={!!previewUrl}>
                    <Paper elevation={3} sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CameraAlt sx={{ mr: 2, color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Ảnh xem trước
                        </Typography>
                      </Box>
                      <Box sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        border: '2px solid',
                        borderColor: 'primary.light'
                      }}>
                        <img
                          src={previewUrl}
                          alt="Preview"
                          style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block'
                          }}
                        />
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setPreviewUrl(null)}
                        sx={{ mt: 2, width: '100%' }}
                      >
                        Chụp lại
                      </Button>
                    </Paper>
                  </Fade>
                )}

                {/* Result */}
                {result && (
                  <Fade in={!!result}>
                    <Paper elevation={3} sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CheckCircle sx={{ mr: 2, color: 'success.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Kết quả điểm danh
                        </Typography>
                      </Box>
                      <Alert
                        severity={
                          result.status === 'ACCEPTED' ? 'success' :
                          result.status === 'REVIEW' ? 'warning' : 'error'
                        }
                        sx={{ mb: 2 }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {result.status === 'ACCEPTED' ? 'Điểm danh thành công! Đã lưu vào hệ thống.' :
                           result.status === 'REVIEW' ? 'Cần xem xét thêm - Đã lưu để giáo viên duyệt' :
                           'Điểm danh thất bại - Đã ghi nhận để xem xét'}
                        </Typography>
                      </Alert>
                      <Stack spacing={1}>
                        {result.mssv && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">MSSV:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{result.mssv}</Typography>
                          </Box>
                        )}
                        {result.hoTen && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Họ tên:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{result.hoTen}</Typography>
                          </Box>
                        )}
                        {result.confidence != null && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Độ tin cậy:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {(result.confidence * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Paper>
                  </Fade>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  )
}
