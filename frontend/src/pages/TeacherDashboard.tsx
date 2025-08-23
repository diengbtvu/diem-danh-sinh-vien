import React, { useState, useEffect, useCallback } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Tabs,
  Tab,
  Fade,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
  TablePagination,
  Snackbar
} from '@mui/material';
import {
  Dashboard,
  School,
  Assessment,
  Settings,
  ExitToApp,
  Add,
  Visibility,
  Person,
  Edit,
  Delete,
  QrCode2,
  QrCode,
  People,
  Refresh,
  Upload,
  Download
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { buildApiUrl, API_CONFIG } from '../config/api';
import { QRWidget } from '../components/QRWidget';

// Animation components
const AnimatedPage = React.forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  ({ children }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  )
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
  students: {
    total: number;
  };
  attendances: {
    total: number;
  };
}

interface ClassInfo {
  maLop: string;
  tenLop: string;
  moTa?: string;
  createdByUsername: string;
  createdAt: string;
  updatedAt: string;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const TeacherDashboard: React.FC = () => {
  const { user, logout, getAuthHeader, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Tab state
  const [tab, setTab] = useState<'dashboard' | 'sessions' | 'students' | 'classes'>('dashboard');

  // Data states
  const [sessions, setSessions] = useState<Page<Session> | null>(null);
  const [students, setStudents] = useState<Page<Student> | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [classes, setClasses] = useState<Page<ClassInfo> | null>(null);
  const [teacherClasses, setTeacherClasses] = useState<string[]>([]);
  const [allClasses] = useState<string[]>(['IT4409', 'IT4410', 'IT4411', 'IT4412', 'IT4413', 'IT4414', 'IT4415']);

  // UI states
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination states
  const [pageS, setPageS] = useState(0);
  const [pageStu, setPageStu] = useState(0);
  const [pageClass, setPageClass] = useState(0);

  // Search states
  const [sessionSearch, setSessionSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [classSearch, setClassSearch] = useState('');

  // Sort states
  const [sessionSort, setSessionSort] = useState({ column: 'startAt', direction: 'desc' });
  const [studentSort, setStudentSort] = useState({ column: 'hoTen', direction: 'asc' });
  const [classSort, setClassSort] = useState({ column: 'maLop', direction: 'asc' });

  // Create session states
  const [sessionForm, setSessionForm] = useState<any>({});
  const [studentForm, setStudentForm] = useState<any>({});
  const [classForm, setClassForm] = useState<any>({});

  // Edit states
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [editSessionDialog, setEditSessionDialog] = useState(false);

  // Dialog states
  const [createClassDialog, setCreateClassDialog] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // QR Code states
  const [qrSessionId, setQrSessionId] = useState('');
  const [qrAUrl, setQrAUrl] = useState('');
  const [qr2Active, setQr2Active] = useState(false);
  const [qr2RemainMs, setQr2RemainMs] = useState(0);
  const [qrBData, setQrBData] = useState('');

  // CSV import
  const [csvText, setCsvText] = useState('');

  useEffect(() => {
    console.log('TeacherDashboard: Current user:', user);
    console.log('TeacherDashboard: isLoading:', authLoading);

    if (!user && !authLoading) {
      console.log('TeacherDashboard: No user and not loading, redirecting to login');
      navigate('/login');
      return;
    }

    // Allow both ADMIN and GIANGVIEN to access
    if (user && user.role !== 'ADMIN' && user.role !== 'GIANGVIEN') {
      console.log('TeacherDashboard: User is not admin or teacher, redirecting to login');
      navigate('/login');
      return;
    }

    if (user && (user.role === 'ADMIN' || user.role === 'GIANGVIEN')) {
      console.log('TeacherDashboard: User has access, loading data');
      loadDashboardData();
    }
  }, [user, authLoading, navigate]);

  // Fetch functions - use appropriate APIs based on user role
  const fetchSessions = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: pageS.toString(),
        size: '25',
        sortBy: sessionSort.column,
        sortDir: sessionSort.direction,
        ...(sessionSearch && { search: sessionSearch })
      });

      let endpoint;
      if (user?.role === 'GIANGVIEN') {
        endpoint = buildApiUrl(`${API_CONFIG.ENDPOINTS.TEACHER.SESSIONS}?${params}`);
      } else {
        endpoint = buildApiUrl(`${API_CONFIG.ENDPOINTS.ADMIN.SESSIONS}?${params}`);
      }

      const response = await fetch(endpoint, {
        headers: getAuthHeader()
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched sessions data:', data);
        console.log('Sessions content:', data.content);
        if (data.content && data.content.length > 0) {
          console.log('First session isActive:', data.content[0].isActive);
        }
        setSessions(data);
      } else {
        console.error('Failed to fetch sessions');
        setError('Không thể tải danh sách phiên');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Lỗi tải danh sách phiên');
    }
  }, [pageS, sessionSearch, sessionSort, getAuthHeader, user?.role]);

