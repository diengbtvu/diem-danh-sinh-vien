import React, { useState, useEffect } from 'react'
import {
  Card, CardContent, Typography, Box, Chip, IconButton, Tooltip,
  LinearProgress, Stack, Divider, Alert
} from '@mui/material'
import {
  Refresh, TrendingUp, AccessTime, Person, CheckCircle, Warning, Error
} from '@mui/icons-material'
import { apiRequest } from '../config/api'

interface RealtimeStats {
  sessionId: string
  total: number
  accepted: number
  review: number
  rejected: number
  recentCount: number
  lastUpdated: string
  latestMssv?: string | null
  latestStatus?: string | null
  latestTime?: string | null
}

interface RealtimeStatsCardProps {
  sessionId: string
  refreshInterval?: number
  apiPrefix?: string  // Add apiPrefix prop
}

export default function RealtimeStatsCard({ 
  sessionId, 
  refreshInterval = 30000, // 30 seconds default
  apiPrefix = '/api/admin'  // Default to admin
}: RealtimeStatsCardProps) {
  const [stats, setStats] = useState<RealtimeStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchRealtimeStats = async () => {
    if (!sessionId) return

    setLoading(true)
    setError(null)

    try {
      console.log('Fetching realtime stats for:', sessionId, 'with apiPrefix:', apiPrefix)
      const response = await apiRequest(`${apiPrefix}/stats/realtime/${sessionId}`)
      console.log('Realtime stats response:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Realtime stats data:', data)
        setStats(data)
        setLastRefresh(new Date())
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch realtime stats:', response.status, errorText)
        setError('Không thể tải dữ liệu thống kê')
      }
    } catch (err) {
      setError('Lỗi kết nối')
      console.error('Error fetching realtime stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRealtimeStats()
    
    const interval = setInterval(fetchRealtimeStats, refreshInterval)
    
    return () => clearInterval(interval)
  }, [sessionId, refreshInterval, apiPrefix])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'success'
      case 'REVIEW': return 'warning'
      case 'REJECTED': return 'error'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return <CheckCircle />
      case 'REVIEW': return <Warning />
      case 'REJECTED': return <Error />
      default: return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'Thành công'
      case 'REVIEW': return 'Cần xem xét'
      case 'REJECTED': return 'Thất bại'
      default: return status
    }
  }

  const formatTime = (timeString: string) => {
    try {
      return new Date(timeString).toLocaleString('vi-VN')
    } catch {
      return timeString
    }
  }

  return (
    <Card elevation={3} sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUp sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Thống kê Real-time
            </Typography>
          </Box>
          <Tooltip title="Làm mới">
            <IconButton 
              size="small" 
              onClick={fetchRealtimeStats}
              disabled={loading}
            >
              <Refresh sx={{ 
                animation: loading ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} />
            </IconButton>
          </Tooltip>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {stats ? (
          <Stack spacing={3}>
            {/* Current Stats */}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Tổng quan hiện tại
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Tổng số:</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {stats.total}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Thành công:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {stats.accepted}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Cần xem xét:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'warning.main' }}>
                  {stats.review}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Thất bại:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'error.main' }}>
                  {stats.rejected}
                </Typography>
              </Box>
            </Box>

            <Divider />

            {/* Recent Activity */}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Hoạt động gần đây (5 phút)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccessTime sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="body2">
                  {stats.recentCount} lượt điểm danh mới
                </Typography>
              </Box>
              
              {stats.latestMssv && (
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Điểm danh mới nhất:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Person sx={{ mr: 1, fontSize: 16 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {stats.latestMssv}
                      </Typography>
                    </Box>
                    <Chip
                      icon={stats.latestStatus ? getStatusIcon(stats.latestStatus) : undefined}
                      label={stats.latestStatus ? getStatusText(stats.latestStatus) : 'N/A'}
                      color={stats.latestStatus ? getStatusColor(stats.latestStatus) as any : 'default'}
                      size="small"
                    />
                  </Box>
                  {stats.latestTime && (
                    <Typography variant="caption" color="text.secondary">
                      {formatTime(stats.latestTime)}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>

            <Divider />

            {/* Last Update */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Cập nhật lần cuối: {lastRefresh ? lastRefresh.toLocaleTimeString('vi-VN') : 'Chưa có'}
              </Typography>
              {loading && (
                <LinearProgress sx={{ mt: 1, height: 2 }} />
              )}
            </Box>
          </Stack>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {loading ? 'Đang tải...' : 'Không có dữ liệu'}
            </Typography>
            {loading && (
              <LinearProgress sx={{ mt: 2, height: 2 }} />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
