import React from 'react';
import { Card, CardContent, Typography, Box, Grid, Chip, LinearProgress } from '@mui/material';
import { TrendingUp, TrendingDown, CheckCircle, Warning, Error } from '@mui/icons-material';

interface StatisticsCardProps {
  stats: {
    periodLabel: string;
    totalAttendances: number;
    acceptedCount: number;
    reviewCount: number;
    rejectedCount: number;
    acceptedRate: number;
    reviewRate: number;
    rejectedRate: number;
    averageConfidence: number;
    uniqueStudents: number;
    totalSessions: number;
  };
}

export const StatisticsCard: React.FC<StatisticsCardProps> = ({ stats }) => {
  return (
    <Card sx={{ borderRadius: 2, height: '100%' }}>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            Thống kê {stats.periodLabel}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {stats.totalSessions} phiên điểm danh • {stats.uniqueStudents} sinh viên
          </Typography>
        </Box>

        {/* Main Metrics */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e8f5e9', borderRadius: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                {stats.acceptedCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Thành công
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ed6c02' }}>
                {stats.reviewCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Xem xét
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#ffebee', borderRadius: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                {stats.rejectedCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Từ chối
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Progress Bars */}
        <Box>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Tỷ lệ thành công
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                {stats.acceptedRate.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={stats.acceptedRate}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  bgcolor: '#2e7d32'
                }
              }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Độ tin cậy trung bình
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                {(stats.averageConfidence * 100).toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={stats.averageConfidence * 100}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  bgcolor: '#1976d2'
                }
              }}
            />
          </Box>
        </Box>

        {/* Summary */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
          <Typography variant="body2" color="text.secondary">
            Tổng lượt điểm danh: <strong>{stats.totalAttendances}</strong>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
