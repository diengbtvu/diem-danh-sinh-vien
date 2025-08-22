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
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack
} from '@mui/material';
import {
  Dashboard,
  School,
  Assessment,
  ExitToApp,
  Person,
  People,
  Add,
  Visibility,
  Edit,
  Delete
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl, API_CONFIG } from '../config/api';

interface Session {
  sessionId: string;
  maLop: string;
  startAt: string;
  endAt: string;
  rotateSeconds: number;
  isActive: boolean;
  attendanceCount?: number;
  totalStudents?: number;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const SimpleTeacherDashboard: React.FC = () => {
  const { user, logout, getAuthHeader, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [tab, setTab] = useState<'dashboard' | 'sessions' | 'students' | 'create'>('dashboard');
  const [sessions, setSessions] = useState<Page<Session> | null>(null);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/login');
      return;
    }
    
    if (user && user.role !== 'GIANGVIEN') {
      navigate('/login');
      return;
    }
    
    if (user && user.role === 'GIANGVIEN') {
      loadTeacherData();
    }
  }, [user, authLoading, navigate]);

  const loadTeacherData = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.TEACHER.SESSIONS}?page=0&size=25`), {
        headers: getAuthHeader()
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      } else {
        console.error('Teacher API failed:', response.status, response.statusText);
        setError(`Lỗi tải dữ liệu phiên: ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading teacher data:', error);
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

  const handleViewSession = (sessionId: string) => {
    navigate(`/admin?session=${sessionId}`);
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
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Teacher Dashboard - Simple
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
          <Tab value="create" label="Tạo mới" icon={<Add />} />
        </Tabs>
      </Paper>

      <Box p={3}>
        {/* Dashboard Tab */}
        {tab === 'dashboard' && (
          <Box>
            <Typography variant="h4" gutterBottom>
              Chào mừng, {user.hoTen}!
            </Typography>
            
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Tổng phiên
                    </Typography>
                    <Typography variant="h4" fontWeight={600}>
                      {sessions?.totalElements || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Đang hoạt động
                    </Typography>
                    <Typography variant="h4" fontWeight={600}>
                      {sessions?.content?.filter(s => s.isActive).length || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Sessions Tab */}
        {tab === 'sessions' && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Phiên điểm danh của tôi
            </Typography>
            
            {sessions?.content && sessions.content.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Session ID</TableCell>
                      <TableCell>Lớp học</TableCell>
                      <TableCell>Thời gian bắt đầu</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell>Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessions.content.map((session) => (
                      <TableRow key={session.sessionId}>
                        <TableCell>{session.sessionId}</TableCell>
                        <TableCell>{session.maLop}</TableCell>
                        <TableCell>
                          {new Date(session.startAt).toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={session.isActive ? 'Đang hoạt động' : 'Đã kết thúc'}
                            color={session.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              onClick={() => handleViewSession(session.sessionId)}
                              color="primary"
                              size="small"
                            >
                              <Visibility />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Chưa có phiên điểm danh nào
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setTab('create')}
                >
                  Tạo phiên mới
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Other Tabs */}
        {tab === 'students' && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Sinh viên trong các lớp của tôi
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tính năng đang phát triển...
            </Typography>
          </Box>
        )}

        {tab === 'create' && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Tạo phiên điểm danh mới
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
