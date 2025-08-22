import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Security,
  AdminPanelSettings,
  School,
  CheckCircle,
  Lock,
  Key,
  Dashboard,
  Login
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const DemoPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const features = [
    {
      icon: <Security color="primary" />,
      title: 'JWT Authentication',
      description: 'Hệ thống xác thực bằng JSON Web Token với thời hạn 24 giờ'
    },
    {
      icon: <Lock color="primary" />,
      title: 'Role-based Access Control',
      description: 'Phân quyền theo vai trò: ADMIN và GIANGVIEN'
    },
    {
      icon: <Key color="primary" />,
      title: 'Protected Routes',
      description: 'Bảo vệ các trang quan trọng, chỉ cho phép user có quyền truy cập'
    },
    {
      icon: <CheckCircle color="primary" />,
      title: 'Auto Login State',
      description: 'Tự động duy trì trạng thái đăng nhập qua localStorage'
    }
  ];

  const accounts = [
    {
      username: 'admin',
      password: 'admin123',
      role: 'ADMIN',
      description: 'Quản trị viên - Có quyền truy cập tất cả tính năng',
      color: 'error' as const
    },
    {
      username: 'giangvien1',
      password: 'gv123',
      role: 'GIANGVIEN',
      description: 'Giảng viên - Có quyền quản lý lớp học của mình',
      color: 'primary' as const
    }
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h3" gutterBottom align="center" sx={{ mb: 4 }}>
        🔐 Demo Authentication System
      </Typography>

      {/* Current Status */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Trạng thái hiện tại
          </Typography>
          
          {isAuthenticated ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="h6">
                ✅ Đã đăng nhập với tài khoản: <strong>{user?.username}</strong>
              </Typography>
              <Typography>
                Role: <Chip label={user?.role} color={user?.role === 'ADMIN' ? 'error' : 'primary'} size="small" />
              </Typography>
            </Alert>
          ) : (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="h6">
                ℹ️ Chưa đăng nhập
              </Typography>
              <Typography>
                Hãy đăng nhập để trải nghiệm hệ thống phân quyền
              </Typography>
            </Alert>
          )}

          <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
            {!isAuthenticated ? (
              <>
                <Button
                  variant="contained"
                  startIcon={<Login />}
                  onClick={() => navigate('/login')}
                >
                  Đăng nhập
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/auth-test')}
                >
                  Test Authentication
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  startIcon={<Dashboard />}
                  onClick={() => {
                    if (user?.role === 'ADMIN') {
                      navigate('/admin-dashboard');
                    } else {
                      navigate('/teacher-dashboard');
                    }
                  }}
                >
                  Vào Dashboard
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/auth-test')}
                >
                  Test Authentication
                </Button>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Features */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Tính năng Authentication
          </Typography>
          
          <List>
            {features.map((feature, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {feature.icon}
                </ListItemIcon>
                <ListItemText
                  primary={feature.title}
                  secondary={feature.description}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Demo Accounts */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Tài khoản demo
          </Typography>
          
          <Stack spacing={3}>
            {accounts.map((account, index) => (
              <Card key={index} variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    {account.role === 'ADMIN' ? (
                      <AdminPanelSettings color="error" />
                    ) : (
                      <School color="primary" />
                    )}
                    <Typography variant="h6">
                      {account.role}
                    </Typography>
                    <Chip label={account.role} color={account.color} size="small" />
                  </Stack>
                  
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Username:</strong> {account.username}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Password:</strong> {account.password}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {account.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Access Control Demo */}
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Demo phân quyền truy cập
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3 }}>
            Hệ thống có các mức độ bảo vệ khác nhau:
          </Typography>

          <Stack spacing={2}>
            <Box>
              <Typography variant="h6" color="success.main">
                🟢 Public Routes (Không cần đăng nhập)
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Trang chủ (/)" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Trang điểm danh (/attend)" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Trang đăng nhập (/login)" />
                </ListItem>
              </List>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" color="error.main">
                🔴 Admin Only Routes (Chỉ ADMIN)
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Admin Dashboard (/admin-dashboard)" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Quản lý người dùng (/admin)" />
                </ListItem>
              </List>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" color="primary.main">
                🟡 Teacher Routes (ADMIN + GIANGVIEN)
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Teacher Dashboard (/teacher-dashboard)" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Tạo buổi học (/create)" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Chi tiết điểm danh (/attendance-detail)" />
                </ListItem>
              </List>
            </Box>
          </Stack>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              💡 <strong>Tip:</strong> Thử đăng nhập với các tài khoản khác nhau để xem sự khác biệt trong quyền truy cập!
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};
