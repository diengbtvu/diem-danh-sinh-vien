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
  const [submitted, setSubmitted] = useState(false)


  // Define steps for the attendance process
  const steps: Array<{label: string; description: string; status: 'completed' | 'active' | 'pending'}> = [
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
  ]

  useEffect(() => {

    if (!sessionToken) {
      setError('Thiếu token phiên (QR A). Hãy quét QR A trên màn hình lớp học.')
      setCurrentStep(0)
    } else {
      setCurrentStep(1)
      const sid = parseSessionIdFromSessionToken(sessionToken)
  
      if (sid) {
        // First check if QR A access is allowed

        fetch(`/api/sessions/${encodeURIComponent(sid)}/qr-a-access`)
          .then(response => {
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
            if (data && !data.accessAllowed) {
              setError(data.message || 'QR A đã được sử dụng. Hãy quét QR khác từ giảng viên.')
              return
            }
            
            // If access is allowed, proceed with QR2 activation
            
            return fetch(`/api/sessions/${encodeURIComponent(sid)}/activate-qr2`, { method: 'POST' })
          })
          .then(response => {
            if (!response) return null // Already handled above

            if (response.status === 410) {
              setError('Phiên điểm danh đã hết hạn. Vui lòng quét lại QR A mới từ giảng viên.')
              return null
            }
            if (!response.ok) {
              if (response.status === 400) {
                // Handle the specific case where QR A was already used
                response.text().then(errorText => {
                  if (errorText.includes('QR A đã được sử dụng')) {
                    setError('QR A đã được sử dụng. Hãy quét QR khác từ giảng viên.')
                  } else {
                    setError('Lỗi khi kích hoạt QR B. Vui lòng thử lại.')
                  }
                }).catch(() => {
                  setError('QR A đã được sử dụng. Hãy quét QR khác từ giảng viên.')
                })
                return null
              }
              throw new Error(`HTTP ${response.status}`)
            }
            return response.json()
          })
          .then(data => {
            if (data) {
  
            }
          })
          .catch(error => {

            if (error.message.includes('Session has expired')) {
              setError('Phiên điểm danh đã hết hạn. Vui lòng quét lại QR A mới từ giảng viên.')
            } else if (error.message.includes('QR A đã được sử dụng')) {
              setError('QR A đã được sử dụng. Hãy quét QR khác từ giảng viên.')
            }
          })
      }
    }
  }, [sessionToken])

  // Polling mechanism to check QR B status from server
  useEffect(() => {
    if (!sessionToken || rotatingToken) return

    const sessionId = parseSessionIdFromSessionToken(sessionToken)
    if (!sessionId) return

    let isActive = true
    let pollCount = 0
    const maxPollCount = 300 // Stop after 10 minutes (300 * 2s)
    
    const pollQRStatus = async () => {
      try {
        pollCount++
        if (pollCount > maxPollCount) {
  
          return
        }

        const response = await fetch(`/api/sessions/${sessionId}/status`)
        if (!response.ok) {
          if (response.status === 404 || response.status === 400) {
  
            return
          }
          if (response.status === 410) {

            setError('Phiên điểm danh đã hết hạn. Vui lòng quét lại QR A mới từ giảng viên.')
            return
          }
          return
        }
        
        const data = await response.json()
        // DO NOT automatically set rotatingToken - student must manually scan QR B
        if (isActive && data.qr2Active && !rotatingToken) {

          // QR B is active but we don't auto-populate the token - user must scan manually
        }
      } catch (error) {

        // Continue polling despite errors
      }
    }

    // Poll immediately and then every 2 seconds
    pollQRStatus()
    const interval = setInterval(pollQRStatus, 2000)

    return () => {
      isActive = false
      clearInterval(interval)
    }
  }, [sessionToken, rotatingToken])

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
      
      // Step 1: Call Face API directly from frontend

      let faceResult = null
      
      try {

        const faceApiResponse = await fetch('/api/face-proxy/predict', {
          method: 'POST',
          body: (() => {
            const formData = new FormData()
            formData.append('image', blob, 'capture.jpg')
            return formData
          })()
        })

        
        if (faceApiResponse.ok) {
          faceResult = await faceApiResponse.json()
          
          // Update debug info based on the result
          if (faceResult.success) {
            if (faceResult.total_faces > 0 && faceResult.detections?.length > 0) {
              const detection = faceResult.detections[0]
  
            } else {
  
            }
          } else {

          }
        } else {
          const errorText = await faceApiResponse.text()

        }
      } catch (faceApiError) {

        // Don't throw here - continue with submission even if Face API fails
      }
      
      // Step 2: Send attendance data with face recognition result to backend
      const form = new FormData()
      form.append('sessionToken', sessionToken)
      form.append('rotatingToken', rotatingToken)
      form.append('image', blob, 'capture.jpg')
      
      // Include face recognition result if available
      if (faceResult) {
        form.append('faceApiResult', JSON.stringify(faceResult))
      }
      
      const res = await fetch('/api/attendances', {
        method: 'POST',
        body: form,
      })
      if (!res.ok) throw new Error('Gửi điểm danh thất bại')
      const json = await res.json()
      setResult(json)
      setSubmitted(true) // Mark as submitted to prevent camera restart
      
      // Check for duplicate attendance first
      if (json.isDuplicate === true) {
                        alert(`${json.message || 'Bạn đã điểm danh rồi'}\nMSSV: ${json.mssv || 'Không xác định'}\nTên: ${json.hoTen || 'Không rõ'}\nThời gian điểm danh: ${json.capturedAt ? new Date(json.capturedAt).toLocaleString('vi-VN') : 'Không rõ'}`)
        return // Exit early for duplicate case
      }
      
      // Show alert based on face recognition result for new submissions

      
      if (faceResult && faceResult.success && faceResult.total_faces > 0 && faceResult.detections?.length > 0) {
        const detection = faceResult.detections[0]
        const mssv = detection.class?.split('_')[0] // Extract MSSV from "110122050_TranMinhDien"
        const name = detection.class?.split('_')[1] || 'Không rõ'
        
        alert(`Đã nhận dạng được sinh viên!\nMSSV: ${mssv}\nTên: ${name}\nĐộ tin cậy: ${(detection.confidence * 100).toFixed(1)}%`)
      } else if (faceResult && faceResult.success === true && faceResult.total_faces === 0) {
        alert('Không nhận dạng được khuôn mặt!\nHệ thống đã lưu ảnh để giáo viên xem xét.')
      } else if (faceResult && faceResult.success === false) {
        alert(`Lỗi từ hệ thống nhận dạng khuôn mặt!\nLỗi: ${faceResult.error || 'Không rõ'}\nĐiểm danh đã được lưu để giáo viên xem xét.`)
      } else {

                        alert('Không thể kết nối đến hệ thống nhận dạng khuôn mặt!\nĐiểm danh đã được lưu để giáo viên xem xét.')
      }
      
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra')
      alert('Lỗi khi gửi điểm danh: ' + (e.message || 'Có lỗi xảy ra'))
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
          <Chip
            label={sessionToken ? 'Đã kết nối' : 'Chưa kết nối'}
            color={sessionToken ? 'success' : 'warning'}
            size="small"
            sx={{ color: 'white', fontWeight: 500 }}
          />
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

                {!submitted && (
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
                )}
                
                {submitted && (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 4,
                    borderRadius: 2,
                    backgroundColor: 'success.light',
                    color: 'success.contrastText'
                  }}>
                    <CheckCircle sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6">Đã hoàn thành điểm danh!</Typography>
                    <Typography variant="body2">Cảm ơn bạn đã sử dụng hệ thống.</Typography>
                  </Box>
                )}

                {/* QR B Status */}
                {!submitted && cameraReady && !rotatingToken && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Đang tự động kiểm tra QR B từ giảng viên...
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Khi QR B xuất hiện, hệ thống sẽ tự động nhận diện hoặc bạn có thể hướng camera vào QR để quét
                    </Typography>
                  </Alert>
                )}

                {!submitted && rotatingToken && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Đã nhận QR B thành công! Bây giờ hãy chụp ảnh khuôn mặt để hoàn tất điểm danh.
                    </Typography>
                  </Alert>
                )}



                {!submitted && previewUrl && (
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
