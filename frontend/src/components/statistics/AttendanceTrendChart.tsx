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
  LinearProgress,
  Alert
} from '@mui/material';
import { TrendingUp } from '@mui/icons-material';
import { apiRequest } from '../../config/api';

interface AttendanceTrendChartProps {
  defaultPeriod?: 'week' | 'month' | 'year';
  maLop?: string;
}

export const AttendanceTrendChart: React.FC<AttendanceTrendChartProps> = ({
  defaultPeriod = 'month',
  maLop
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
      console.error('Error loading trend:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaxValue = () => {
    if (!stats?.dailyStats) return 0;
    return Math.max(...stats.dailyStats.map((d: any) => d.total));
  };

  const maxValue = getMaxValue();

  return (
    <Card sx={{ height: '100%', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp sx={{ color: '#1976d2', fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Xu hướng điểm danh
            </Typography>
          </Box>
          
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Thời gian</InputLabel>
            <Select
              value={period}
              label="Thời gian"
              onChange={(e) => setPeriod(e.target.value as any)}
            >
              <MenuItem value="week">7 ngày</MenuItem>
              <MenuItem value="month">30 ngày</MenuItem>
              <MenuItem value="year">12 tháng</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {stats && stats.dailyStats && stats.dailyStats.length > 0 ? (
          <Box>
            {/* Simple Bar Chart */}
            <Box sx={{ mb: 2 }}>
              {stats.dailyStats.slice(-14).map((day: any, index: number) => {
                const date = new Date(day.date);
                const percentage = maxValue > 0 ? (day.total / maxValue * 100) : 0;
                
                return (
                  <Box key={day.date} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {day.total} lượt
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, height: 8 }}>
                      {/* Accepted */}
                      <Box sx={{ 
                        width: `${day.total > 0 ? (day.accepted / day.total * 100) : 0}%`,
                        bgcolor: '#2e7d32',
                        borderRadius: '4px 0 0 4px',
                        minWidth: day.accepted > 0 ? 4 : 0
                      }} />
                      {/* Review */}
                      <Box sx={{ 
                        width: `${day.total > 0 ? (day.review / day.total * 100) : 0}%`,
                        bgcolor: '#ed6c02',
                        minWidth: day.review > 0 ? 4 : 0
                      }} />
                      {/* Rejected */}
                      <Box sx={{ 
                        width: `${day.total > 0 ? (day.rejected / day.total * 100) : 0}%`,
                        bgcolor: '#d32f2f',
                        borderRadius: '0 4px 4px 0',
                        minWidth: day.rejected > 0 ? 4 : 0
                      }} />
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Legend */}
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: '#2e7d32', borderRadius: 1 }} />
                <Typography variant="caption">Thành công</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: '#ed6c02', borderRadius: 1 }} />
                <Typography variant="caption">Xem xét</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: '#d32f2f', borderRadius: 1 }} />
                <Typography variant="caption">Thất bại</Typography>
              </Box>
            </Stack>
          </Box>
        ) : !loading && (
          <Alert severity="info">
            Không có dữ liệu điểm danh trong khoảng thời gian này
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
