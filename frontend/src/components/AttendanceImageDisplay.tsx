import React, { useState } from 'react'
import { 
  Box, 
  IconButton, 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogActions, 
  Button,
  Typography,
  Avatar
} from '@mui/material'
import { 
  Visibility, 
  Image as ImageIcon, 
  Close,
  Download
} from '@mui/icons-material'

interface AttendanceImageDisplayProps {
  imageBase64?: string
  mssv: string
  faceLabel?: string
}

export default function AttendanceImageDisplay({ 
  imageBase64, 
  mssv, 
  faceLabel 
}: AttendanceImageDisplayProps) {
  const [open, setOpen] = useState(false)

  const downloadImage = () => {
    if (!imageBase64) return
    
    const link = document.createElement('a')
    link.href = `data:image/jpeg;base64,${imageBase64}`
    link.download = `attendance_${mssv}_${new Date().toISOString().split('T')[0]}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!imageBase64) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.300' }}>
          <ImageIcon sx={{ fontSize: 16, color: 'grey.500' }} />
        </Avatar>
      </Box>
    )
  }

  const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar 
          src={imageDataUrl}
          sx={{ width: 32, height: 32 }}
          alt={`Ảnh điểm danh ${mssv}`}
        />
        <IconButton 
          size="small" 
          onClick={() => setOpen(true)}
          sx={{ color: 'primary.main' }}
          title="Xem ảnh"
        >
          <Visibility fontSize="small" />
        </IconButton>
      </Box>

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ImageIcon />
          Ảnh điểm danh - {mssv}
          <IconButton
            aria-label="close"
            onClick={() => setOpen(false)}
            sx={{ ml: 'auto' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <img 
              src={imageDataUrl}
              alt={`Ảnh điểm danh ${mssv}`}
              style={{
                maxWidth: '100%',
                maxHeight: '60vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}
            />
            {faceLabel && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Face Label: {faceLabel}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={downloadImage}
            startIcon={<Download />}
            variant="outlined"
          >
            Tải ảnh
          </Button>
          <Button onClick={() => setOpen(false)} variant="contained">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}