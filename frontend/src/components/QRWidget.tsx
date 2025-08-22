import React, { useState, useEffect } from 'react'
import {
  Box, Paper, Typography, Button, Alert, CircularProgress,
  Stack, Chip, IconButton, Tooltip, Card, CardContent
} from '@mui/material'
import {
  QrCode2, Refresh, ContentCopy, Download, Visibility,
  VisibilityOff, Timer, CheckCircle, Error as ErrorIcon
} from '@mui/icons-material'
import QRCode from 'qrcode'

interface QRWidgetProps {
  /** QR data to encode */
  data: string
  /** Widget title */
  title?: string
  /** Widget size */
  size?: 'small' | 'medium' | 'large' | 'extra-large'
  /** Show copy button */
  showCopy?: boolean
  /** Show download button */
  showDownload?: boolean
  /** Show refresh button */
  showRefresh?: boolean
  /** Auto refresh interval in seconds */
  autoRefresh?: number
  /** QR code error correction level */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  /** Custom styling */
  sx?: any
  /** Callback when QR is refreshed */
  onRefresh?: () => void
  /** Show QR data toggle */
  showDataToggle?: boolean
  /** Status indicator */
  status?: 'active' | 'inactive' | 'expired' | 'loading'
}

export const QRWidget: React.FC<QRWidgetProps> = ({
  data,
  title = 'QR Code',
  size = 'medium',
  showCopy = true,
  showDownload = true,
  showRefresh = false,
  autoRefresh,
  errorCorrectionLevel = 'M',
  sx,
  onRefresh,
  showDataToggle = false,
  status = 'active'
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showData, setShowData] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)

  // QR size based on widget size
  const qrSize = {
    small: 150,
    medium: 200,
    large: 300,
    'extra-large': 400
  }[size]

  // Generate QR code
  const generateQR = async () => {
    if (!data) {
      setError('No data provided')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const url = await QRCode.toDataURL(data, {
        width: qrSize,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel
      })
      setQrDataUrl(url)
    } catch (err: any) {
      setError(`Failed to generate QR code: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Handle refresh
  const handleRefresh = () => {
    generateQR()
    onRefresh?.()
  }

  // Copy QR data to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data)
      // Could add toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Download QR code
  const handleDownload = () => {
    if (!qrDataUrl) return

    const link = document.createElement('a')
    link.download = `qr-code-${Date.now()}.png`
    link.href = qrDataUrl
    link.click()
  }

  // Auto refresh countdown
  useEffect(() => {
    if (!autoRefresh) return

    setCountdown(autoRefresh)
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          handleRefresh()
          return autoRefresh
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [autoRefresh, data])

  // Generate QR on data change
  useEffect(() => {
    generateQR()
  }, [data])

  // Status colors
  const statusColors = {
    active: 'success',
    inactive: 'warning',
    expired: 'error',
    loading: 'info'
  } as const

  const statusLabels = {
    active: 'Active',
    inactive: 'Inactive',
    expired: 'Expired',
    loading: 'Loading'
  }

  return (
    <Card sx={{ maxWidth: qrSize + 100, ...sx }}>
      <CardContent>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QrCode2 />
            {title}
          </Typography>
          <Chip
            label={statusLabels[status]}
            color={statusColors[status]}
            size="small"
          />
        </Stack>

        {/* QR Code Display */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: qrSize,
            border: '2px dashed #e0e0e0',
            borderRadius: 2,
            mb: 2,
            position: 'relative'
          }}
        >
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Stack alignItems="center" spacing={1}>
              <ErrorIcon color="error" sx={{ fontSize: 48 }} />
              <Typography variant="body2" color="error" textAlign="center">
                {error}
              </Typography>
            </Stack>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                borderRadius: 8
              }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No QR code generated
            </Typography>
          )}


        </Box>

        {/* QR Data Display */}
        {showDataToggle && (
          <Box mb={2}>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <Typography variant="body2" color="text.secondary">
                QR Data:
              </Typography>
              <IconButton
                size="small"
                onClick={() => setShowData(!showData)}
              >
                {showData ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </Stack>
            {showData && (
              <Paper
                variant="outlined"
                sx={{
                  p: 1,
                  backgroundColor: '#f5f5f5',
                  wordBreak: 'break-all',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace'
                }}
              >
                {data}
              </Paper>
            )}
          </Box>
        )}

        {/* Action Buttons */}
        <Stack direction="row" spacing={1} justifyContent="center">
          {showCopy && (
            <Tooltip title="Copy QR data">
              <IconButton onClick={handleCopy} size="small">
                <ContentCopy />
              </IconButton>
            </Tooltip>
          )}
          
          {showDownload && qrDataUrl && (
            <Tooltip title="Download QR code">
              <IconButton onClick={handleDownload} size="small">
                <Download />
              </IconButton>
            </Tooltip>
          )}
          
          {showRefresh && (
            <Tooltip title="Refresh QR code">
              <IconButton onClick={handleRefresh} size="small" disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {/* Status Message */}
        {status === 'expired' && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            This QR code has expired. Please refresh to get a new one.
          </Alert>
        )}
        
        {status === 'inactive' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            This QR code is currently inactive.
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default QRWidget
