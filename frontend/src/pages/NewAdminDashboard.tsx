import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
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
  Chip,
  IconButton,
  Stack,
  Divider
} from '@mui/material';
import {
  People,
  School,
  Assessment,
  Add,
  Edit,
  Block,
  CheckCircle,
  AdminPanelSettings,
  FileUpload,
  Refresh,
  TrendingUp,
  BarChart
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout';
import { QuickStatsCard } from '../components/admin/QuickStatsCard';
import { AttendanceStatsCard } from '../components/statistics/AttendanceStatsCard';
import { AttendanceTrendChart } from '../components/statistics/AttendanceTrendChart';
import { buildApiUrl, API_CONFIG } from '../config/api';

interface DashboardStats {
  users: { total: number; active: number; admins: number; giangVien: number };
  sessions: { total: number };
  attendances: { total: number };
  students: { total: number };
}

interface User {
  id: number;
  username: string;
  hoTen: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface Student {
  mssv: string;
  hoTen: string;
  maLop: string;
}

export const NewAdminDashboard: React.FC = () => {
  const { user, logout, getAuthHeader } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get('view') || 'overview';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialogs
  const [createUserDialog, setCreateUserDialog] = useState(false);
  const [importDialog, setImportDialog] = useState(false);

  // Forms
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    hoTen: '',
    email: '',
    role: 'GIANGVIEN'
  });
  const [csvText, setCsvText] = useState('');

  // Load data
  const loadStats = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.USERS_DASHBOARD), {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [getAuthHeader]);

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.USERS), {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }, [getAuthHeader]);

  const loadStudents = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.ADMIN.STUDENTS}?size=100`), {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data.content || []);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadStats();
    }
  }, [user, loadStats]);

  useEffect(() => {
    if (currentView === 'users') loadUsers();
    if (currentView === 'students') loadStudents();
  }, [currentView, loadUsers, loadStudents]);

  const handleCreateUser = async () => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.USERS), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(newUser)
      });
      const result = await response.json();
      if (result.success) {
        setSuccess('Tạo tài khoản thành công');
        setCreateUserDialog(false);
        setNewUser({ username: '', password: '', hoTen: '', email: '', role: 'GIANGVIEN' });
        loadUsers();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Lỗi tạo tài khoản');
    }
  };

  const handleImportStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.STUDENTS_IMPORT), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain', ...getAuthHeader() },
        body: csvText
      });
      
      if (response.ok) {
        const result = await response.json();
        setSuccess(result.message || `Import thành công ${result.imported || 0} sinh viên`);
        setCsvText('');
        setImportDialog(false);
        loadStudents();
        loadStats();
      } else {
        const errorText = await response.text();
        setError(errorText || 'Lỗi import');
      }
    } catch (error) {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: number) => {
    try {
      const response = await fetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.USERS_TOGGLE_STATUS(userId)),
        { method: 'POST', headers: getAuthHeader() }
      );
      const result = await response.json();
      if (result.success) {
        setSuccess('Cập nhật trạng thái thành công');
        loadUsers();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Lỗi cập nhật trạng thái');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Render different views
  const renderOverview = () => (
    <Box>
      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <QuickStatsCard
            title="Người dùng"
            value={stats?.users?.total || 0}
            icon={<People sx={{ fontSize: 32 }} />}
            color="#1976d2"
            subtitle={`${stats?.users?.active || 0} đang hoạt động`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickStatsCard
            title="Sinh viên"
            value={stats?.students?.total || 0}
            icon={<School sx={{ fontSize: 32 }} />}
            color="#2e7d32"
            subtitle="Toàn trường"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickStatsCard
            title="Phiên điểm danh"
            value={stats?.sessions?.total || 0}
            icon={<Assessment sx={{ fontSize: 32 }} />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickStatsCard
            title="Lượt điểm danh"
            value={stats?.attendances?.total || 0}
            icon={<TrendingUp sx={{ fontSize: 32 }} />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Thao tác nhanh
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<FileUpload />}
                onClick={() => setImportDialog(true)}
                sx={{ py: 2 }}
              >
                Import Sinh viên
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<Add />}
                onClick={() => setCreateUserDialog(true)}
                sx={{ py: 2 }}
              >
                Tạo Tài khoản
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<BarChart />}
                onClick={() => navigate('/statistics')}
                sx={{ py: 2 }}
              >
                Thống kê
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<Assessment />}
                onClick={() => navigate('/admin-dashboard?view=reports')}
                sx={{ py: 2 }}
              >
                Báo cáo
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

    </Box>
  );

  const renderUsers = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
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

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tên đăng nhập</TableCell>
                <TableCell>Họ tên</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Vai trò</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
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
                    <Chip
                      label={user.isActive ? 'Hoạt động' : 'Khóa'}
                      color={user.isActive ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
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
      </Card>
    </Box>
  );

  const renderStudents = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Quản lý sinh viên
        </Typography>
        <Button
          variant="contained"
          startIcon={<FileUpload />}
          onClick={() => setImportDialog(true)}
          color="success"
        >
          Import CSV
        </Button>
      </Box>

      <Card sx={{ borderRadius: 3, mb: 3, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            <strong>Lưu ý:</strong> Import danh sách sinh viên toàn trường. 
            MSSV trong CSV phải khớp với face label từ AI model để hệ thống tự động mapping.
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              Danh sách sinh viên ({students.length})
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Refresh />}
              onClick={loadStudents}
            >
              Làm mới
            </Button>
          </Box>
          
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>MSSV</TableCell>
                  <TableCell>Họ tên</TableCell>
                  <TableCell>Mã lớp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.slice(0, 50).map((student) => (
                  <TableRow key={student.mssv} hover>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {student.mssv}
                      </Typography>
                    </TableCell>
                    <TableCell>{student.hoTen}</TableCell>
                    <TableCell>
                      <Chip label={student.maLop} size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {students.length > 50 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Hiển thị 50/{students.length} sinh viên. Sử dụng tìm kiếm để xem thêm.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );

  const renderSessions = () => (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Quản lý phiên điểm danh
      </Typography>
      <Alert severity="info">
        Xem chi tiết phiên điểm danh tại trang Attendance Detail
      </Alert>
    </Box>
  );

  const renderReports = () => (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Báo cáo & Thống kê
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <AttendanceStatsCard 
            defaultPeriod="month"
            title="Tổng quan điểm danh"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <AttendanceTrendChart defaultPeriod="month" />
        </Grid>
      </Grid>
    </Box>
  );

  if (!user || user.role !== 'ADMIN') {
    navigate('/login');
    return null;
  }

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Content based on current view */}
      {currentView === 'overview' && renderOverview()}
      {currentView === 'users' && renderUsers()}
      {currentView === 'students' && renderStudents()}
      {currentView === 'sessions' && renderSessions()}
      {currentView === 'reports' && renderReports()}

      {/* Create User Dialog */}
      <Dialog open={createUserDialog} onClose={() => setCreateUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tạo tài khoản mới</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Tên đăng nhập"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              fullWidth
            />
            <TextField
              label="Mật khẩu"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              fullWidth
            />
            <TextField
              label="Họ tên"
              value={newUser.hoTen}
              onChange={(e) => setNewUser({ ...newUser, hoTen: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Vai trò</InputLabel>
              <Select
                value={newUser.role}
                label="Vai trò"
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="GIANGVIEN">Giảng viên</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateUserDialog(false)}>Hủy</Button>
          <Button onClick={handleCreateUser} variant="contained">Tạo</Button>
        </DialogActions>
      </Dialog>

      {/* Import Students Dialog */}
      <Dialog open={importDialog} onClose={() => setImportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import Sinh viên từ CSV</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Format CSV:</strong> MSSV,Họ tên,Mã lớp
            </Typography>
            <Typography variant="body2">
              <strong>Ví dụ:</strong><br/>
              024101030,Vo Hoang Khac Bao,IT4409<br/>
              024101053,Nguyen Huynh Bao Anh,IT4409
            </Typography>
          </Alert>
          
          <TextField
            fullWidth
            multiline
            rows={10}
            placeholder="MSSV,Họ tên,Mã lớp&#10;024101030,Vo Hoang Khac Bao,IT4409&#10;024101053,Nguyen Huynh Bao Anh,IT4409"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            sx={{ fontFamily: 'monospace' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialog(false)}>Hủy</Button>
          <Button 
            onClick={handleImportStudents} 
            variant="contained" 
            color="success"
            disabled={!csvText.trim() || loading}
          >
            {loading ? 'Đang import...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};
