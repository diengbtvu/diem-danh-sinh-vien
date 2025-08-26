import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Divider,
  Chip,
  Stack,
  useTheme,
  alpha,
  Alert,
  Link
} from '@mui/material';
import {
  Person,
  Lock,
  Login as LoginIcon,
  Security,
  Visibility,
  VisibilityOff,
  Info
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProfessionalLayout from '../components/ProfessionalLayout';
import ProfessionalForm from '../components/forms/ProfessionalForm';
import ProfessionalTextField from '../components/forms/ProfessionalTextField';
import ProfessionalButton, { GradientButton } from '../components/buttons/ProfessionalButton';

interface FormErrors {
  usernameOrEmail?: string;
  password?: string;
  general?: string;
}

export const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  // Lockout timer effect
  useEffect(() => {
    if (lockoutTime) {
      const timer = setInterval(() => {
        const remaining = lockoutTime - Date.now();
        if (remaining <= 0) {
          setLockoutTime(null);
          setAttempts(0);
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [lockoutTime]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username/Email validation
    if (!formData.usernameOrEmail.trim()) {
      newErrors.usernameOrEmail = 'Vui lòng nhập tên đăng nhập hoặc email';
    } else if (formData.usernameOrEmail.length < 3) {
      newErrors.usernameOrEmail = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is locked out
    if (lockoutTime && Date.now() < lockoutTime) {
      const remaining = Math.ceil((lockoutTime - Date.now()) / 1000);
      setError(`Tài khoản tạm khóa. Vui lòng thử lại sau ${remaining} giây.`);
      return;
    }

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setErrors({});

    try {
      console.log('Attempting login with:', formData.usernameOrEmail);
      const result = await login(formData.usernameOrEmail.trim(), formData.password);
      console.log('Login result:', result);

      if (result.success) {
        console.log('Login successful, user role:', result.user?.role);
        
        // Reset attempts on successful login
        setAttempts(0);
        setLockoutTime(null);

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
        
        // Handle failed attempts
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 5) {
          // Lock out for 5 minutes after 5 failed attempts
          setLockoutTime(Date.now() + 5 * 60 * 1000);
          setError('Quá nhiều lần thử. Tài khoản tạm khóa 5 phút.');
        } else if (newAttempts >= 3) {
          setError(`Sai thông tin đăng nhập. Còn ${5 - newAttempts} lần thử.`);
        } else {
          setError(result.message || 'Thông tin đăng nhập không chính xác');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError('Lỗi kết nối. Vui lòng kiểm tra kết nối mạng và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors when user starts typing
    if (error) setError('');
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const isFormDisabled: boolean = loading || (lockoutTime !== null && Date.now() < lockoutTime);

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
              disabled={isFormDisabled}
              error={!!errors.usernameOrEmail}
              helperText={errors.usernameOrEmail}
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
              disabled={isFormDisabled}
              error={!!errors.password}
              helperText={errors.password}
            />

            {/* Security Info */}
            {attempts > 0 && (
              <Alert 
                severity={attempts >= 3 ? "warning" : "info"} 
                sx={{ 
                  borderRadius: 2,
                  '& .MuiAlert-icon': {
                    fontSize: '1.1rem'
                  }
                }}
              >
                <Typography variant="body2">
                  {attempts >= 3 
                    ? `⚠️ Cảnh báo: Đã thử ${attempts}/5 lần. Tài khoản sẽ bị khóa tạm thời sau 5 lần thử sai.`
                    : `Lần thử thứ ${attempts}/5`
                  }
                </Typography>
              </Alert>
            )}

            {lockoutTime && Date.now() < lockoutTime && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                <Typography variant="body2">
                  🔒 Tài khoản đã bị khóa tạm thời do quá nhiều lần đăng nhập sai. 
                  Vui lòng thử lại sau {Math.ceil((lockoutTime - Date.now()) / 1000)} giây.
                </Typography>
              </Alert>
            )}

            <Divider sx={{ my: 1 }}>
              <Chip label="Đăng nhập" size="small" />
            </Divider>

            {/* Login Button */}
            <GradientButton
              type="submit"
              fullWidth
              size="large"
              loading={loading}
              loadingText={lockoutTime ? "Tài khoản bị khóa..." : "Đang đăng nhập..."}
              icon={<LoginIcon />}
              glow={!isFormDisabled}
              disabled={isFormDisabled}
              sx={{ 
                py: 1.5,
                opacity: isFormDisabled ? 0.6 : 1,
                transition: 'opacity 0.3s ease'
              }}
            >
              {lockoutTime && Date.now() < lockoutTime 
                ? `Khóa (${Math.ceil((lockoutTime - Date.now()) / 1000)}s)`
                : "Đăng nhập"
              }
            </GradientButton>

            {/* Additional Security Features */}
            <Stack spacing={2} sx={{ mt: 2 }}>
              {/* Help and Support */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Gặp vấn đề đăng nhập?{' '}
                  <Link 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      // Add contact admin logic here
                      alert('Vui lòng liên hệ quản trị viên hệ thống để được hỗ trợ.');
                    }}
                    sx={{ 
                      textDecoration: 'none',
                      fontWeight: 500,
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    Liên hệ hỗ trợ
                  </Link>
                </Typography>
              </Box>


            </Stack>
          </ProfessionalForm>
        </motion.div>
      </Box>
    </ProfessionalLayout>
  );
};

export default LoginPage;
