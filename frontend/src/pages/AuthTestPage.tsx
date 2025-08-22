import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  Stack,
  Chip,
  Divider,
  Paper
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';

export const AuthTestPage: React.FC = () => {
  const { isAuthenticated, user, login, logout, isLoading } = useAuth();
  const [loginForm, setLoginForm] = useState({
    usernameOrEmail: '',
    password: ''
  });
  const [loginResult, setLoginResult] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginResult('Đang đăng nhập...');
    
    try {
      const result = await login(loginForm.usernameOrEmail, loginForm.password);
      if (result.success) {
        setLoginResult('✅ Đăng nhập thành công!');
      } else {
        setLoginResult(`❌ Đăng nhập thất bại: ${result.message}`);
      }
    } catch (error: any) {
      setLoginResult(`❌ Lỗi: ${error.message}`);
    }
  };

  const handleQuickLogin = (username: string, password: string) => {
    setLoginForm({ usernameOrEmail: username, password });
  };

  const handleLogout = () => {
    logout();
    setLoginResult('Đã đăng xuất');
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Đang kiểm tra trạng thái đăng nhập...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🔐 Test Authentication System
      </Typography>

      {/* Current Auth Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Trạng thái hiện tại
          </Typography>
          
          {isAuthenticated ? (
            <Stack spacing={2}>
              <Alert severity="success">
                ✅ Đã đăng nhập thành công
              </Alert>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Thông tin người dùng:
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography><strong>ID:</strong> {user?.id}</Typography>
                  <Typography><strong>Username:</strong> {user?.username}</Typography>
                  <Typography><strong>Họ tên:</strong> {user?.hoTen}</Typography>
                  <Typography><strong>Email:</strong> {user?.email}</Typography>
                  <Typography><strong>Role:</strong> 
                    <Chip 
                      label={user?.role} 
                      color={user?.role === 'ADMIN' ? 'error' : 'primary'} 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  {user?.khoa && <Typography><strong>Khoa:</strong> {user.khoa}</Typography>}
                  {user?.boMon && <Typography><strong>Bộ môn:</strong> {user.boMon}</Typography>}
                  <Typography><strong>Đăng nhập lần cuối:</strong> {user?.lastLoginAt}</Typography>
                </Paper>
              </Box>

              <Button 
                variant="contained" 
                color="error" 
                onClick={handleLogout}
                sx={{ alignSelf: 'flex-start' }}
              >
                Đăng xuất
              </Button>
            </Stack>
          ) : (
            <Alert severity="warning">
              ⚠️ Chưa đăng nhập
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Login Form */}
      {!isAuthenticated && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Đăng nhập
            </Typography>

            {/* Quick Login Buttons */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Tài khoản demo:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                <Chip
                  label="Admin (admin/admin123)"
                  color="error"
                  variant="outlined"
                  onClick={() => handleQuickLogin('admin', 'admin123')}
                  sx={{ cursor: 'pointer' }}
                />
                <Chip
                  label="Giảng viên (giangvien1/gv123)"
                  color="primary"
                  variant="outlined"
                  onClick={() => handleQuickLogin('giangvien1', 'gv123')}
                  sx={{ cursor: 'pointer' }}
                />
              </Stack>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <form onSubmit={handleLogin}>
              <Stack spacing={2}>
                <TextField
                  label="Username hoặc Email"
                  value={loginForm.usernameOrEmail}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, usernameOrEmail: e.target.value }))}
                  required
                  fullWidth
                />
                
                <TextField
                  label="Mật khẩu"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                  fullWidth
                />

                <Button 
                  type="submit" 
                  variant="contained" 
                  size="large"
                  disabled={!loginForm.usernameOrEmail || !loginForm.password}
                >
                  Đăng nhập
                </Button>
              </Stack>
            </form>

            {loginResult && (
              <Alert 
                severity={loginResult.includes('✅') ? 'success' : 'error'} 
                sx={{ mt: 2 }}
              >
                {loginResult}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation Test */}
      {isAuthenticated && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Test Navigation
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Thử truy cập các trang được bảo vệ:
            </Typography>
            
            <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
              <Button 
                variant="outlined" 
                onClick={() => window.location.href = '/admin-dashboard'}
                disabled={user?.role !== 'ADMIN'}
              >
                Admin Dashboard {user?.role !== 'ADMIN' && '(Cần quyền ADMIN)'}
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={() => window.location.href = '/teacher-dashboard'}
                disabled={user?.role !== 'ADMIN' && user?.role !== 'GIANGVIEN'}
              >
                Teacher Dashboard
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={() => window.location.href = '/'}
              >
                Trang chủ
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
