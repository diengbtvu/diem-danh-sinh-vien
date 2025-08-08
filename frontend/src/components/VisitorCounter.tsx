import React from 'react'
import { Box, Typography, Grid, Paper, Chip } from '@mui/material'
import { Visibility, Today, People } from '@mui/icons-material'
import { useVisitorCounter } from '../hooks/useVisitorCounter'

export default function VisitorCounter() {
  const { totalVisits, todayVisits, onlineUsers } = useVisitorCounter()

  const formatNumber = (num: number): string => {
    return num.toLocaleString('vi-VN')
  }

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 3, 
        backgroundColor: '#f8f9fa',
        border: '1px solid #e9ecef'
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, textAlign: 'center', mb: 3 }}>
        Thống Kê Truy Cập
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Visibility sx={{ fontSize: 32, color: '#1976d2', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
              {formatNumber(totalVisits)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tổng lượt truy cập
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Today sx={{ fontSize: 32, color: '#4caf50', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#4caf50' }}>
              {formatNumber(todayVisits)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Hôm nay
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Box sx={{ textAlign: 'center' }}>
            <People sx={{ fontSize: 32, color: '#ff9800', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#ff9800' }}>
              {formatNumber(onlineUsers)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Đang online
            </Typography>
          </Box>
        </Grid>
      </Grid>
      
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Chip 
          label="Cập nhật realtime" 
          size="small" 
          sx={{ 
            backgroundColor: '#e3f2fd', 
            color: '#1976d2',
            fontSize: '0.75rem'
          }} 
        />
      </Box>
    </Paper>
  )
}
