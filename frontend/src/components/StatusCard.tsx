import React from 'react'
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material'
import { SxProps, Theme } from '@mui/material/styles'

interface StatusCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  sx?: SxProps<Theme>
}

export default function StatusCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'primary',
  sx 
}: StatusCardProps) {
  return (
    <Card 
      sx={{ 
        height: '100%',
        backgroundColor: `${color}.main`,
        color: 'white',
        ...sx 
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 500, opacity: 0.9 }}>
            {title}
          </Typography>
          {icon && (
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 48, height: 48 }}>
              {icon}
            </Avatar>
          )}
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}
