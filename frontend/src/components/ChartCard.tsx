import React from 'react'
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material'
import { SxProps, Theme } from '@mui/material/styles'

interface ChartData {
  label: string
  value: number
  color?: string
}

interface ChartCardProps {
  title: string
  subtitle?: string
  data: ChartData[]
  type?: 'bar' | 'pie' | 'line'
  height?: number
  sx?: SxProps<Theme>
}

export default function ChartCard({ 
  title, 
  subtitle, 
  data, 
  type = 'bar',
  height = 200,
  sx 
}: ChartCardProps) {
  const theme = useTheme()

  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main
  ]

  const maxValue = Math.max(...data.map(d => d.value))

  const renderBarChart = () => (
    <Box sx={{ display: 'flex', alignItems: 'end', gap: 1, height: height - 60, px: 1 }}>
      {data.map((item, index) => (
        <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box
            sx={{
              width: '100%',
              maxWidth: 40,
              height: `${(item.value / maxValue) * 100}%`,
              bgcolor: item.color || colors[index % colors.length],
              borderRadius: '4px 4px 0 0',
              minHeight: 4,
              transition: 'all 0.3s ease',
              '&:hover': {
                opacity: 0.8,
                transform: 'scaleY(1.05)'
              }
            }}
          />
          <Typography 
            variant="caption" 
            sx={{ 
              mt: 1, 
              textAlign: 'center',
              fontSize: '0.7rem',
              fontWeight: 500
            }}
          >
            {item.label}
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontSize: '0.65rem' }}
          >
            {item.value}
          </Typography>
        </Box>
      ))}
    </Box>
  )

  const renderPieChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    let currentAngle = 0

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, height: height - 60 }}>
        <Box sx={{ position: 'relative', width: 120, height: 120 }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={theme.palette.grey[200]}
              strokeWidth="20"
            />
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100
              const strokeDasharray = `${percentage * 3.14} 314`
              const strokeDashoffset = -currentAngle * 3.14
              currentAngle += percentage
              
              return (
                <circle
                  key={index}
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={item.color || colors[index % colors.length]}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 60 60)"
                  style={{
                    transition: 'all 0.3s ease'
                  }}
                />
              )
            })}
          </svg>
        </Box>
        <Box sx={{ flex: 1 }}>
          {data.map((item, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: item.color || colors[index % colors.length],
                  mr: 1
                }}
              />
              <Typography variant="body2" sx={{ flex: 1 }}>
                {item.label}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {item.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    )
  }

  const renderLineChart = () => {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 200
      const y = 100 - (item.value / maxValue) * 80
      return `${x},${y}`
    }).join(' ')

    return (
      <Box sx={{ height: height - 60, px: 1 }}>
        <svg width="100%" height="100%" viewBox="0 0 200 100">
          <polyline
            fill="none"
            stroke={theme.palette.primary.main}
            strokeWidth="2"
            points={points}
          />
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 200
            const y = 100 - (item.value / maxValue) * 80
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill={theme.palette.primary.main}
              />
            )
          })}
        </svg>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          {data.map((item, index) => (
            <Typography key={index} variant="caption" color="text.secondary">
              {item.label}
            </Typography>
          ))}
        </Box>
      </Box>
    )
  }

  const renderChart = () => {
    switch (type) {
      case 'pie':
        return renderPieChart()
      case 'line':
        return renderLineChart()
      default:
        return renderBarChart()
    }
  }

  return (
    <Card sx={{ height: '100%', ...sx }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {renderChart()}
      </CardContent>
    </Card>
  )
}
