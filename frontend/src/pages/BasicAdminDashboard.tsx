import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Paper,
  Alert
} from '@mui/material';
import {
  Dashboard,
  People,
  School,
  Assessment,
  ExitToApp,
  Person,
  AdminPanelSettings
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl, API_CONFIG } from '../config/api';

interface DashboardStats {
  users: {
    total: number;
    giangVien: number;
  };
  sessions: {
    total: number;
  };
  students: {
    total: number;
  };
}

export const BasicAdminDashboard: React.FC = () => {
  const { user, logout, getAuthHeader, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [tab, setTab] = useState<'dashboard' | 'sessions' | 'students' | 'users'>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/login');
      return;
    }
    
    if (user && user.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    
    if (user && user.role === 'ADMIN') {
      loadDashboardData();
    }
  }, [user, authLoading, navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const statsResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.USERS_DASHBOARD), {
        headers: getAuthHeader()
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      } else {
        console.error('Admin API failed:', statsResponse.status, statsResponse.statusText);
        setError(`Lỗi tải thống kê: ${statsResponse.status}`);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Lỗi kết nối tới server');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (authLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Đang tải...</Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Không tìm thấy thông tin người dùng</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <AppBar position="static" sx={{ boxShadow: 'none', border: 'none' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard - Basic
          </Typography>
          
          <IconButton
            size="large"
            edge="end"
            onClick={handleMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              <Person />
            </Avatar>
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleLogout}>
              <ExitToApp sx={{ mr: 1 }} />
              Đăng xuất
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2, mx: 3, mt: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2, mx: 3, mt: 2 }}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mx: 3, mt: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, newValue) => setTab(newValue)}
          variant="fullWidth"
        >
          <Tab value="dashboard" label="Dashboard" icon={<Dashboard />} />
          <Tab value="sessions" label="Phiên" icon={<School />} />
          <Tab value="students" label="Sinh viên" icon={<People />} />
          <Tab value="users" label="Người dùng" icon={<AdminPanelSettings />} />
        </Tabs>
      </Paper>

      <Box p={3}>
        {/* Dashboard Tab */}
        {tab === 'dashboard' && (
          <Box>
            <Typography variant="h4" gutterBottom>
              Chào mừng, {user.hoTen}!
            </Typography>
            
            {/* Stats Cards */}
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Tổng người dùng
                    </Typography>
                    <Typography variant="h4" fontWeight={600}>
                      {stats?.users?.total || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Giảng viên
                    </Typography>
                    <Typography variant="h4" fontWeight={600}>
                      {stats?.users?.giangVien || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Phiên điểm danh
                    </Typography>
                    <Typography variant="h4" fontWeight={600}>
                      {stats?.sessions?.total || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Sinh viên
                    </Typography>
                    <Typography variant="h4" fontWeight={600}>
                      {stats?.students?.total || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Other Tabs */}
        {tab === 'sessions' && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Quản lý phiên điểm danh
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tính năng đang phát triển...
            </Typography>
          </Box>
        )}

        {tab === 'students' && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Quản lý sinh viên
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tính năng đang phát triển...
            </Typography>
          </Box>
        )}

        {tab === 'users' && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Quản lý người dùng
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tính năng đang phát triển...
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};
