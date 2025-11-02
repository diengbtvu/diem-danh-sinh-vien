import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { TrendingUp } from '@mui/icons-material';

interface TrendData {
  periodLabel: string;
  totalAttendances: number;
  acceptedCount: number;
  reviewCount: number;
  rejectedCount: number;
}

interface TrendChartProps {
  data: TrendData[];
  period: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, period }) => {
  const maxValue = Math.max(...data.map(d => d.totalAttendances), 1);

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <TrendingUp sx={{ mr: 1, color: '#1976d2' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Xu hướng điểm danh theo {period === 'week' ? 'tuần' : period === 'month' ? 'tháng' : 'năm'}
          </Typography>
        </Box>

        {/* Simple Bar Chart */}
        <Box>
          {data.map((point, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {point.periodLabel}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {point.totalAttendances} lượt
                </Typography>
              </Box>
              
              {/* Stacked Bar */}
              <Box sx={{ 
                display: 'flex', 
                height: 24, 
                borderRadius: 1, 
                overflow: 'hidden',
                bgcolor: '#f5f5f5'
              }}>
                {point.acceptedCount > 0 && (
                  <Box sx={{ 
                    width: `${(point.acceptedCount / maxValue) * 100}%`,
                    bgcolor: '#2e7d32',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {point.acceptedCount > 5 && (
                      <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                        {point.acceptedCount}
                      </Typography>
                    )}
                  </Box>
                )}
                {point.reviewCount > 0 && (
                  <Box sx={{ 
                    width: `${(point.reviewCount / maxValue) * 100}%`,
                    bgcolor: '#ed6c02',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {point.reviewCount > 5 && (
                      <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                        {point.reviewCount}
                      </Typography>
                    )}
                  </Box>
                )}
                {point.rejectedCount > 0 && (
                  <Box sx={{ 
                    width: `${(point.rejectedCount / maxValue) * 100}%`,
                    bgcolor: '#d32f2f',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {point.rejectedCount > 5 && (
                      <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                        {point.rejectedCount}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>

              {/* Details */}
              <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#2e7d32' }}>
                  ✓ {point.acceptedCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#ed6c02' }}>
                  ⚠ {point.reviewCount}
                </Typography>
                {point.rejectedCount > 0 && (
                  <Typography variant="caption" sx={{ color: '#d32f2f' }}>
                    ✗ {point.rejectedCount}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
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
            <Typography variant="caption">Từ chối</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
