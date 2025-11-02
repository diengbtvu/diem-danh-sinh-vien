import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Stack
} from '@mui/material';
import {
  ArrowBack,
  Assessment,
  CalendarToday,
  DateRange,
  Today,
  Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiRequest, buildApiUrl } from '../config/api';
import { StatisticsCard } from '../components/analytics/StatisticsCard';
import { TrendChart } from '../components/analytics/TrendChart';

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [offset, setOffset] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [trend, setTrend] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<string[]>([]);

  // Get user role
  const getUserRole = () => {
    try {
      const stored = localStorage.getItem('diemdanh_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.user?.role as string | undefined;
      }
    } catch {
      return undefined;
    }
    return undefined;
  };

  const userRole = getUserRole();
  const isAdmin = userRole === 'ADMIN';
  const isTeacher = userRole === 'GIANGVIEN';

  const loadClasses = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await fetch(buildApiUrl('/api/admin/classes'), {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  }, [isAdmin, getAuthHeader]);

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period,
        offset: offset.toString()
      });
      if (selectedClass) {
        params.append('maLop', selectedClass);
      }

      const response = await apiRequest(`/api/analytics/stats?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  }, [period, offset, selectedClass]);

  const loadTrend = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        period,
        periods: '8'
      });
      if (selectedClass) {
        params.append('maLop', selectedClass);
      }

      const response = await apiRequest(`/api/analytics/trend?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTrend(data);
      }
    } catch (error) {
      console.error('Error loading trend:', error);
    }
  }, [period, selectedClass]);

  useEffect(() => {
    if (isAdmin) {
      loadClasses();
    }
  }, [isAdmin, loadClasses]);

  useEffect(() => {
    loadStatistics();
    loadTrend();
  }, [loadStatistics, loadTrend]);

  const handlePeriodChange = (newPeriod: 'week' | 'month' | 'year') => {
    setPeriod(newPeriod);
    setOffset(0);
  };

  const handleNavigatePeriod = (direction: 'prev' | 'next') => {
    setOffset(prev => direction === 'prev' ? prev - 1 : prev + 1);
  };

  const getBackUrl = () => {
    if (isAdmin) return '/admin-dashboard';
    if (isTeacher) return '/teacher-dashboard';
    return '/';
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar position="static" elevation={1} sx={{ bgcolor: 'white', color: '#1a1a1a' }}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate(getBackUrl())} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Assessment sx={{ mr: 1, color: '#1976d2' }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Thống kê & Phân tích
          </Typography>
          <IconButton onClick={() => { loadStatistics(); loadTrend(); }}>
            <Refresh />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
        {/* Controls */}
        <Card sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              {/* Period Selector */}
              <Grid item xs={12} md={4}>
                <ToggleButtonGroup
                  value={period}
                  exclusive
                  onChange={(_, value) => value && handlePeriodChange(value)}
                  size="small"
                  fullWidth
                >
                  <ToggleButton value="week">
                    <Today sx={{ mr: 0.5, fontSize: 18 }} />
                    Tuần
                  </ToggleButton>
                  <ToggleButton value="month">
                    <CalendarToday sx={{ mr: 0.5, fontSize: 18 }} />
                    Tháng
                  </ToggleButton>
                  <ToggleButton value="year">
                    <DateRange sx={{ mr: 0.5, fontSize: 18 }} />
                    Năm
                  </ToggleButton>
                </ToggleButtonGroup>
              </Grid>

              {/* Navigation */}
              <Grid item xs={12} md={4}>
                <Stack direction="row" spacing={1} justifyContent="center">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleNavigatePeriod('prev')}
                  >
                    ← Trước
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setOffset(0)}
                    disabled={offset === 0}
                  >
                    Hiện tại
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleNavigatePeriod('next')}
                    disabled={offset === 0}
                  >
                    Sau →
                  </Button>
                </Stack>
              </Grid>

              {/* Class Filter (Admin only) */}
              {isAdmin && (
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Lọc theo lớp</InputLabel>
                    <Select
                      value={selectedClass}
                      label="Lọc theo lớp"
                      onChange={(e) => setSelectedClass(e.target.value)}
                    >
                      <MenuItem value="">Tất cả lớp</MenuItem>
                      {classes.map((cls) => (
                        <MenuItem key={cls} value={cls}>{cls}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Grid container spacing={3}>
          {/* Current Period Stats */}
          <Grid item xs={12} md={6}>
            {stats && <StatisticsCard stats={stats} />}
          </Grid>

          {/* Trend Chart */}
          <Grid item xs={12} md={6}>
            {trend && <TrendChart data={trend.data} period={period} />}
          </Grid>

          {/* Additional Cards */}
          {stats?.dailyBreakdown && stats.dailyBreakdown.length > 0 && (
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Chi tiết theo ngày
                  </Typography>
                  <Grid container spacing={2}>
                    {stats.dailyBreakdown.map((day: any) => (
                      <Grid item xs={12} sm={6} md={3} key={day.date}>
                        <Box sx={{ 
                          p: 2, 
                          border: '1px solid #e0e0e0', 
                          borderRadius: 1,
                          '&:hover': { borderColor: '#1976d2' }
                        }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            {new Date(day.date).toLocaleDateString('vi-VN', {
                              weekday: 'short',
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2' }}>
                            {day.total}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Typography variant="caption" sx={{ color: '#2e7d32' }}>
                              ✓ {day.accepted}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#ed6c02' }}>
                              ⚠ {day.review}
                            </Typography>
                            {day.rejected > 0 && (
                              <Typography variant="caption" sx={{ color: '#d32f2f' }}>
                                ✗ {day.rejected}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
};
