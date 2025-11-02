import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  LinearProgress,
  Stack,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  People,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Assessment
} from '@mui/icons-material';
import { apiRequest } from '../../config/api';

interface AttendanceStatsCardProps {
  defaultPeriod?: 'week' | 'month' | 'year';
  maLop?: string;
  title?: string;
}

export const AttendanceStatsCard: React.FC<AttendanceStatsCardProps> = ({
  defaultPeriod = 'month',
  maLop,
  title = 'Thống kê điểm danh'
}) => {
  const [period, setPeriod] = useState(defaultPeriod);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, [period, maLop]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (maLop) params.append('maLop', maLop);
      
      const response = await apiRequest(`/api/statistics/attendance?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'week': return '7 ngày qua';
      case 'month': return '30 ngày qua';
      case 'year': return '12 tháng qua';
      default: return '30 ngày qua';
    }
  };

  const acceptanceRate = stats ? (stats.acceptanceRate || 0).toFixed(1) : '0';
  const avgConfidence = stats ? (stats.averageConfidence || 0).toFixed(1) : '0';

  return (
    <Card sx={{ height: '100%', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assessment sx={{ color: '#1976d2', fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          </Box>
          
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Thời gian</InputLabel>
            <Select
              value={period}
              label="Thời gian"
              onChange={(e) => setPeriod(e.target.value as any)}
            >
              <MenuItem value="week">Tuần</MenuItem>
              <MenuItem value="month">Tháng</MenuItem>
              <MenuItem value="year">Năm</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {stats && (
          <Box>
            {/* Summary Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: '#e3f2fd',
                  border: '1px solid #90caf9'
                }}>
                  <Typography variant="caption" color="text.secondary">
                    Tổng điểm danh
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
                    {stats.totalAttendances}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getPeriodLabel()}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: '#f3e5f5',
                  border: '1px solid #ce93d8'
                }}>
                  <Typography variant="caption" color="text.secondary">
                    Sinh viên
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#7b1fa2' }}>
                    {stats.uniqueStudents}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Duy nhất
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Status Breakdown */}
            <Stack spacing={2}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ fontSize: 20, color: '#2e7d32' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Thành công
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                    {stats.acceptedCount}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.totalAttendances > 0 ? (stats.acceptedCount / stats.totalAttendances * 100) : 0}
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    bgcolor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': { bgcolor: '#2e7d32' }
                  }}
                />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning sx={{ fontSize: 20, color: '#ed6c02' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Cần xem xét
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#ed6c02' }}>
                    {stats.reviewCount}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.totalAttendances > 0 ? (stats.reviewCount / stats.totalAttendances * 100) : 0}
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    bgcolor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': { bgcolor: '#ed6c02' }
                  }}
                />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ErrorIcon sx={{ fontSize: 20, color: '#d32f2f' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Thất bại
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                    {stats.rejectedCount}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.totalAttendances > 0 ? (stats.rejectedCount / stats.totalAttendances * 100) : 0}
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    bgcolor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': { bgcolor: '#d32f2f' }
                  }}
                />
              </Box>
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* Key Metrics */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2' }}>
                    {acceptanceRate}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tỷ lệ chấp nhận
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#7b1fa2' }}>
                    {avgConfidence}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Độ tin cậy TB
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {!loading && !stats && (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            Không có dữ liệu
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
