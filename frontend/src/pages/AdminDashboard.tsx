import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  Stack,
  Fade,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Dashboard,
  People,
  School,
  Assessment,
  Settings,
  ExitToApp,
  Add,
  Edit,
  Block,
  CheckCircle,
  AdminPanelSettings,
  Person,
  Delete,
  Visibility,
  QrCode,
  FileDownload,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { buildApiUrl, API_CONFIG } from '../config/api';
import ProfessionalLayout from '../components/ProfessionalLayout';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';

// Animation components
const AnimatedPage = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    {children}
  </motion.div>
);

const StaggerContainer = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1
        }
      }
    }}
  >
    {children}
  </motion.div>
);

const StaggerItem = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}
  >
    {children}
  </motion.div>
);

interface DashboardStats {
  users: {
    total: number;
    active: number;
    admins: number;
    giangVien: number;
  };
  sessions: {
    total: number;
  };
  attendances: {
    total: number;
  };
  students: {
    total: number;
  };
}

interface User {
  id: number;
  username: string;
  hoTen: string;
  email: string;
  role: string;
  khoa?: string;
  boMon?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

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

interface Student {
  mssv: string;
  hoTen: string;
  maLop: string;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const AdminDashboard: React.FC = () => {
  const { user, logout, getAuthHeader, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Tab state
  const [tab, setTab] = useState<'dashboard' | 'sessions' | 'students' | 'users'>('dashboard');

  // Dashboard states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Page<Session> | null>(null);
  const [students, setStudents] = useState<Page<Student> | null>(null);

  // UI states
  const [loading, setLoading] = useState(true);
  const [createUserDialog, setCreateUserDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination states
  const [pageS, setPageS] = useState(0);
  const [pageStu, setPageStu] = useState(0);

  // Search and sort states
  const [sessionSearch, setSessionSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [sessionSort, setSessionSort] = useState({ column: 'startAt', direction: 'desc' as 'asc' | 'desc' });
  const [studentSort, setStudentSort] = useState({ column: 'hoTen', direction: 'asc' as 'asc' | 'desc' });

  // Form states
  const [studentForm, setStudentForm] = useState<Partial<Student>>({});
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [csvText, setCsvText] = useState('');

  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    hoTen: '',
    email: '',
    role: 'GIANGVIEN',
    khoa: '',
    boMon: ''
  });

  // Fetch functions
  const fetchSessions = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: pageS.toString(),
        size: '25',
        sortBy: sessionSort.column,
        sortDir: sessionSort.direction,
        ...(sessionSearch && { search: sessionSearch })
      });
      const response = await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.ADMIN.SESSIONS}?${params}`), {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      } else {
        // Fallback mock sessions
        setSessions({
          content: [
            {
              sessionId: 'demo-session-1',
              maLop: 'IT4409',
              startAt: new Date().toISOString(),
              endAt: new Date(Date.now() + 3600000).toISOString(),
              rotateSeconds: 30,
              isActive: true,
              attendanceCount: 25,
              totalStudents: 30
            },
            {
              sessionId: 'demo-session-2',
              maLop: 'IT4410',
              startAt: new Date(Date.now() - 86400000).toISOString(),
              endAt: new Date(Date.now() - 82800000).toISOString(),
              rotateSeconds: 30,
              isActive: false,
              attendanceCount: 28,
              totalStudents: 32
            }
          ],
          totalElements: 2,
          totalPages: 1,
          number: 0,
          size: 25
        });
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      // Mock data on error
      setSessions({
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 25
      });
    }
  }, [pageS, sessionSort, sessionSearch, getAuthHeader]);

  const fetchStudents = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: pageStu.toString(),
        size: '20',
        sortBy: studentSort.column,
        sortDir: studentSort.direction,
        ...(studentSearch && { search: studentSearch })
      });
      const response = await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.ADMIN.STUDENTS}?${params}`), {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  }, [pageStu, studentSort, studentSearch, getAuthHeader]);

  const loadingUsersRef = useRef(false);
  const loadedUsersOnceRef = useRef(false);

  const loadDashboardData = useCallback(async () => {
    if (loadingUsersRef.current) return;
    loadingUsersRef.current = true;
    setLoading(true);
    try {
      // Load dashboard stats
      const statsResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.USERS_DASHBOARD), {
        headers: getAuthHeader()
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      } else {
        console.error('Stats API failed:', statsResponse.status, statsResponse.statusText);
        setError(`Lỗi tải thống kê: ${statsResponse.status}`);
      }

      // Load users
      const usersResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.USERS), {
        headers: getAuthHeader()
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.data);
      } else {
        console.error('Users API failed:', usersResponse.status, usersResponse.statusText);
        setError(`Lỗi tải người dùng: ${usersResponse.status}`);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Lỗi kết nối tới server');
    } finally {
      setLoading(false);
      loadingUsersRef.current = false;
      loadedUsersOnceRef.current = true;
    }
  }, [getAuthHeader]);

  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/login');
      return;
    }

    if (user && user.role !== 'ADMIN') {
      navigate('/login');
      return;
    }

    if (user && user.role === 'ADMIN' && !loadedUsersOnceRef.current) {
      loadDashboardData();
    }
  }, [user, authLoading, navigate, loadDashboardData]);

  // Load data based on active tab
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;

    if (tab === 'sessions') {
      fetchSessions();
    } else if (tab === 'students') {
      fetchStudents();
    } else if (tab === 'users') {
      loadDashboardData(); // Load users
    }
  }, [tab, user, fetchSessions, fetchStudents, loadDashboardData]);

  const handleCreateUser = async () => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.USERS), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(newUser)
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess('Tạo tài khoản thành công');
        setCreateUserDialog(false);
        setNewUser({
          username: '',
          password: '',
          hoTen: '',
          email: '',
          role: 'GIANGVIEN',
          khoa: '',
          boMon: ''
        });
        loadDashboardData();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Lỗi tạo tài khoản');
    }
  };

  const handleToggleUserStatus = async (userId: number) => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.USERS_TOGGLE_STATUS(userId)), {
        method: 'POST',
        headers: getAuthHeader()
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Cập nhật trạng thái thành công');
        loadDashboardData();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Lỗi cập nhật trạng thái');
    }
  };

  // Student CRUD functions
  const createStudent = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.STUDENTS), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(studentForm)
      });

      if (response.ok) {
        setStudentForm({});
        setPageStu(0);
        fetchStudents();
        setSuccess('Tạo sinh viên thành công');
      } else {
        setError('Lỗi tạo sinh viên');
      }
    } catch (error) {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  const updateStudent = async () => {
    if (!editingStudent) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/students/${editingStudent.mssv}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(editingStudent)
      });

      if (response.ok) {
        setEditingStudent(null);
        fetchStudents();
        setSuccess('Cập nhật sinh viên thành công');
      } else {
        setError('Lỗi cập nhật sinh viên');
      }
    } catch (error) {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  const deleteStudent = async (mssv: string) => {
    if (!confirm('Bạn có chắc muốn xóa sinh viên này?')) return;

    try {
      const response = await fetch(`/api/admin/students/${mssv}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });

      if (response.ok) {
        fetchStudents();
        setSuccess('Xóa sinh viên thành công');
      } else {
        setError('Lỗi xóa sinh viên');
      }
    } catch (error) {
      setError('Lỗi kết nối');
    }
  };

  const importStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8082/api/admin/students/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          ...getAuthHeader()
        },
        body: csvText
      });

      if (response.ok) {
        setCsvText('');
        setPageStu(0);
        fetchStudents();
        setSuccess('Import sinh viên thành công');
      } else {
        setError('Lỗi import sinh viên');
      }
    } catch (error) {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
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
    <ProfessionalLayout
      headerProps={{
        title: 'Bảng điều khiển quản trị',
        subtitle: 'Tổng quan hệ thống & thống kê',
        user: user ? { name: user.hoTen, role: user.role } : undefined,
        onLogout: handleLogout,
        showActions: true
      }}
    >
      <Box>
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
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              value="dashboard"
              label="Dashboard"
              icon={<Dashboard />}
              iconPosition="start"
              sx={{ textTransform: 'none' }}
            />
            <Tab
              value="sessions"
              label="Quản lý phiên"
              icon={<School />}
              iconPosition="start"
              sx={{ textTransform: 'none' }}
            />
            <Tab
              value="students"
              label="Quản lý sinh viên"
              icon={<People />}
              iconPosition="start"
              sx={{ textTransform: 'none' }}
            />
            <Tab
              value="users"
              label="Quản lý người dùng"
              icon={<AdminPanelSettings />}
              iconPosition="start"
              sx={{ textTransform: 'none' }}
            />
          </Tabs>
        </Paper>

        <Box p={3}>
          {/* Dashboard Tab */}
          {tab === 'dashboard' && (
            <Fade in={tab === 'dashboard'}>
              <Box>
                <StaggerContainer>
                  {/* Stats Cards */}
                  <StaggerItem>
                    <Grid container spacing={3} mb={4}>
                      <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                          title="Tổng người dùng"
                          value={stats?.users?.total || 0}
                          icon={<People />}
                          color="primary"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                          title="Giảng viên"
                          value={stats?.users?.giangVien || 0}
                          icon={<School />}
                          color="secondary"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                          title="Phiên điểm danh"
                          value={stats?.sessions?.total || 0}
                          icon={<Assessment />}
                          color="info"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                          title="Sinh viên"
                          value={stats?.students?.total || 0}
                          icon={<People />}
                          color="success"
                        />
                      </Grid>
                    </Grid>
                  </StaggerItem>

                  {/* Quick Charts */}
                  <StaggerItem>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={8}>
                        <ChartCard
                          title="Tổng quan hệ thống"
                          subtitle="Người dùng, phiên, sinh viên"
                          type="bar"
                          height={260}
                          data={[
                            { label: 'Người dùng', value: stats?.users?.total || 0 },
                            { label: 'Phiên', value: stats?.sessions?.total || 0 },
                            { label: 'Sinh viên', value: stats?.students?.total || 0 }
                          ]}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <ChartCard
                          title="Cơ cấu người dùng"
                          type="pie"
                          height={260}
                          data={[
                            { label: 'Admin', value: stats?.users?.admins || 0 },
                            { label: 'Giảng viên', value: stats?.users?.giangVien || 0 }
                          ]}
                        />
                      </Grid>
                    </Grid>
                  </StaggerItem>
                </StaggerContainer>
              </Box>
            </Fade>
          )}

          {/* Users Tab */}
          {tab === 'users' && (
            <Fade in={tab === 'users'}>
              <Box>
                <StaggerContainer>
                  <StaggerItem>
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                          <Typography variant="h5" fontWeight={600}>
                            Quản lý người dùng
                          </Typography>
                          <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => setCreateUserDialog(true)}
                          >
                            Tạo tài khoản
                          </Button>
                        </Box>

                        <TableContainer component={Paper} variant="outlined">
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Tên đăng nhập</TableCell>
                                <TableCell>Họ tên</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Vai trò</TableCell>
                                <TableCell>Khoa/Bộ môn</TableCell>
                                <TableCell>Trạng thái</TableCell>
                                <TableCell>Thao tác</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {users.map((user) => (
                                <TableRow key={user.id}>
                                  <TableCell>{user.username}</TableCell>
                                  <TableCell>{user.hoTen}</TableCell>
                                  <TableCell>{user.email}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={user.role}
                                      color={user.role === 'ADMIN' ? 'primary' : 'secondary'}
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {user.khoa && (
                                      <Typography variant="body2">
                                        {user.khoa}
                                        {user.boMon && ` - ${user.boMon}`}
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={user.isActive ? 'Hoạt động' : 'Khóa'}
                                      color={user.isActive ? 'success' : 'error'}
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <IconButton
                                      onClick={() => handleToggleUserStatus(user.id)}
                                      color={user.isActive ? 'error' : 'success'}
                                      size="small"
                                    >
                                      {user.isActive ? <Block /> : <CheckCircle />}
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                </StaggerContainer>
              </Box>
            </Fade>
          )}

          {/* Sessions Tab */}
          {tab === 'sessions' && (
            <Fade in={tab === 'sessions'}>
              <Box>
                <StaggerContainer>
                  <StaggerItem>
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                          <Typography variant="h5" fontWeight={600}>
                            Quản lý phiên điểm danh
                          </Typography>
                          <Stack direction="row" spacing={2}>
                            <TextField
                              size="small"
                              placeholder="Tìm kiếm theo lớp..."
                              value={sessionSearch}
                              onChange={(e) => setSessionSearch(e.target.value)}
                              sx={{ width: 250 }}
                            />
                            <Button
                              variant="outlined"
                              startIcon={<Refresh />}
                              onClick={fetchSessions}
                            >
                              Làm mới
                            </Button>
                          </Stack>
                        </Box>

                        {sessions?.content && sessions.content.length > 0 ? (
                          <TableContainer component={Paper} variant="outlined">
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Session ID</TableCell>
                                  <TableCell>Lớp học</TableCell>
                                  <TableCell>Thời gian bắt đầu</TableCell>
                                  <TableCell>Thời gian kết thúc</TableCell>
                                  <TableCell>Trạng thái</TableCell>
                                  <TableCell>Điểm danh</TableCell>
                                  <TableCell>Thao tác</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {sessions.content.map((session) => (
                                  <TableRow key={session.sessionId}>
                                    <TableCell>
                                      <Typography variant="body2" fontFamily="monospace">
                                        {session.sessionId}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Chip label={session.maLop} color="primary" size="small" />
                                    </TableCell>
                                    <TableCell>
                                      {new Date(session.startAt).toLocaleString('vi-VN')}
                                    </TableCell>
                                    <TableCell>
                                      {new Date(session.endAt).toLocaleString('vi-VN')}
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        label={session.isActive ? 'Đang hoạt động' : 'Đã kết thúc'}
                                        color={session.isActive ? 'success' : 'default'}
                                        size="small"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2">
                                        {session.attendanceCount || 0}/{session.totalStudents || 0}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Stack direction="row" spacing={1}>
                                        <Tooltip title="Xem chi tiết">
                                          <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => navigate(`/admin?session=${session.sessionId}`)}
                                          >
                                            <Visibility />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="QR Code">
                                          <IconButton
                                            size="small"
                                            color="secondary"
                                          >
                                            <QrCode />
                                          </IconButton>
                                        </Tooltip>
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
                            <Typography variant="body2" color="textSecondary" mb={2}>
                              Các phiên điểm danh sẽ hiển thị ở đây
                            </Typography>
                            <Button
                              variant="contained"
                              startIcon={<Add />}
                              onClick={() => navigate('/admin')}
                            >
                              Tạo phiên mới
                            </Button>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </StaggerItem>
                </StaggerContainer>
              </Box>
            </Fade>
          )}

          {/* Students Tab */}
          {tab === 'students' && (
            <Fade in={tab === 'students'}>
              <Box>
                <StaggerContainer>
                  <StaggerItem>
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                          <Typography variant="h5" fontWeight={600}>
                            Quản lý sinh viên
                          </Typography>
                          <Stack direction="row" spacing={2}>
                            <TextField
                              size="small"
                              placeholder="Tìm kiếm sinh viên..."
                              value={studentSearch}
                              onChange={(e) => setStudentSearch(e.target.value)}
                              sx={{ width: 250 }}
                            />
                            <Button
                              variant="outlined"
                              startIcon={<Refresh />}
                              onClick={fetchStudents}
                            >
                              Làm mới
                            </Button>
                            <Button
                              variant="contained"
                              startIcon={<Add />}
                              onClick={() => setStudentForm({ mssv: '', hoTen: '', maLop: '' })}
                            >
                              Thêm sinh viên
                            </Button>
                          </Stack>
                        </Box>

                        {/* Add Student Form */}
                        {Object.keys(studentForm).length > 0 && (
                          <Card variant="outlined" sx={{ mb: 3, bgcolor: 'grey.50' }}>
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                {editingStudent ? 'Chỉnh sửa sinh viên' : 'Thêm sinh viên mới'}
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                  <TextField
                                    fullWidth
                                    label="MSSV"
                                    value={studentForm.mssv || ''}
                                    onChange={(e) => setStudentForm(prev => ({ ...prev, mssv: e.target.value }))}
                                    disabled={!!editingStudent}
                                  />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                  <TextField
                                    fullWidth
                                    label="Họ tên"
                                    value={studentForm.hoTen || ''}
                                    onChange={(e) => setStudentForm(prev => ({ ...prev, hoTen: e.target.value }))}
                                  />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                  <TextField
                                    fullWidth
                                    label="Mã lớp"
                                    value={studentForm.maLop || ''}
                                    onChange={(e) => setStudentForm(prev => ({ ...prev, maLop: e.target.value }))}
                                  />
                                </Grid>
                              </Grid>
                              <Stack direction="row" spacing={2} mt={2}>
                                <Button
                                  variant="contained"
                                  onClick={editingStudent ? updateStudent : createStudent}
                                  disabled={loading}
                                >
                                  {editingStudent ? 'Cập nhật' : 'Thêm'}
                                </Button>
                                <Button
                                  variant="outlined"
                                  onClick={() => {
                                    setStudentForm({});
                                    setEditingStudent(null);
                                  }}
                                >
                                  Hủy
                                </Button>
                              </Stack>
                            </CardContent>
                          </Card>
                        )}

                        {/* Import CSV Section */}
                        <Card variant="outlined" sx={{ mb: 3, bgcolor: 'info.50' }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Import sinh viên từ CSV
                            </Typography>
                            <TextField
                              fullWidth
                              multiline
                              rows={4}
                              placeholder="MSSV,Họ tên,Mã lớp&#10;20210001,Nguyễn Văn A,IT4409&#10;20210002,Trần Thị B,IT4409"
                              value={csvText}
                              onChange={(e) => setCsvText(e.target.value)}
                              sx={{ mb: 2 }}
                            />
                            <Button
                              variant="contained"
                              startIcon={<FileDownload />}
                              onClick={importStudents}
                              disabled={!csvText.trim() || loading}
                            >
                              Import CSV
                            </Button>
                          </CardContent>
                        </Card>

                        {students?.content && students.content.length > 0 ? (
                          <TableContainer component={Paper} variant="outlined">
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>MSSV</TableCell>
                                  <TableCell>Họ tên</TableCell>
                                  <TableCell>Mã lớp</TableCell>
                                  <TableCell>Thao tác</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {students.content.map((student) => (
                                  <TableRow key={student.mssv}>
                                    <TableCell>
                                      <Typography variant="body2" fontFamily="monospace">
                                        {student.mssv}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>{student.hoTen}</TableCell>
                                    <TableCell>
                                      <Chip label={student.maLop} color="primary" size="small" />
                                    </TableCell>
                                    <TableCell>
                                      <Stack direction="row" spacing={1}>
                                        <Tooltip title="Chỉnh sửa">
                                          <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => {
                                              setEditingStudent(student);
                                              setStudentForm(student);
                                            }}
                                          >
                                            <Edit />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Xóa">
                                          <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => deleteStudent(student.mssv)}
                                          >
                                            <Delete />
                                          </IconButton>
                                        </Tooltip>
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
                              Chưa có sinh viên nào
                            </Typography>
                            <Typography variant="body2" color="textSecondary" mb={2}>
                              Thêm sinh viên để bắt đầu quản lý
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </StaggerItem>
                </StaggerContainer>
              </Box>
            </Fade>
          )}
        </Box>
      </Box>

      {/* Create User Dialog */}
      <Dialog open={createUserDialog} onClose={() => setCreateUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tạo tài khoản mới</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Tên đăng nhập"
              value={newUser.username}
              onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Mật khẩu"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Họ tên"
              value={newUser.hoTen}
              onChange={(e) => setNewUser(prev => ({ ...prev, hoTen: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Vai trò</InputLabel>
              <Select
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                label="Vai trò"
              >
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="GIANGVIEN">Giảng viên</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Khoa"
              value={newUser.khoa}
              onChange={(e) => setNewUser(prev => ({ ...prev, khoa: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Bộ môn"
              value={newUser.boMon}
              onChange={(e) => setNewUser(prev => ({ ...prev, boMon: e.target.value }))}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateUserDialog(false)}>Hủy</Button>
          <Button onClick={handleCreateUser} variant="contained">Tạo</Button>
        </DialogActions>
      </Dialog>
    </ProfessionalLayout>
  );
};
