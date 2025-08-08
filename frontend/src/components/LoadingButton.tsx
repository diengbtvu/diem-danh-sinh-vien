import React from 'react'
import { Button, ButtonProps, CircularProgress, Box } from '@mui/material'

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
}

export default function LoadingButton({ 
  loading = false, 
  loadingText, 
  children, 
  disabled,
  ...props 
}: LoadingButtonProps) {
  return (
    <Button 
      {...props} 
      disabled={disabled || loading}
      sx={{
        position: 'relative',
        ...props.sx
      }}
    >
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <CircularProgress size={20} color="inherit" />
        </Box>
      )}
      <Box sx={{ opacity: loading ? 0 : 1 }}>
        {loading && loadingText ? loadingText : children}
      </Box>
    </Button>
  )
}
