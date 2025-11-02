import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  School,
  Add,
  Visibility,
  QrCode2,
  Refresh,
  Delete,
  Assessment,
  BarChart,
  TrendingUp
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { TeacherLayout } from '../components/layout/TeacherLayout';
import { QuickCreateSession } from '../components/teacher/QuickCreateSession';
import { ActiveSessionCard } from '../components/teacher/ActiveSessionCard';
import { AttendanceStatsCard } from '../components/statistics/AttendanceStatsCard';
import { AttendanceTrendChart } from '../components/statistics/AttendanceTrendChart';
import { QRWidget } from '../components/QRWidget';
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

interface ClassInfo {
  maLop: string;
  tenLop: string;
  moTa?: string;
}

export const NewTeacherDashboard: React.FC = () => {
  const { user, logout, getAuthHeader } = useAuth();
  const navigate = useNavigate();

  const [teacherClasses, setTeacherClasses] = useState<string[]>([]);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialogs
  const [createClassDialog, setCreateClassDialog] = useState(false);
  const [qrDialog, setQrDialog] = useState(false);
  
  // QR states
  const [qrSessionId, setQrSessionId] = useState('');
  const [qrAUrl, setQrAUrl] = useState('');
  const [qr2Active, setQr2Active] = useState(false);
  const [qr2RemainMs, setQr2RemainMs] = useState(0);
  const [qrBData, setQrBData] = useState('');

  // Class form
  const [classForm, setClassForm] = useState({ maLop: '', tenLop: '', moTa: '' });

  // Load data
  const loadTeacherClasses = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.TEACHER.CLASSES_CODES), {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setTeacherClasses(data.classes || []);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  }, [getAuthHeader]);

  const loadSessions = useCallback(async () => {
    try {
      const response = await fetch(
        buildApiUrl(`${API_CONFIG.ENDPOINTS.TEACHER.SESSIONS}?size=50`),
        { headers: getAuthHeader() }
      );
      if (response.ok) {
        const data = await response.json();
        const sessions = data.content || [];
        setActiveSessions(sessions.filter((s: Session) => s.isActive));
        setRecentSessions(sessions.filter((s: Session) => !s.isActive).slice(0, 10));
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }, [getAuthHeader]);

  const loadClasses = useCallback(async () => {
    try {
      const response = await fetch(
        buildApiUrl(`${API_CONFIG.ENDPOINTS.TEACHER.CLASSES}?size=100`),
        { headers: getAuthHeader() }
      );
      if (response.ok) {
        const data = await response.json();
        setClasses(data.content || []);
      }
    } catch (error) {
      console.error('Error loading class details:', error);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    if (user?.role === 'GIANGVIEN' || user?.role === 'ADMIN') {
      loadTeacherClasses();
      loadSessions();
      loadClasses();
    }
  }, [user, loadTeacherClasses, loadSessions, loadClasses]);

  const handleCreateSession = async (data: { maLop: string; durationMinutes: number; showQR: boolean }) => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl('/api/sessions/simple'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          maLop: data.maLop,
          durationMinutes: data.durationMinutes
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(`Tạo phiên thành công cho lớp ${data.maLop}`);
        loadSessions();
        
        if (data.showQR && result.sessionId) {
          handleShowQR(result.sessionId);
        }
      } else {
        setError('Lỗi tạo phiên');
      }
    } catch (error) {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!classForm.maLop || !classForm.tenLop) {
      setError('Vui lòng điền đầy đủ mã lớp và tên lớp');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.TEACHER.CLASSES), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(classForm)
      });

      if (response.ok) {
        setSuccess('Tạo lớp thành công');
        setClassForm({ maLop: '', tenLop: '', moTa: '' });
        setCreateClassDialog(false);
        loadTeacherClasses();
        loadClasses();
      } else {
        const text = await response.text();
        setError(text || 'Lỗi tạo lớp');
      }
    } catch (error) {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (maLop: string) => {
    if (!confirm(`Xóa lớp ${maLop}?`)) return;
    
    try {
      const response = await fetch(
        buildApiUrl(`${API_CONFIG.ENDPOINTS.TEACHER.CLASSES}/${maLop}`),
        { method: 'DELETE', headers: getAuthHeader() }
      );
      if (response.ok) {
        setSuccess('Xóa lớp thành công');
        loadTeacherClasses();
        loadClasses();
      } else {
        setError('Lỗi xóa lớp');
      }
    } catch (error) {
      setError('Lỗi kết nối');
    }
  };

  const handleShowQR = (sessionId: string) => {
    setQrSessionId(sessionId);
    setQrDialog(true);
  };

  const handleViewDetail = (sessionId: string) => {
    navigate(`/attendance-detail?sessionId=${sessionId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // QR polling
  useEffect(() => {
    if (!qrSessionId || !qrDialog) return;

    let active = true;
    const tick = async () => {
      if (!active) return;
      try {
        const resp = await fetch(`/api/sessions/${qrSessionId}/status`, {
          headers: getAuthHeader()
        });
        const json = await resp.json();
        if (active) {
          const sessionLink = `/attend?session=${encodeURIComponent(json.sessionToken)}`;
          setQrAUrl(sessionLink);
          setQr2Active(!!json.qr2Active);
          setQr2RemainMs(json.validForMs || 0);
          setQrBData(json.rotatingToken || '');
        }
      } catch (err) {
        console.log('QR polling error:', err);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [qrSessionId, qrDialog, getAuthHeader]);

  if (!user) return null;

  return (
    <TeacherLayout user={user} onLogout={handleLogout}>
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

      {/* Quick Create Session - Top Priority */}
      <QuickCreateSession
        classes={teacherClasses}
        onCreateSession={handleCreateSession}
        loading={loading}
      />

      {/* Quick Actions */}
      <Box sx={{ mt: 3, mb: 3 }}>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<BarChart />}
            onClick={() => navigate('/statistics')}
            sx={{ 
              borderColor: '#1976d2', 
              color: '#1976d2',
              '&:hover': { 
                borderColor: '#1565c0', 
                backgroundColor: 'rgba(25, 118, 210, 0.04)' 
              }
            }}
          >
            Thống kê chi tiết
          </Button>
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => navigate('/analytics')}
            sx={{ 
              borderColor: '#2e7d32', 
              color: '#2e7d32',
              '&:hover': { 
                borderColor: '#1b5e20', 
                backgroundColor: 'rgba(46, 125, 50, 0.04)' 
              }
            }}
          >
            Phân tích dữ liệu
          </Button>
        </Stack>
      </Box>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
            Phiên đang hoạt động
          </Typography>
          <Grid container spacing={3}>
            {activeSessions.map((session) => (
              <Grid item xs={12} sm={6} md={4} key={session.sessionId}>
                <ActiveSessionCard
                  session={session}
                  onViewDetail={handleViewDetail}
                  onShowQR={handleShowQR}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* My Classes */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
            Danh sách lớp học
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setCreateClassDialog(true)}
            size="small"
          >
            Tạo lớp mới
          </Button>
        </Box>

        {classes.length > 0 ? (
          <Grid container spacing={2.5}>
            {classes.map((cls) => (
              <Grid item xs={12} sm={6} md={3} key={cls.maLop}>
                <Card sx={{ 
                  height: '100%',
                  borderRadius: 2, 
                  border: '1px solid #e0e0e0',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#1976d2',
                    boxShadow: '0 4px 12px rgba(25,118,210,0.12)',
                    transform: 'translateY(-2px)'
                  }
                }}>
                  <CardContent sx={{ 
                    p: 2.5, 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ 
                          bgcolor: '#e3f2fd', 
                          borderRadius: 1, 
                          px: 1.5, 
                          py: 0.5,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}>
                          <School sx={{ fontSize: 16, color: '#1976d2' }} />
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1976d2' }}>
                            {cls.maLop}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClass(cls.maLop)}
                          sx={{ 
                            color: '#999',
                            padding: '4px',
                            '&:hover': { 
                              color: '#d32f2f',
                              bgcolor: '#ffebee'
                            }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                      
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 600, 
                          color: '#1a1a1a', 
                          mb: 0.5,
                          minHeight: '1.5rem'
                        }}
                      >
                        {cls.tenLop}
                      </Typography>
                      
                      {cls.moTa && (
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.4,
                            minHeight: '2.8rem'
                          }}
                        >
                          {cls.moTa}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">
            Bạn chưa tạo lớp nào. Hãy tạo lớp đầu tiên để bắt đầu quản lý phiên điểm danh.
          </Alert>
        )}
      </Box>

      {/* Quick Link to Analytics */}
      <Box sx={{ mt: 4 }}>
        <Card sx={{ 
          borderRadius: 2, 
          border: '1px solid #1976d2',
          bgcolor: '#e3f2fd',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(25,118,210,0.2)',
            transform: 'translateY(-2px)'
          }
        }}
        onClick={() => navigate('/analytics')}
        >
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Assessment sx={{ fontSize: 32, color: '#1976d2', mr: 2 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                    Xem thống kê chi tiết
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Phân tích theo tuần, tháng, năm
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h4" sx={{ color: '#1976d2' }}>→</Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Recent Sessions History */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
            Lịch sử điểm danh
          </Typography>
          <Button
            variant="text"
            startIcon={<Refresh />}
            onClick={loadSessions}
            size="small"
          >
            Làm mới
          </Button>
        </Box>

        {recentSessions.length > 0 ? (
          <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Lớp học</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Thời gian</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Tỷ lệ</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentSessions.map((session) => (
                    <TableRow key={session.sessionId} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                          {session.maLop}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(session.startAt).toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {session.attendanceCount || 0}/{session.totalStudents || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label="Đã kết thúc"
                          size="small"
                          sx={{ bgcolor: '#e0e0e0', color: '#666' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetail(session.sessionId)}
                          sx={{ 
                            color: '#1976d2',
                            '&:hover': { bgcolor: '#e3f2fd' }
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        ) : (
          <Alert severity="info">
            Chưa có phiên điểm danh nào. Hãy tạo phiên đầu tiên!
          </Alert>
        )}
      </Box>

      {/* Create Class Dialog */}
      <Dialog open={createClassDialog} onClose={() => setCreateClassDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tạo lớp học mới</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Mã lớp"
              value={classForm.maLop}
              onChange={(e) => setClassForm({ ...classForm, maLop: e.target.value })}
              placeholder="Ví dụ: IT4409"
              fullWidth
            />
            <TextField
              label="Tên lớp"
              value={classForm.tenLop}
              onChange={(e) => setClassForm({ ...classForm, tenLop: e.target.value })}
              placeholder="Ví dụ: Lập trình Web"
              fullWidth
            />
            <TextField
              label="Mô tả"
              value={classForm.moTa}
              onChange={(e) => setClassForm({ ...classForm, moTa: e.target.value })}
              placeholder="Mô tả về lớp học (tùy chọn)"
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateClassDialog(false)}>Hủy</Button>
          <Button 
            onClick={handleCreateClass} 
            variant="contained"
            disabled={!classForm.maLop || !classForm.tenLop || loading}
          >
            Tạo lớp
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog 
        open={qrDialog} 
        onClose={() => setQrDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <QrCode2 sx={{ color: 'primary.main', fontSize: 32 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                QR Code Điểm Danh
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Session: {qrSessionId.substring(0, 13)}...
              </Typography>
            </Box>
            <Chip
              label={qr2Active ? 'QR B đang hoạt động' : 'Chờ sinh viên'}
              color={qr2Active ? 'success' : 'warning'}
              size="small"
              sx={{ ml: 'auto' }}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Instructions */}
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Alert severity="info">
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Bước 1: QR A - Mã cố định
                  </Typography>
                  <Typography variant="body2">
                    Sinh viên quét mã này để vào trang điểm danh
                  </Typography>
                </Alert>

                <Alert severity={qr2Active ? 'success' : 'warning'}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Bước 2: QR B - Mã xoay
                  </Typography>
                  <Typography variant="body2">
                    {qr2Active
                      ? `Đang hoạt động (còn ${Math.ceil(qr2RemainMs / 1000)} giây)`
                      : 'Chờ sinh viên quét QR A'}
                  </Typography>
                </Alert>
              </Stack>
            </Grid>

            {/* QR Display */}
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'center' }}>
                {qr2Active && qrBData ? (
                  <Box>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'success.main' }}>
                      QR B - Mã xoay
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 2, color: 'success.dark' }}>
                      {Math.ceil(qr2RemainMs / 1000)}s
                    </Typography>
                    <QRWidget
                      data={window.location.origin + qrAUrl + '&rot=' + qrBData}
                      title=""
                      size="large"
                      showCopy={true}
                      showDownload={true}
                      status="active"
                    />
                  </Box>
                ) : qrAUrl ? (
                  <Box>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                      QR A - Mã cố định
                    </Typography>
                    <QRWidget
                      data={window.location.origin + qrAUrl}
                      title=""
                      size="large"
                      showCopy={true}
                      showDownload={true}
                      status="active"
                    />
                  </Box>
                ) : (
                  <Typography color="text.secondary">Đang tạo QR...</Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </TeacherLayout>
  );
};
