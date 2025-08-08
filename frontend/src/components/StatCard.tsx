import React from 'react'
import { Card, CardContent, Typography, Box, Avatar, LinearProgress } from '@mui/material'
import { SxProps, Theme } from '@mui/material/styles'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down'
  }
  progress?: {
    value: number
    max: number
    label?: string
  }
  sx?: SxProps<Theme>
  onClick?: () => void
}

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'primary',
  trend,
  progress,
  sx,
  onClick
}: StatCardProps) {
  const getColorValue = (colorName: string) => {
    const colorMap = {
      primary: '#2563eb',
      secondary: '#10b981',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0284c7'
    }
    return colorMap[colorName as keyof typeof colorMap] || colorMap.primary
  }

  const cardColor = getColorValue(color)

  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
        } : {},
        ...sx 
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ fontWeight: 500, mb: 1 }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                color: cardColor,
                mb: 0.5
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon && (
            <Avatar 
              sx={{ 
                bgcolor: `${cardColor}20`,
                color: cardColor,
                width: 56, 
                height: 56 
              }}
            >
              {icon}
            </Avatar>
          )}
        </Box>

        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                bgcolor: trend.direction === 'up' ? 'success.light' : 'error.light',
                color: trend.direction === 'up' ? 'success.dark' : 'error.dark'
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {trend.direction === 'up' ? '↗' : '↘'} {Math.abs(trend.value)}%
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {trend.label}
            </Typography>
          </Box>
        )}

        {progress && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {progress.label || 'Tiến độ'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {progress.value}/{progress.max}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(progress.value / progress.max) * 100}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: cardColor,
                  borderRadius: 3
                }
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
