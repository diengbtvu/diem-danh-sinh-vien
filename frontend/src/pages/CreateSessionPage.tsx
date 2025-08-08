import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Autocomplete,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material'
import {
  ContentCopy,
  QrCode,
  Schedule,
  Group,
  School,
  CheckCircle
} from '@mui/icons-material'
import LoadingButton from '../components/LoadingButton'

interface ClassInfo {
  maLop: string
  studentCount: number
  sessionCount: number
}

interface CreateSessionResponse {
  sessionId: string
  sessionToken: string
  rotateSeconds: number
  qrUrlTemplate: string
  expiresAt: string
}

export default function CreateSessionPage() {
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null)
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [loading, setLoading] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [result, setResult] = useState<CreateSessionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load classes on mount
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const response = await fetch('/api/sessions/classes')
        if (response.ok) {
          const data = await response.json()
          setClasses(data.classes)
        } else {
          setError('Không thể tải danh sách lớp')
        }
      } catch (err) {
        setError('Lỗi kết nối server')
      } finally {
        setLoadingClasses(false)
      }
    }
    loadClasses()
  }, [])

  const handleCreateSession = async () => {
    if (!selectedClass) {
      setError('Vui lòng chọn mã lớp')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/sessions/simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maLop: selectedClass.maLop,
          durationMinutes
        })
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data)
      } else {
        const errorText = await response.text()
        setError(errorText || 'Không thể tạo buổi học')
      }
    } catch (err) {
      setError('Lỗi kết nối server')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('vi-VN')
  }

  if (result) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Box sx={{ textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                  Tạo buổi học thành công!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Buổi học cho lớp <strong>{selectedClass?.maLop}</strong> đã được tạo
                </Typography>
              </Box>

              <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  📋 Thông tin buổi học
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Session ID</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                        {result.sessionId}
                      </Typography>
                      <Tooltip title="Copy Session ID">
                        <IconButton size="small" onClick={() => copyToClipboard(result.sessionId)}>
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">Thời gian kết thúc</Typography>
                    <Typography variant="body1">
                      {formatDateTime(result.expiresAt)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">Chu kỳ xoay QR</Typography>
                    <Typography variant="body1">
                      {result.rotateSeconds} giây
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              <Paper sx={{ p: 3, bgcolor: 'primary.50' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  📱 QR Code cho sinh viên
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    value={result.qrUrlTemplate}
                    InputProps={{
                      readOnly: true,
                      sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
                    }}
                  />
                  <Tooltip title="Copy URL">
                    <IconButton onClick={() => copyToClipboard(result.qrUrlTemplate)}>
                      <ContentCopy />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Tạo QR code từ URL này để sinh viên quét và truy cập trang điểm danh
                </Typography>
              </Paper>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setResult(null)
                    setSelectedClass(null)
                    setError(null)
                  }}
                  fullWidth
                >
                  Tạo buổi học khác
                </Button>
                <Button
                  variant="contained"
                  href="/admin"
                  fullWidth
                >
                  Quản lý buổi học
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Box sx={{ textAlign: 'center' }}>
              <QrCode sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                Tạo buổi học mới
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Tạo buổi điểm danh nhanh chóng với thông tin đơn giản
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                <School sx={{ mr: 1, verticalAlign: 'middle' }} />
                Chọn mã lớp
              </Typography>
              <Autocomplete
                options={classes}
                getOptionLabel={(option) => option.maLop}
                value={selectedClass}
                onChange={(_, newValue) => setSelectedClass(newValue)}
                loading={loadingClasses}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Chọn mã lớp..."
                    helperText={selectedClass ? `${selectedClass.studentCount} sinh viên • ${selectedClass.sessionCount} buổi học` : 'Chọn lớp từ danh sách có sẵn'}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {option.maLop}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <Group sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        {option.studentCount} sinh viên • {option.sessionCount} buổi học
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Box>

            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
                Thời gian điểm danh
              </Typography>
              <TextField
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                InputProps={{
                  endAdornment: <Typography variant="body2" color="text.secondary">phút</Typography>
                }}
                helperText="Thời gian từ bây giờ đến khi kết thúc điểm danh"
                inputProps={{ min: 5, max: 180 }}
              />
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                {[15, 30, 45, 60].map((minutes) => (
                  <Chip
                    key={minutes}
                    label={`${minutes} phút`}
                    variant={durationMinutes === minutes ? 'filled' : 'outlined'}
                    onClick={() => setDurationMinutes(minutes)}
                    size="small"
                  />
                ))}
              </Stack>
            </Box>

            <LoadingButton
              variant="contained"
              size="large"
              onClick={handleCreateSession}
              loading={loading}
              disabled={!selectedClass || loadingClasses}
              startIcon={<QrCode />}
              fullWidth
            >
              Tạo buổi học ngay
            </LoadingButton>

            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              Buổi học sẽ bắt đầu ngay bây giờ và kết thúc sau {durationMinutes} phút
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
