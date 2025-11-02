import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface PeriodStats {
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalSessions: number;
  totalAttendances: number;
  acceptedCount: number;
  reviewCount: number;
  rejectedCount: number;
  uniqueStudents: number;
}

interface StatsSummary {
  period: string;
  totalSessions: number;
  totalAttendances: number;
  acceptedCount: number;
  uniqueStudents: number;
}

const StatisticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [period, setPeriod] = useState('month');
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState<PeriodStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<PeriodStats[]>([]);
  const [yearlyStats, setYearlyStats] = useState<PeriodStats[]>([]);
  const [summary, setSummary] = useState<StatsSummary | null>(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    loadData();
  }, [period, token]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load summary
      const summaryRes = await fetch(
        `/api/statistics/summary?period=${period}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      }

      // Load period stats based on active tab
      if (activeTab === 0) {
        // Weekly
        const res = await fetch('/api/statistics/weekly?weeks=12', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setWeeklyStats(data);
          setSelectedPeriodIndex(0); // Default to latest week
        }
      } else if (activeTab === 1) {
        // Monthly
        const res = await fetch('/api/statistics/monthly?months=12', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMonthlyStats(data);
          setSelectedPeriodIndex(0); // Default to latest month
        }
      } else {
        // Yearly
        const res = await fetch('/api/statistics/yearly?years=5', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setYearlyStats(data);
          setSelectedPeriodIndex(0); // Default to latest year
        }
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getCurrentStats = (): PeriodStats[] => {
    switch (activeTab) {
      case 0:
        return weeklyStats;
      case 1:
        return monthlyStats;
      case 2:
        return yearlyStats;
      default:
        return [];
    }
  };

  const getSelectedPeriodStats = (): PeriodStats | null => {
    const stats = getCurrentStats();
    return stats[selectedPeriodIndex] || null;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('vi-VN');
  };

  const calculateAcceptanceRate = (accepted: number, total: number) => {
    if (total === 0) return 0;
    return ((accepted / total) * 100).toFixed(1);
  };

  const getPeriodLabel = () => {
    switch (activeTab) {
      case 0:
        return 'tuần';
      case 1:
        return 'tháng';
      case 2:
        return 'năm';
      default:
        return '';
    }
  };

  const selectedStats = getSelectedPeriodStats();

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          📊 Thống Kê Điểm Danh
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Quay lại
        </Button>
      </Box>

      {/* Summary Cards - Current Period */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EventIcon sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
                  <Typography color="textSecondary" variant="body2" fontWeight={500}>
                    Tổng buổi điểm danh
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {formatNumber(summary.totalSessions)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {period === 'week' ? 'Tuần này' : period === 'month' ? 'Tháng này' : 'Năm này'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AssessmentIcon sx={{ mr: 1, color: 'success.main', fontSize: 28 }} />
                  <Typography color="textSecondary" variant="body2" fontWeight={500}>
                    Tổng lượt điểm danh
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {formatNumber(summary.totalAttendances)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon sx={{ mr: 1, color: 'info.main', fontSize: 28 }} />
                  <Typography color="textSecondary" variant="body2" fontWeight={500}>
                    Đã chấp nhận
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'info.main' }}>
                  {formatNumber(summary.acceptedCount)}
                </Typography>
                <Chip
                  label={`${calculateAcceptanceRate(summary.acceptedCount, summary.totalAttendances)}%`}
                  color="success"
                  size="small"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PeopleIcon sx={{ mr: 1, color: 'warning.main', fontSize: 28 }} />
                  <Typography color="textSecondary" variant="body2" fontWeight={500}>
                    Sinh viên tham gia
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'warning.main' }}>
                  {formatNumber(summary.uniqueStudents)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Theo Tuần" />
          <Tab label="Theo Tháng" />
          <Tab label="Theo Năm" />
        </Tabs>
      </Paper>

      {/* Period Selector and Details */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : getCurrentStats().length > 0 ? (
        <Grid container spacing={3}>
          {/* Dropdown Selector */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Chọn {getPeriodLabel()}</InputLabel>
                <Select
                  value={selectedPeriodIndex}
                  label={`Chọn ${getPeriodLabel()}`}
                  onChange={(e) => setSelectedPeriodIndex(Number(e.target.value))}
                >
                  {getCurrentStats().map((stat, index) => (
                    <MenuItem key={index} value={index}>
                      {stat.periodLabel} ({stat.startDate} - {stat.endDate})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Paper>
          </Grid>

          {/* Selected Period Statistics */}
          {selectedStats && (
            <>
              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                    Thống kê chi tiết - {selectedStats.periodLabel}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Từ {selectedStats.startDate} đến {selectedStats.endDate}
                  </Typography>
                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <EventIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {formatNumber(selectedStats.totalSessions)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Buổi điểm danh
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <AssessmentIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {formatNumber(selectedStats.totalAttendances)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Lượt điểm danh
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <PeopleIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                          {formatNumber(selectedStats.uniqueStudents)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Sinh viên
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <CheckCircleIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                          {calculateAcceptanceRate(selectedStats.acceptedCount, selectedStats.totalAttendances)}%
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Tỷ lệ chấp nhận
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Status Breakdown */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    Phân tích trạng thái
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                        <CardContent>
                          <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            {formatNumber(selectedStats.acceptedCount)}
                          </Typography>
                          <Typography variant="body2">Đã chấp nhận</Typography>
                          <Chip
                            label={`${calculateAcceptanceRate(selectedStats.acceptedCount, selectedStats.totalAttendances)}%`}
                            size="small"
                            sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.3)' }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                        <CardContent>
                          <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            {formatNumber(selectedStats.reviewCount)}
                          </Typography>
                          <Typography variant="body2">Cần xem lại</Typography>
                          <Chip
                            label={`${calculateAcceptanceRate(selectedStats.reviewCount, selectedStats.totalAttendances)}%`}
                            size="small"
                            sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.3)' }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
                        <CardContent>
                          <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            {formatNumber(selectedStats.rejectedCount)}
                          </Typography>
                          <Typography variant="body2">Đã từ chối</Typography>
                          <Chip
                            label={`${calculateAcceptanceRate(selectedStats.rejectedCount, selectedStats.totalAttendances)}%`}
                            size="small"
                            sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.3)' }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Average Stats */}
              {selectedStats.totalSessions > 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      Thống kê trung bình
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={4}>
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Trung bình lượt điểm danh/buổi
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {(selectedStats.totalAttendances / selectedStats.totalSessions).toFixed(1)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Trung bình sinh viên/buổi
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                            {(selectedStats.uniqueStudents / selectedStats.totalSessions).toFixed(1)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Tỷ lệ chấp nhận trung bình
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>
                            {calculateAcceptanceRate(selectedStats.acceptedCount, selectedStats.totalAttendances)}%
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}
            </>
          )}
        </Grid>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h6" color="textSecondary">
            Không có dữ liệu thống kê
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Chưa có buổi điểm danh nào trong kỳ này
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default StatisticsPage;
