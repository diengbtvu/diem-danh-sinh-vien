import React from 'react'
import { Box, Typography } from '@mui/material'
import { useVisitorCounter } from '../hooks/useVisitorCounter'

export default function VisitorCounter() {
  const { totalVisits, todayVisits, onlineUsers } = useVisitorCounter()

  const formatNumber = (num: number): string => {
    return num.toLocaleString('vi-VN')
  }

  return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'grey.300' }}>
        Thống Kê Truy Cập
      </Typography>

      <Typography variant="body2" sx={{ color: 'grey.400', mb: 0.5 }}>
        <strong>{formatNumber(totalVisits)}</strong> Tổng lượt truy cập
      </Typography>

      <Typography variant="body2" sx={{ color: 'grey.400', mb: 0.5 }}>
        <strong>{formatNumber(todayVisits)}</strong> Hôm nay
      </Typography>

      <Typography variant="body2" sx={{ color: 'grey.400', mb: 1 }}>
        <strong>{formatNumber(onlineUsers)}</strong> Đang online
      </Typography>

      <Typography variant="caption" sx={{ color: 'grey.500', fontStyle: 'italic' }}>
        Cập nhật realtime
      </Typography>
    </Box>
  )
}
