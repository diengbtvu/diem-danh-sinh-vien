import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Chip,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Refresh,
  Download,
  Settings,
  TrendingUp,
  People,
  Security,
  Speed,
  Assessment,
  FilterList
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { AnimatedPage, StaggerContainer, StaggerItem } from '../components/animations/AnimatedPage';
import { RealTimeChart } from '../components/dashboard/RealTimeChart';
import { MetricsCard } from '../components/dashboard/MetricsCard';
import { ExportButton } from '../components/dashboard/ExportButton';
import { useRealTimeData } from '../hooks/useRealTimeData';

interface DashboardData {
  totalAttendances: number;
  acceptanceRate: number;
  averageConfidence: number;
  recentAttendances: number;
  qualityScore: number;
  activeSessions: number;
  onlineUsers: number;
  systemHealth: string;
  lastUpdate: number;
  statusDistribution: Record<string, number>;
  hourlyStats: Array<{
    hour: number;
    count: number;
    averageConfidence: number;
  }>;
  dailyStats: Array<{
    date: string;
    count: number;
    acceptanceRate: number;
  }>;
}

export const AdvancedDashboard: React.FC = () => {
  const [selectedDateRange, setSelectedDateRange] = useState<string>('7d');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['attendance', 'quality', 'security']);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // Real-time data hook
  const {
    data: dashboardData,
    isLoading,
    error,
    lastUpdate,
    refresh
  } = useRealTimeData<DashboardData>('/api/analytics/dashboard/summary', {
    refreshInterval: autoRefresh ? 5000 : 0, // 5 seconds
    enabled: true
  });

  const handleRefresh = () => {
    refresh();
  };

  const handleExport = (format: string, dateRange: string) => {
    // Implementation for export functionality
    console.log('Exporting dashboard data:', { format, dateRange });
    setExportDialogOpen(false);
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'info';
    }
  };

  const formatLastUpdate = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (error) {
    return (
      <AnimatedPage>
        <Box p={3}>
          <Typography color="error">Error loading dashboard: {error}</Typography>
        </Box>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <Box p={3}>
        {/* Header */}
        <StaggerContainer>
          <StaggerItem>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h4" fontWeight={600} gutterBottom>
                  Advanced Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Real-time analytics and system monitoring
                </Typography>
              </Box>
              
              <Stack direction="row" spacing={1}>
                <Button
                  startIcon={<FilterList />}
                  onClick={() => setFilterDialogOpen(true)}
                  variant="outlined"
                >
                  Filters
                </Button>
                <Button
                  startIcon={<Download />}
                  onClick={() => setExportDialogOpen(true)}
                  variant="outlined"
                >
                  Export
                </Button>
                <IconButton
                  onClick={handleRefresh}
                  disabled={isLoading}
                  color="primary"
                >
                  <motion.div
                    animate={isLoading ? { rotate: 360 } : {}}
                    transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: 'linear' }}
                  >
                    <Refresh />
                  </motion.div>
                </IconButton>
              </Stack>
            </Box>
          </StaggerItem>

          {/* Status Bar */}
          <StaggerItem>
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={2} alignItems="center">
                  <Chip
                    label={`System: ${dashboardData?.systemHealth || 'Unknown'}`}
                    color={getHealthColor(dashboardData?.systemHealth || 'unknown')}
                    size="small"
                  />
                  <Chip
                    label={`${dashboardData?.onlineUsers || 0} users online`}
                    color="info"
                    size="small"
                  />
                  <Chip
                    label={`${dashboardData?.activeSessions || 0} active sessions`}
                    color="primary"
                    size="small"
                  />
                </Stack>
                
                <Typography variant="caption" color="text.secondary">
                  Last update: {dashboardData?.lastUpdate ? formatLastUpdate(dashboardData.lastUpdate) : 'Never'}
                </Typography>
              </Stack>
            </Paper>
          </StaggerItem>

          {/* Key Metrics */}
          <StaggerItem>
            <Grid container spacing={3} mb={3}>
              <Grid item xs={12} sm={6} md={3}>
                <MetricsCard
                  title="Total Attendances"
                  value={dashboardData?.totalAttendances || 0}
                  icon={<People />}
                  color="primary"
                  trend={+12.5}
                  loading={isLoading}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricsCard
                  title="Acceptance Rate"
                  value={`${(dashboardData?.acceptanceRate || 0).toFixed(1)}%`}
                  icon={<TrendingUp />}
                  color="success"
                  trend={+2.3}
                  loading={isLoading}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricsCard
                  title="Quality Score"
                  value={`${((dashboardData?.qualityScore || 0) * 100).toFixed(0)}%`}
                  icon={<Assessment />}
                  color="info"
                  trend={-1.2}
                  loading={isLoading}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricsCard
                  title="Avg Confidence"
                  value={`${((dashboardData?.averageConfidence || 0) * 100).toFixed(0)}%`}
                  icon={<Security />}
                  color="warning"
                  trend={+0.8}
                  loading={isLoading}
                />
              </Grid>
            </Grid>
          </StaggerItem>

          {/* Charts */}
          <StaggerItem>
            <Grid container spacing={3} mb={3}>
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardHeader
                    title="Attendance Trends"
                    subheader="Hourly attendance patterns"
                    action={
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Period</InputLabel>
                        <Select
                          value={selectedDateRange}
                          onChange={(e) => setSelectedDateRange(e.target.value)}
                          label="Period"
                        >
                          <MenuItem value="24h">Last 24 Hours</MenuItem>
                          <MenuItem value="7d">Last 7 Days</MenuItem>
                          <MenuItem value="30d">Last 30 Days</MenuItem>
                        </Select>
                      </FormControl>
                    }
                  />
                  <CardContent>
                    <RealTimeChart
                      data={dashboardData?.hourlyStats || []}
                      type="line"
                      height={300}
                      loading={isLoading}
                    />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} lg={4}>
                <Card sx={{ height: '100%' }}>
                  <CardHeader
                    title="Status Distribution"
                    subheader="Current attendance status breakdown"
                  />
                  <CardContent>
                    <RealTimeChart
                      data={Object.entries(dashboardData?.statusDistribution || {}).map(([key, value]) => ({
                        name: key,
                        value
                      }))}
                      type="pie"
                      height={300}
                      loading={isLoading}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </StaggerItem>

          {/* Recent Activity */}
          <StaggerItem>
            <Card>
              <CardHeader
                title="Recent Activity"
                subheader={`${dashboardData?.recentAttendances || 0} attendances in the last 24 hours`}
                action={
                  <Button size="small" startIcon={<Speed />}>
                    View All
                  </Button>
                }
              />
              <CardContent>
                <RealTimeChart
                  data={dashboardData?.dailyStats || []}
                  type="bar"
                  height={200}
                  loading={isLoading}
                />
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
          <DialogTitle>Export Dashboard Data</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1, minWidth: 300 }}>
              <FormControl fullWidth>
                <InputLabel>Format</InputLabel>
                <Select defaultValue="pdf" label="Format">
                  <MenuItem value="pdf">PDF Report</MenuItem>
                  <MenuItem value="excel">Excel Spreadsheet</MenuItem>
                  <MenuItem value="csv">CSV Data</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select defaultValue="7d" label="Date Range">
                  <MenuItem value="24h">Last 24 Hours</MenuItem>
                  <MenuItem value="7d">Last 7 Days</MenuItem>
                  <MenuItem value="30d">Last 30 Days</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => handleExport('pdf', '7d')} variant="contained">
              Export
            </Button>
          </DialogActions>
        </Dialog>

        {/* Filter Dialog */}
        <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)}>
          <DialogTitle>Dashboard Filters</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1, minWidth: 300 }}>
              <FormControl fullWidth>
                <InputLabel>Metrics to Display</InputLabel>
                <Select
                  multiple
                  value={selectedMetrics}
                  onChange={(e) => setSelectedMetrics(e.target.value as string[])}
                  label="Metrics to Display"
                >
                  <MenuItem value="attendance">Attendance</MenuItem>
                  <MenuItem value="quality">Quality</MenuItem>
                  <MenuItem value="security">Security</MenuItem>
                  <MenuItem value="performance">Performance</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Auto Refresh Interval (seconds)"
                type="number"
                defaultValue={5}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setFilterDialogOpen(false)} variant="contained">
              Apply
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AnimatedPage>
  );
};
