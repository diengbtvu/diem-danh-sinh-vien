import React, { useState } from 'react';
import {
  Box,
  Typography,
  Divider,
  Chip,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import {
  Person,
  Lock,
  Login as LoginIcon,
  School,
  AdminPanelSettings,
  Security
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProfessionalLayout from '../components/ProfessionalLayout';
import ProfessionalForm from '../components/forms/ProfessionalForm';
import ProfessionalTextField from '../components/forms/ProfessionalTextField';
import ProfessionalButton, { GradientButton } from '../components/buttons/ProfessionalButton';

export const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', formData.usernameOrEmail);
      const result = await login(formData.usernameOrEmail, formData.password);
      console.log('Login result:', result);

      if (result.success) {
        console.log('Login successful, user role:', result.user?.role);

        // Add a small delay to ensure state is updated
        setTimeout(() => {
          // Redirect based on role
          if (result.user?.role === 'ADMIN') {
            console.log('Redirecting to admin dashboard');
            navigate('/admin-dashboard', { replace: true });
          } else if (result.user?.role === 'GIANGVIEN') {
            console.log('Redirecting to teacher dashboard');
            navigate('/teacher-dashboard', { replace: true });
          } else {
            console.log('Redirecting to home');
            navigate('/', { replace: true });
          }
        }, 100);
      } else {
        console.log('Login failed:', result.message);
        setError(result.message || 'Đăng nhập thất bại');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError('Lỗi kết nối: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    if (error) setError('');
  };

  const theme = useTheme();

  return (
    <ProfessionalLayout
      maxWidth={false}
      disablePadding
      showScrollTop={false}
      headerProps={{
        title: "Hệ thống điểm danh",
        subtitle: "Đăng nhập để tiếp tục",
        showActions: false
      }}
    >
      <Box
        sx={{
          minHeight: 'calc(100vh - 80px)',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23000000" fill-opacity="0.02"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.5
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 450, position: 'relative', zIndex: 1 }}
        >
          <ProfessionalForm
            title="Đăng nhập"
            subtitle="Chào mừng bạn quay trở lại"
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            variant="glass"
            elevation={0}
          >
            {/* Username/Email Field */}
            <ProfessionalTextField
              label="Tên đăng nhập hoặc Email"
              value={formData.usernameOrEmail}
              onChange={handleInputChange('usernameOrEmail')}
              icon={<Person />}
              placeholder="Nhập tên đăng nhập hoặc email"
              required
              autoComplete="username"
              autoFocus
            />

            {/* Password Field */}
            <ProfessionalTextField
              label="Mật khẩu"
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              icon={<Lock />}
              placeholder="Nhập mật khẩu"
              showPasswordToggle
              required
              autoComplete="current-password"
            />

            {/* Demo Accounts Info */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Tài khoản demo:
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" gap={1}>
                <Chip
                  icon={<AdminPanelSettings />}
                  label="admin / admin123"
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => setFormData({ usernameOrEmail: 'admin', password: 'admin123' })}
                  sx={{ cursor: 'pointer' }}
                />
                <Chip
                  icon={<School />}
                  label="teacher1 / teacher123"
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={() => setFormData({ usernameOrEmail: 'teacher1', password: 'teacher123' })}
                  sx={{ cursor: 'pointer' }}
                />
              </Stack>
            </Box>

            <Divider sx={{ my: 1 }}>
              <Chip label="Đăng nhập" size="small" />
            </Divider>

            {/* Login Button */}
            <GradientButton
              type="submit"
              fullWidth
              size="large"
              loading={loading}
              loadingText="Đang đăng nhập..."
              icon={<LoginIcon />}
              glow
              sx={{ py: 1.5 }}
            >
              Đăng nhập
            </GradientButton>

            {/* Security Notice */}
            <Box
              sx={{
                textAlign: 'center',
                p: 2,
                backgroundColor: alpha(theme.palette.info.main, 0.1),
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
              }}
            >
              <Security sx={{ color: 'info.main', mb: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Hệ thống được bảo mật với mã hóa SSL và xác thực 2 lớp
              </Typography>
            </Box>
          </ProfessionalForm>
        </motion.div>
      </Box>
    </ProfessionalLayout>
  );
};

export default LoginPage;