  const fetchStudents = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: pageStu.toString(),
        size: '20',
        sortBy: studentSort.column,
        sortDir: studentSort.direction,
        ...(studentSearch && { search: studentSearch })
      });

      let endpoint;
      if (user?.role === 'GIANGVIEN') {
        // Teacher can only see students in their classes
        endpoint = buildApiUrl(`${API_CONFIG.ENDPOINTS.TEACHER.STUDENTS}?${params}`);
      } else {
        endpoint = buildApiUrl(`${API_CONFIG.ENDPOINTS.ADMIN.STUDENTS}?${params}`);
      }

      const response = await fetch(endpoint, {
        headers: getAuthHeader()
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      } else {
        console.error('Failed to fetch students');
        setError('Không thể tải danh sách sinh viên');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Lỗi tải danh sách sinh viên');
    }
  }, [pageStu, studentSearch, studentSort, getAuthHeader, user?.role]);

  const loadTeacherClasses = useCallback(async () => {
    if (user?.role === 'GIANGVIEN') {
      try {
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.TEACHER.CLASSES_CODES), {
          headers: getAuthHeader()
        });
        if (response.ok) {
          const data = await response.json();
          setTeacherClasses(data.classes || []);
        } else {
          console.error('Failed to load teacher classes');
        }
      } catch (error) {
        console.error('Error loading teacher classes:', error);
      }
    }
  }, [getAuthHeader, user?.role]);

  const fetchClasses = useCallback(async () => {
    if (user?.role !== 'GIANGVIEN') return;

    console.log('fetchClasses: Starting to fetch classes');
    try {
      const params = new URLSearchParams({
        page: pageClass.toString(),
        size: '20',
        sortBy: classSort.column,
        sortDir: classSort.direction,
        ...(classSearch && { search: classSearch })
      });

      const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.TEACHER.CLASSES}?${params}`);
      console.log('fetchClasses: Fetching from URL:', url);

      const response = await fetch(url, {
        headers: getAuthHeader()
      });

      console.log('fetchClasses: Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('fetchClasses: Received data:', data);
        setClasses(data);
      } else {
        console.error('Failed to fetch classes');
        setError('Không thể tải danh sách lớp');
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError('Lỗi tải danh sách lớp');
    }
  }, [pageClass, classSearch, classSort, getAuthHeader, user?.role]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      if (user?.role === 'GIANGVIEN') {
        // Load teacher dashboard stats
        const statsResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.TEACHER.DASHBOARD), {
          headers: getAuthHeader()
        });
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          console.log('Teacher stats received:', statsData);
          // Convert teacher stats to dashboard format
          setStats({
            users: { total: 1, active: 1, admins: 0, giangVien: 1 },
            sessions: { total: statsData.stats?.totalSessions || 0 },
            students: { total: statsData.stats?.totalStudents || 0 },
            attendances: { total: statsData.stats?.totalAttendances || 0 }
          });
        } else {
          console.error('Teacher stats API failed:', statsResponse.status, statsResponse.statusText);
          // Use fallback stats if API fails
          setStats({
            users: { total: 1, active: 1, admins: 0, giangVien: 1 },
            sessions: { total: 0 },
            students: { total: 0 },
            attendances: { total: 0 }
          });
        }


        // Load teacher classes
        await loadTeacherClasses();
      } else if (user?.role === 'ADMIN') {
        // Load dashboard stats for admin
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

        // Admin users management removed from teacher dashboard
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Lỗi kết nối tới server');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, user?.role, loadTeacherClasses]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Session CRUD functions
  const createSession = async () => {
    if (!sessionForm.maLop) {
      setError('Vui lòng nhập mã lớp');
      return;
    }

    setLoading(true);
    try {
      let endpoint, body;

      if (user?.role === 'GIANGVIEN') {
        // Teachers use simple session creation
        endpoint = buildApiUrl('/api/sessions/simple');
        body = JSON.stringify({
          maLop: sessionForm.maLop,
          durationMinutes: sessionForm.durationMinutes || 30
        });
      } else {
        // Admins use full session creation
        endpoint = buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.SESSIONS);
        body = JSON.stringify(sessionForm);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: body
      });

      if (response.ok) {
        const result = await response.json();
        setSessionForm({});
        setPageS(0);
        fetchSessions();
        setSuccess(`Tạo phiên thành công: ${result.sessionId || 'Thành công'}`);

        // Tự động mở QR modal cho session mới
        if (result.sessionId) {
          // Play success sound (optional)
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
            audio.volume = 0.3;
            audio.play().catch(() => {}); // Ignore errors
          } catch (e) {}

          setTimeout(() => {
            handleShowQR(result.sessionId);
          }, 500); // Delay nhỏ để UI cập nhật
        }
      } else {
        const errorText = await response.text();
        setError(errorText || 'Lỗi tạo phiên');
      }
    } catch (error) {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  // Student CRUD functions
  const createStudent = async () => {
    if (!studentForm.mssv || !studentForm.hoTen || !studentForm.maLop) {
      setError('Vui lòng điền đầy đủ thông tin sinh viên');
      return;
    }

    setLoading(true);
    try {
      let endpoint;
      if (user?.role === 'GIANGVIEN') {
        // Teachers can create students for their classes
        endpoint = buildApiUrl(API_CONFIG.ENDPOINTS.TEACHER.STUDENTS);
      } else {
        // Admins use admin endpoint
        endpoint = buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.STUDENTS);
      }

      const response = await fetch(endpoint, {
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
        const errorText = await response.text();
        setError(errorText || 'Lỗi tạo sinh viên');
      }
    } catch (error) {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  const importStudents = async () => {
    if (!csvText.trim()) {
      setError('Vui lòng nhập dữ liệu CSV');
      return;
    }

    setLoading(true);
    try {
      let endpoint;
      if (user?.role === 'GIANGVIEN') {
        // Teachers can import students for their classes
        endpoint = buildApiUrl(API_CONFIG.ENDPOINTS.TEACHER.STUDENTS_IMPORT);
      } else {
        // Admins use admin endpoint
        endpoint = buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.STUDENTS_IMPORT);
      }

      const response = await fetch(endpoint, {
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
        const errorText = await response.text();
        setError(errorText || 'Lỗi import sinh viên');
      }
    } catch (error) {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSession = (sessionId: string) => {
    navigate(`/attendance-detail?sessionId=${sessionId}`);
  };

  const handleShowQR = (sessionId: string) => {
    console.log('handleShowQR called with sessionId:', sessionId);
    setQrSessionId(sessionId);
    setQrModalOpen(true);
  };

  const handleRefreshQR = () => {
    // Force refresh QR data by clearing and re-setting
    const currentSessionId = qrSessionId;
    setQrSessionId('');
    setQrAUrl('');
    setQr2Active(false);
    setQrBData('');
    setTimeout(() => {
      setQrSessionId(currentSessionId);
    }, 100);
  };

  // Class CRUD functions
  const handleCreateClassClick = () => {
    setClassForm({});
    setCreateClassDialog(true);
  };

  const createClass = async () => {
    if (!classForm.maLop || !classForm.tenLop) {
      setError('Vui lòng điền đầy đủ mã lớp và tên lớp');
      return;
    }

    console.log('createClass: Starting to create class with data:', classForm);
    setLoading(true);
    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.TEACHER.CLASSES);
      console.log('createClass: Posting to URL:', url);

      // Trim payload to avoid backend 400 due to whitespace-only
      const payload = {
        maLop: String(classForm.maLop).trim(),
        tenLop: String(classForm.tenLop).trim(),
        ...(classForm.moTa !== undefined ? { moTa: String(classForm.moTa).trim() } : {})
      };

      if (!payload.maLop || !payload.tenLop) {
        setError('Mã lớp và tên lớp không được để trống');
        setLoading(false);
        return;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(payload)
      });

      console.log('createClass: Response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('createClass: Success response:', responseData);

        setClassForm({});
        setCreateClassDialog(false);
        setPageClass(0);

        // Refresh data
        console.log('createClass: Refreshing classes and dropdown');
        await fetchClasses();
        await loadTeacherClasses(); // Refresh dropdown list

        setSuccess('Tạo lớp thành công');
      } else {
        let message = 'Lỗi tạo lớp';
        try {
          const text = await response.text();
          if (text) message = text;
        } catch {}
        if (response.status === 409) {
          message = message || 'Mã lớp đã tồn tại';
        } else if (response.status === 400) {
          message = message || 'Thiếu mã lớp hoặc tên lớp';
        }
        console.error('createClass: Error response:', message);
        setError(message);
      }
    } catch (error) {
      console.error('createClass: Exception:', error);
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  const deleteClass = async (maLop: string) => {
    if (!confirm(`Bạn có chắc muốn xóa lớp ${maLop}?`)) return;

    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.TEACHER.CLASSES}/${maLop}`), {
        method: 'DELETE',
        headers: getAuthHeader()
      });

      if (response.ok) {
        fetchClasses();
        loadTeacherClasses(); // Refresh dropdown list
        setSuccess('Xóa lớp thành công');
      } else {
        setError('Lỗi xóa lớp');
      }
    } catch (error) {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'GIANGVIEN')) return;

    if (tab === 'sessions') {
      fetchSessions();
    } else if (tab === 'students') {
      fetchStudents();
    } else if (tab === 'classes') {
      fetchClasses();
    }
  }, [tab, user, fetchSessions, fetchStudents, fetchClasses]);

  // QR polling effect
  useEffect(() => {
    console.log('QR polling effect triggered, qrSessionId:', qrSessionId);
    if (!qrSessionId) return;

    let active = true;
    const tick = async () => {
      if (!active) return;
      try {
        const resp = await fetch(`/api/sessions/${qrSessionId}/status`, {
          headers: getAuthHeader()
        });
        const json = await resp.json();
        console.log('QR status response:', json);
        if (active) {
          const sessionLink = `/attend?session=${encodeURIComponent(json.sessionToken)}`;
          setQrAUrl(sessionLink);
          setQr2Active(!!json.qr2Active);
          setQr2RemainMs(json.validForMs || 0);
          setQrBData(json.rotatingToken || '');
          console.log('QR state updated:', { sessionLink, qr2Active: !!json.qr2Active });
        }
      } catch (err) {
        console.log('QR polling error:', err);
      }
    };
    tick();
    const h = setInterval(tick, 1000);
    return () => {
      active = false;
      clearInterval(h);
    };
  }, [qrSessionId, getAuthHeader]);

  // Refresh classes when search or pagination changes
  useEffect(() => {
    if (tab === 'classes' && user?.role === 'GIANGVIEN') {
      fetchClasses();
    }
  }, [pageClass, classSearch, classSort, tab, user?.role, fetchClasses]);

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
    <AnimatedPage>
      {/* App Bar */}
      <AppBar position="static" elevation={0} sx={{ boxShadow: 'none', border: 'none', borderRadius: 0 }}>
        <Toolbar sx={{ borderRadius: 0 }}>
          <School sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {user?.role === 'ADMIN' ? 'Dashboard Quản trị' : 'Dashboard Giảng viên'}
          </Typography>
          
          <Box display="flex" alignItems="center" gap={2}>
            <Box textAlign="right">
              <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                {user?.hoTen}
              </Typography>
              <Typography variant="caption" sx={{ color: 'white', opacity: 0.7 }}>
                {user?.khoa} - {user?.boMon}
              </Typography>
            </Box>
            
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ color: 'white' }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user?.hoTen?.charAt(0)}
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem onClick={() => navigate('/profile')}>
                <Person sx={{ mr: 1 }} /> Hồ sơ
              </MenuItem>
              <MenuItem onClick={() => navigate('/settings')}>
                <Settings sx={{ mr: 1 }} /> Cài đặt
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 1 }} /> Đăng xuất
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

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
              label="Phiên điểm danh"
              icon={<School />}
              iconPosition="start"
              sx={{ textTransform: 'none' }}
            />
            <Tab
              value="students"
              label="Sinh viên"
              icon={<People />}
              iconPosition="start"
              sx={{ textTransform: 'none' }}
            />
            {user?.role === 'GIANGVIEN' && (
              <Tab
                value="classes"
                label="Quản lý lớp"
                icon={<School />}
                iconPosition="start"
                sx={{ textTransform: 'none' }}
              />
            )}

          </Tabs>
        </Paper>

        <Box p={3}>
          {/* Dashboard Tab */}
          {tab === 'dashboard' && (
            <Fade in={tab === 'dashboard'}>
              <Box>
                {/* Hero Welcome Section */}
                <StaggerContainer>
                  <StaggerItem>
                    <Card sx={{ 
                      mb: 4, 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden',
                      minHeight: 200,
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -50,
                        right: -50,
                        width: 200,
                        height: 200,
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '50%',
                        zIndex: 1
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: -30,
                        left: -30,
                        width: 150,
                        height: 150,
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '50%',
                        zIndex: 1
                      }
                    }}>
                      <CardContent sx={{ position: 'relative', zIndex: 2, p: 4 }}>
                        <Grid container spacing={3} alignItems="center">
                          <Grid item xs={12} md={8}>
                            <Box>
                              <Typography variant="h3" fontWeight={700} gutterBottom sx={{ mb: 1 }}>
                                Xin chào, {user?.hoTen}! 👋
                              </Typography>
                              <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                                {user?.role === 'ADMIN' ? 'Quản lý hệ thống điểm danh' : 'Chào mừng bạn quay trở lại với hệ thống điểm danh'}
                              </Typography>
                              <Box display="flex" gap={1} flexWrap="wrap">
                                <Chip
                                  label={`📚 ${user?.khoa}`}
                                  sx={{
                                    bgcolor: 'rgba(255,255,255,0.25)',
                                    color: 'white',
                                    fontWeight: 600,
                                    backdropFilter: 'blur(10px)'
                                  }}
                                />
                                <Chip
                                  label={`🎓 ${user?.boMon}`}
                                  sx={{
                                    bgcolor: 'rgba(255,255,255,0.25)',
                                    color: 'white',
                                    fontWeight: 600,
                                    backdropFilter: 'blur(10px)'
                                  }}
                                />
                                <Chip
                                  label={`⏰ ${new Date().toLocaleDateString('vi-VN')}`}
                                  sx={{
                                    bgcolor: 'rgba(255,255,255,0.15)',
                                    color: 'white',
                                    fontWeight: 500
                                  }}
                                />
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Box textAlign="center">
                              <Avatar
                                sx={{
                                  width: 80,
                                  height: 80,
                                  bgcolor: 'rgba(255,255,255,0.2)',
                                  fontSize: '2rem',
                                  fontWeight: 700,
                                  mx: 'auto',
                                  mb: 2,
                                  border: '3px solid rgba(255,255,255,0.3)'
                                }}
                              >
                                {user?.hoTen?.charAt(0)}
                              </Avatar>
                              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Giảng viên'}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </StaggerItem>

                  {/* Enhanced Stats Cards */}
                  <StaggerItem>
                    <Grid container spacing={3} mb={4}>
                      <Grid item xs={12} sm={6} md={4}>
                        <Card sx={{ 
                          background: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)', 
                          color: 'white',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            boxShadow: '0 20px 40px rgba(30, 136, 229, 0.4)'
                          },
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '100%',
                            height: '100%',
                            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                            opacity: 0.3
                          }
                        }}>
                          <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                              <Assessment sx={{ fontSize: 40, opacity: 0.9 }} />
                              <Typography variant="h2" fontWeight={800} sx={{ color: 'white' }}>
                                {stats?.sessions?.total || 0}
                              </Typography>
                            </Box>
                            <Typography variant="h6" fontWeight={600} sx={{ color: 'white', mb: 1 }}>
                              Tổng phiên điểm danh
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                              📈 Phiên đã tạo thành công
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <Card sx={{ 
                          background: 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)', 
                          color: 'white',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            boxShadow: '0 20px 40px rgba(67, 160, 71, 0.4)'
                          },
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '100%',
                            height: '100%',
                            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M30 30l15-15v30z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                            opacity: 0.3
                          }
                        }}>
                          <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                              <School sx={{ fontSize: 40, opacity: 0.9 }} />
                              <Typography variant="h2" fontWeight={800} sx={{ color: 'white' }}>
                                {stats?.attendances?.total || 0}
                              </Typography>
                            </Box>
                            <Typography variant="h6" fontWeight={600} sx={{ color: 'white', mb: 1 }}>
                              Tổng lượt điểm danh
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                              ✅ Điểm danh thành công
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <Card sx={{ 
                          background: 'linear-gradient(135deg, #8e24aa 0%, #6a1b9a 100%)', 
                          color: 'white',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            boxShadow: '0 20px 40px rgba(142, 36, 170, 0.4)'
                          },
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '100%',
                            height: '100%',
                            background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                            opacity: 0.3
                          }
                        }}>
                          <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                              <People sx={{ fontSize: 40, opacity: 0.9 }} />
                              <Typography variant="h2" fontWeight={800} sx={{ color: 'white' }}>
                                {stats?.students?.total || 0}
                              </Typography>
                            </Box>
                            <Typography variant="h6" fontWeight={600} sx={{ color: 'white', mb: 1 }}>
                              Tổng sinh viên
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                              👥 Sinh viên trong các lớp
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </StaggerItem>

                  {/* Quick Actions Section */}
                  <StaggerItem>
                    <Card sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
                      <CardContent sx={{ p: 4 }}>
                        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
                          🚀 Thao tác nhanh
                        </Typography>
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={6} md={3}>
                            <Button
                              fullWidth
                              variant="contained"
                              size="large"
                              startIcon={<Add />}
                              onClick={createSession}
                              sx={{
                                py: 2,
                                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #ee5a52 0%, #ff6b6b 100%)',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3)'
                                }
                              }}
                            >
                              Tạo phiên mới
                            </Button>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Button
                              fullWidth
                              variant="outlined"
                              size="large"
                              startIcon={<People />}
                              onClick={() => setTab('students')}
                              sx={{
                                py: 2,
                                borderWidth: 2,
                                '&:hover': {
                                  borderWidth: 2,
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 8px 25px rgba(25, 118, 210, 0.15)'
                                }
                              }}
                            >
                              Quản lý SV
                            </Button>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Button
                              fullWidth
                              variant="outlined"
                              size="large"
                              startIcon={<School />}
                              onClick={() => setTab('sessions')}
                              sx={{
                                py: 2,
                                borderWidth: 2,
                                '&:hover': {
                                  borderWidth: 2,
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 8px 25px rgba(25, 118, 210, 0.15)'
                                }
                              }}
                            >
                              Xem phiên
                            </Button>
                          </Grid>
                          {user?.role === 'GIANGVIEN' && (
                            <Grid item xs={12} sm={6} md={3}>
                              <Button
                                fullWidth
                                variant="outlined"
                                size="large"
                                startIcon={<Add />}
                                onClick={handleCreateClassClick}
                                sx={{
                                  py: 2,
                                  borderWidth: 2,
                                  '&:hover': {
                                    borderWidth: 2,
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 25px rgba(25, 118, 210, 0.15)'
                                  }
                                }}
                              >
                                Tạo lớp mới
                              </Button>
                            </Grid>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  </StaggerItem>

                  {/* Recent Activity */}
                  <StaggerItem>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={8}>
                        <Card sx={{ borderRadius: 3, height: '100%' }}>
                          <CardContent sx={{ p: 4 }}>
                            <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
                              📊 Tổng quan hoạt động
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Box textAlign="center" p={2} sx={{ bgcolor: 'primary.50', borderRadius: 2 }}>
                                  <Typography variant="h4" fontWeight={700} color="primary.main">
                                    {sessions?.totalElements || 0}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Phiên đã tạo
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={6}>
                                <Box textAlign="center" p={2} sx={{ bgcolor: 'success.50', borderRadius: 2 }}>
                                  <Typography variant="h4" fontWeight={700} color="success.main">
                                    {teacherClasses?.length || 0}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Lớp quản lý
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Card sx={{ 
                          borderRadius: 3, 
                          height: '100%',
                          background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
                        }}>
                          <CardContent sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="h5" fontWeight={700} gutterBottom>
                              💡 Mẹo
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                              Sử dụng QR Code xoay để tăng cường bảo mật điểm danh!
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </StaggerItem>
                </StaggerContainer>
              </Box>
            </Fade>
          )}

          {/* Sessions Tab */}
          {tab === 'sessions' && (
            <Fade in={tab === 'sessions'}>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5">
                    Phiên điểm danh
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={createSession}
                  >
                    Tạo phiên mới
                  </Button>
                </Box>

                <Card>
                  <CardContent>
                    <Stack spacing={2} mb={2}>
                      <TextField
                        label="Tìm kiếm phiên"
                        value={sessionSearch}
                        onChange={(e) => setSessionSearch(e.target.value)}
                        size="small"
                      />
                      <Stack direction="row" spacing={2}>
                        {user?.role === 'GIANGVIEN' ? (
                          <>
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                              <InputLabel>Chọn lớp</InputLabel>
                              <Select
                                value={sessionForm.maLop || ''}
                                onChange={(e) => setSessionForm({...sessionForm, maLop: e.target.value})}
                                label="Chọn lớp"
                              >
                                {teacherClasses.map((className) => (
                                  <SelectMenuItem key={className} value={className}>
                                    {className}
                                  </SelectMenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <TextField
                              label="Thời gian (phút)"
                              type="number"
                              value={sessionForm.durationMinutes || 30}
                              onChange={(e) => setSessionForm({...sessionForm, durationMinutes: Number(e.target.value)})}
                              size="small"
                              inputProps={{ min: 5, max: 180 }}
                            />
                          </>
                        ) : (
                          <>
                            <TextField
                              label="Mã lớp"
                              value={sessionForm.maLop || ''}
                              onChange={(e) => setSessionForm({...sessionForm, maLop: e.target.value})}
                              size="small"
                            />
                            <TextField
                              label="Thời gian xoay QR (giây)"
                              type="number"
                              value={sessionForm.rotateSeconds || 30}
                              onChange={(e) => setSessionForm({...sessionForm, rotateSeconds: Number(e.target.value)})}
                              size="small"
                            />
                          </>
                        )}
                      </Stack>
                    </Stack>

                    {sessions?.content && sessions.content.length > 0 ? (
                      <>
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Session ID</TableCell>
                                <TableCell>Lớp học</TableCell>
                                <TableCell>Thời gian bắt đầu</TableCell>
                                <TableCell>Thời gian kết thúc</TableCell>
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
                                    <Stack direction="row" spacing={1}>
                                      <IconButton
                                        onClick={() => handleViewSession(session.sessionId)}
                                        color="primary"
                                        size="small"
                                        title="Xem chi tiết"
                                      >
                                        <Visibility />
                                      </IconButton>
                                      {session.isActive && (
                                        <IconButton
                                          onClick={() => handleShowQR(session.sessionId)}
                                          color="success"
                                          size="small"
                                          title="Hiển thị QR Code"
                                        >
                                          <QrCode2 />
                                        </IconButton>
                                      )}
                                    </Stack>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        <TablePagination
                          component="div"
                          count={sessions.totalElements}
                          page={pageS}
                          onPageChange={(_, newPage) => setPageS(newPage)}
                          rowsPerPage={25}
                          rowsPerPageOptions={[25]}
                        />
                      </>
                    ) : (
                      <Box textAlign="center" py={4}>
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                          Chưa có phiên điểm danh nào
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {user?.role === 'GIANGVIEN'
                            ? 'Hãy tạo phiên điểm danh mới cho lớp của bạn'
                            : 'Hãy tạo phiên điểm danh mới'
                          }
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            </Fade>
          )}

          {/* Students Tab */}
          {tab === 'students' && (
            <Fade in={tab === 'students'}>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5">
                    Sinh viên
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={createStudent}
                  >
                    Tạo sinh viên
                  </Button>
                </Box>

                <Card>
                  <CardContent>
                    <Stack spacing={2} mb={2}>
                      <TextField
                        label="Tìm kiếm sinh viên"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        size="small"
                      />
                      <Stack direction="row" spacing={2}>
                        <TextField
                          label="MSSV"
                          value={studentForm.mssv || ''}
                          onChange={(e) => setStudentForm({...studentForm, mssv: e.target.value})}
                          size="small"
                        />
                        <TextField
                          label="Họ tên"
                          value={studentForm.hoTen || ''}
                          onChange={(e) => setStudentForm({...studentForm, hoTen: e.target.value})}
                          size="small"
                        />
                        {user?.role === 'GIANGVIEN' ? (
                          <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Mã lớp</InputLabel>
                            <Select
                              value={studentForm.maLop || ''}
                              onChange={(e) => setStudentForm({...studentForm, maLop: e.target.value})}
                              label="Mã lớp"
                            >
                              {teacherClasses.map((className) => (
                                <SelectMenuItem key={className} value={className}>
                                  {className}
                                </SelectMenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <TextField
                            label="Mã lớp"
                            value={studentForm.maLop || ''}
                            onChange={(e) => setStudentForm({...studentForm, maLop: e.target.value})}
                            size="small"
                          />
                        )}
                      </Stack>
                    </Stack>

                    {/* CSV Import */}
                    <Box mb={3}>
                      <Typography variant="h6" gutterBottom>
                        Import CSV
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {user?.role === 'GIANGVIEN'
                          ? 'Nhập danh sách sinh viên cho các lớp bạn quản lý. Định dạng: MSSV,Họ tên,Mã lớp'
                          : 'Nhập danh sách sinh viên. Định dạng: MSSV,Họ tên,Mã lớp'
                        }
                      </Typography>
                      <TextField
                        multiline
                        rows={4}
                        fullWidth
                        placeholder={user?.role === 'GIANGVIEN'
                          ? `20210001,Nguyễn Văn A,${teacherClasses[0] || 'IT4409'}\n20210002,Trần Thị B,${teacherClasses[0] || 'IT4409'}`
                          : 'MSSV,Họ tên,Mã lớp\n20210001,Nguyễn Văn A,IT4409\n20210002,Trần Thị B,IT4409'
                        }
                        value={csvText}
                        onChange={(e) => setCsvText(e.target.value)}
                        sx={{ mb: 2 }}
                      />
                      <Stack direction="row" spacing={2}>
                        <Button
                          variant="outlined"
                          startIcon={<Upload />}
                          onClick={importStudents}
                          disabled={!csvText.trim()}
                        >
                          Import CSV
                        </Button>
                        {user?.role === 'GIANGVIEN' && teacherClasses.length > 0 && (
                          <Typography variant="caption" color="textSecondary" sx={{ alignSelf: 'center' }}>
                            Lớp của bạn: {teacherClasses.join(', ')}
                          </Typography>
                        )}
                      </Stack>
                    </Box>

                    {students?.content && students.content.length > 0 ? (
                      <>
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>MSSV</TableCell>
                                <TableCell>Họ tên</TableCell>
                                <TableCell>Mã lớp</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {students.content.map((student) => (
                                <TableRow key={student.mssv}>
                                  <TableCell>{student.mssv}</TableCell>
                                  <TableCell>{student.hoTen}</TableCell>
                                  <TableCell>{student.maLop}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        <TablePagination
                          component="div"
                          count={students.totalElements}
                          page={pageStu}
                          onPageChange={(_, newPage) => setPageStu(newPage)}
                          rowsPerPage={20}
                          rowsPerPageOptions={[20]}
                        />
                      </>
                    ) : (
                      <Box textAlign="center" py={4}>
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                          {user?.role === 'GIANGVIEN'
                            ? 'Chưa có sinh viên nào trong các lớp của bạn'
                            : 'Chưa có sinh viên nào'
                          }
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            </Fade>
          )}

          {/* Classes Tab */}
          {tab === 'classes' && user?.role === 'GIANGVIEN' && (
            <Fade in={tab === 'classes'}>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5">
                    Quản lý lớp
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleCreateClassClick}
                  >
                    Tạo lớp mới
                  </Button>
                </Box>

                <Card>
                  <CardContent>
                    <Stack spacing={2} mb={2}>
                      <TextField
                        label="Tìm kiếm lớp"
                        value={classSearch}
                        onChange={(e) => setClassSearch(e.target.value)}
                        size="small"
                        placeholder="Tìm theo mã lớp hoặc tên lớp..."
                      />
                    </Stack>

                    {(() => {
                      console.log('Classes state:', classes);
                      console.log('Classes content:', classes?.content);
                      console.log('Classes content length:', classes?.content?.length);
                      return null;
                    })()}
                    {classes?.content && classes.content.length > 0 ? (
                      <>
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Mã lớp</TableCell>
                                <TableCell>Tên lớp</TableCell>
                                <TableCell>Mô tả</TableCell>
                                <TableCell>Ngày tạo</TableCell>
                                <TableCell>Thao tác</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {classes.content.map((classInfo) => (
                                <TableRow key={classInfo.maLop}>
                                  <TableCell>{classInfo.maLop}</TableCell>
                                  <TableCell>{classInfo.tenLop}</TableCell>
                                  <TableCell>{classInfo.moTa || '-'}</TableCell>
                                  <TableCell>
                                    {new Date(classInfo.createdAt).toLocaleDateString('vi-VN')}
                                  </TableCell>
                                  <TableCell>
                                    <Stack direction="row" spacing={1}>
                                      <IconButton
                                        onClick={() => deleteClass(classInfo.maLop)}
                                        color="error"
                                        size="small"
                                      >
                                        <Delete />
                                      </IconButton>
                                    </Stack>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        <TablePagination
                          component="div"
                          count={classes.totalElements}
                          page={pageClass}
                          onPageChange={(_, newPage) => setPageClass(newPage)}
                          rowsPerPage={20}
                          rowsPerPageOptions={[20]}
                        />
                      </>
                    ) : (
                      <Box textAlign="center" py={4}>
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                          Chưa có lớp nào
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Hãy tạo lớp đầu tiên để bắt đầu quản lý sinh viên và phiên điểm danh
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            </Fade>
          )}


        </Box>

        {/* Snackbar for notifications */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={4000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={() => setSuccess('')}>
            {success}
          </Alert>
        </Snackbar>
      </Box>

      {/* QR Modal Dialog */}
      <Dialog
        open={qrModalOpen}
        onClose={() => {
          setQrModalOpen(false);
          setQrSessionId('');
          setQrAUrl('');
        }}
        maxWidth="md"
        fullWidth
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minHeight: '70vh',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2
        }}>
          <QrCode sx={{ color: 'primary.main', fontSize: 32 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              QR Code điểm danh
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Session ID: {qrSessionId}
            </Typography>
          </Box>
          <Chip
            label={qr2Active ? 'QR B đang hoạt động' : 'Chờ sinh viên'}
            color={qr2Active ? 'success' : 'warning'}
            size="small"
          />
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={4}>
            {/* Left side - Instructions */}
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                    Hướng dẫn sử dụng
                  </Typography>
                  <Stack spacing={2}>
                    <Alert severity="info" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Bước 1: QR A - Mã cố định
                      </Typography>
                      <Typography variant="body2">
                        Sinh viên quét mã QR A để vào trang điểm danh
                      </Typography>
                    </Alert>

                    <Alert severity="success" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Bước 2: QR B - Mã xoay
                      </Typography>
                      <Typography variant="body2">
                        {qr2Active
                          ? `QR B đã thay thế QR A (còn ${Math.ceil(qr2RemainMs / 1000)} giây)`
                          : 'Chờ sinh viên quét QR A để kích hoạt QR B thay thế'
                        }
                      </Typography>
                    </Alert>
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Thao tác
                  </Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
                    <Button
                      variant="outlined"
                      onClick={handleRefreshQR}
                      startIcon={<Refresh />}
                      size="small"
                    >
                      Làm mới QR
                    </Button>
                    {qrAUrl && (
                      <Button
                        variant="contained"
                        color="secondary"
                        href={qrAUrl}
                        target="_blank"
                        startIcon={<Visibility />}
                        size="small"
                      >
                        Mở liên kết
                      </Button>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Grid>

            {/* Right side - QR Codes */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <Box sx={{ textAlign: 'center' }}>
                  {/* Hiển thị QR B khi active, ngược lại hiển thị QR A */}
                  {qr2Active && qrBData ? (
                    /* QR B - Mã xoay (thay thế hoàn toàn QR A) */
                    <Box sx={{
                      animation: 'slideInFromRight 0.5s ease-out',
                      '@keyframes slideInFromRight': {
                        '0%': {
                          opacity: 0,
                          transform: 'translateX(50px)'
                        },
                        '100%': {
                          opacity: 1,
                          transform: 'translateX(0)'
                        }
                      }
                    }}>
                      <Typography variant="subtitle1" sx={{
                        mb: 2,
                        fontWeight: 600,
                        color: 'success.main'
                      }}>
                        QR B - Mã xoay
                      </Typography>
                      <Typography variant="body2" sx={{
                        mb: 2,
                        color: 'success.dark',
                        fontWeight: 600,
                        fontSize: '1rem'
                      }}>
                        Còn {Math.ceil(qr2RemainMs / 1000)} giây
                      </Typography>
                      <QRWidget
                        data={window.location.origin + qrAUrl + '&rot=' + qrBData}
                        title=""
                        size="extra-large"
                        showCopy={true}
                        showDownload={true}
                        showRefresh={false}
                        showDataToggle={false}
                        status="active"
                        autoRefresh={Math.ceil(qr2RemainMs / 1000)}
                        sx={{ mx: 'auto' }}
                      />
                    </Box>
                  ) : (
                    /* QR A - Mã cố định */
                    <Box sx={{
                      animation: qrAUrl ? 'slideInFromLeft 0.5s ease-out' : 'none',
                      '@keyframes slideInFromLeft': {
                        '0%': {
                          opacity: 0,
                          transform: 'translateX(-50px)'
                        },
                        '100%': {
                          opacity: 1,
                          transform: 'translateX(0)'
                        }
                      }
                    }}>
                      <Typography variant="subtitle1" sx={{
                        mb: 2,
                        fontWeight: 600,
                        color: 'primary.main'
                      }}>
                        QR A - Mã cố định
                      </Typography>
                      {qrAUrl ? (
                        <QRWidget
                          data={window.location.origin + qrAUrl}
                          title=""
                          size="extra-large"
                          showCopy={true}
                          showDownload={true}
                          showRefresh={false}
                          showDataToggle={false}
                          status="active"
                          sx={{ mx: 'auto' }}
                        />
                      ) : (
                        <Box sx={{
                          width: 400,
                          height: 400,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px dashed #e0e0e0',
                          borderRadius: 2,
                          bgcolor: 'grey.50'
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            Đang tạo QR A...
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            onClick={() => {
              setQrModalOpen(false);
              setQrSessionId('');
              setQrAUrl('');
            }}
            variant="outlined"
            size="large"
          >
            Đóng
          </Button>
          <Button
            onClick={() => {
              setQrModalOpen(false);
              // Giữ QR data để hiển thị ở dưới
            }}
            variant="contained"
            size="large"
          >
            Hiển thị dưới trang
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Display Section - Old version (kept for "Show below" option) */}
      {qrSessionId && !qrModalOpen && (
        <Fade in={!!qrSessionId}>
          <Paper elevation={3} sx={{ p: 3, mt: 3, border: '2px solid', borderColor: 'primary.light' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <QrCode sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                QR Code điểm danh
              </Typography>
              <Chip
                label={qr2Active ? 'QR B đang hoạt động' : 'Chờ sinh viên'}
                color={qr2Active ? 'success' : 'warning'}
                size="small"
                sx={{ ml: 2 }}
              />
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>
                      QR A - Mã cố định
                    </Typography>
                    <Alert severity="info">
                      Sinh viên quét mã này để vào trang điểm danh
                    </Alert>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'secondary.main' }}>
                      QR B - Mã xoay
                    </Typography>
                    {qr2Active ? (
                      <Alert severity="success" sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Còn hiệu lực: {Math.ceil(qr2RemainMs / 1000)} giây
                        </Typography>
                      </Alert>
                    ) : (
                      <Alert severity="info">
                        Chờ sinh viên quét QR A để kích hoạt
                      </Alert>
                    )}
                  </Box>

                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      onClick={handleRefreshQR}
                      startIcon={<Refresh />}
                    >
                      Làm mới QR
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => { setQrSessionId(''); setQrAUrl('') }}
                    >
                      Ẩn QR
                    </Button>
                    {qrAUrl && (
                      <Button
                        variant="contained"
                        color="secondary"
                        href={qrAUrl}
                        target="_blank"
                        startIcon={<Visibility />}
                      >
                        Mở liên kết
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    {/* Hiển thị QR B khi active, ngược lại hiển thị QR A */}
                    {qr2Active && qrBData ? (
                      /* QR B - Mã xoay (thay thế hoàn toàn QR A) */
                      <Box sx={{
                        animation: 'slideInFromRight 0.5s ease-out',
                        '@keyframes slideInFromRight': {
                          '0%': {
                            opacity: 0,
                            transform: 'translateX(50px)'
                          },
                          '100%': {
                            opacity: 1,
                            transform: 'translateX(0)'
                          }
                        }
                      }}>
                        <Typography variant="subtitle1" sx={{
                          mb: 2,
                          fontWeight: 600,
                          color: 'success.main'
                        }}>
                          QR B - Mã xoay
                        </Typography>
                        <Typography variant="body1" sx={{
                          mb: 2,
                          color: 'success.dark',
                          fontWeight: 600,
                          fontSize: '1.1rem'
                        }}>
                          Còn {Math.ceil(qr2RemainMs / 1000)} giây
                        </Typography>
                        <QRWidget
                          data={window.location.origin + qrAUrl + '&rot=' + qrBData}
                          title="QR B - Mã xoay"
                          size="extra-large"
                          showCopy={true}
                          showDownload={true}
                          showRefresh={false}
                          showDataToggle={false}
                          status="active"
                          autoRefresh={Math.ceil(qr2RemainMs / 1000)}
                          sx={{ mx: 'auto' }}
                        />
                      </Box>
                    ) : (
                      /* QR A - Mã cố định */
                      <Box sx={{
                        animation: qrAUrl ? 'slideInFromLeft 0.5s ease-out' : 'none',
                        '@keyframes slideInFromLeft': {
                          '0%': {
                            opacity: 0,
                            transform: 'translateX(-50px)'
                          },
                          '100%': {
                            opacity: 1,
                            transform: 'translateX(0)'
                          }
                        }
                      }}>
                        <Typography variant="subtitle1" sx={{
                          mb: 2,
                          fontWeight: 600,
                          color: 'primary.main'
                        }}>
                          QR A - Mã cố định
                        </Typography>
                        {qrAUrl ? (
                          <QRWidget
                            data={window.location.origin + qrAUrl}
                            title="QR Code điểm danh"
                            size="extra-large"
                            showCopy={true}
                            showDownload={true}
                            showRefresh={true}
                            showDataToggle={false}
                            status="active"
                            onRefresh={handleRefreshQR}
                            sx={{ mx: 'auto' }}
                          />
                        ) : (
                          <Box sx={{
                            width: 400,
                            height: 400,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px dashed #e0e0e0',
                            borderRadius: 2,
                            bgcolor: 'grey.50'
                          }}>
                            <Typography variant="body2" color="text.secondary">
                              Đang tạo QR A...
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Fade>
      )}

      {/* Create Class Dialog */}
      <Dialog
        open={createClassDialog}
        onClose={() => setCreateClassDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Tạo lớp mới</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Mã lớp"
              value={classForm.maLop || ''}
              onChange={(e) => setClassForm({...classForm, maLop: e.target.value})}
              required
              placeholder="Ví dụ: IT4409"
              helperText="Mã lớp phải là duy nhất"
            />
            <TextField
              label="Tên lớp"
              value={classForm.tenLop || ''}
              onChange={(e) => setClassForm({...classForm, tenLop: e.target.value})}
              required
              placeholder="Ví dụ: Lập trình Web"
            />
            <TextField
              label="Mô tả"
              value={classForm.moTa || ''}
              onChange={(e) => setClassForm({...classForm, moTa: e.target.value})}
              multiline
              rows={3}
              placeholder="Mô tả về lớp học (tùy chọn)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCreateClassDialog(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            onClick={createClass}
            variant="contained"
            disabled={loading || !classForm.maLop || !classForm.tenLop}
          >
            {loading ? 'Đang tạo...' : 'Tạo lớp'}
          </Button>
        </DialogActions>
      </Dialog>

    </AnimatedPage>
  );
};
