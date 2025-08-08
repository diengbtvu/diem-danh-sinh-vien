import React from 'react'
import { Box, keyframes } from '@mui/material'

const pulse = keyframes`
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7);
  }
  
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(37, 99, 235, 0);
  }
  
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
  }
`

const wave = keyframes`
  0%, 60%, 100% {
    transform: initial;
  }
  
  30% {
    transform: translateY(-15px);
  }
`

interface PulseLoaderProps {
  size?: number
  color?: string
  type?: 'pulse' | 'wave'
}

export default function PulseLoader({ 
  size = 40, 
  color = '#2563eb',
  type = 'pulse'
}: PulseLoaderProps) {
  if (type === 'wave') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 8,
              height: 8,
              backgroundColor: color,
              borderRadius: '50%',
              animation: `${wave} 1.4s ease-in-out ${i * 0.16}s infinite both`
            }}
          />
        ))}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        animation: `${pulse} 2s infinite`,
        display: 'inline-block'
      }}
    />
  )
}
