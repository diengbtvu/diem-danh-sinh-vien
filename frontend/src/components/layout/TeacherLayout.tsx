import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Divider,
  Container
} from '@mui/material';
import {
  School,
  Settings,
  ExitToApp,
  Person,
  NotificationsActive
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface TeacherLayoutProps {
  children: React.ReactNode;
  user?: any;
  onLogout: () => void;
}

export const TeacherLayout: React.FC<TeacherLayoutProps> = ({ children, user, onLogout }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      {/* App Bar with Teacher Theme */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #009688 0%, #00695c 100%)',
          borderBottom: '3px solid #ff9800'
        }}
      >
        <Toolbar>
          <School sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Dashboard Giảng Viên
          </Typography>

          {/* Notification Icon */}
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <NotificationsActive />
          </IconButton>

          {/* User Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.hoTen}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {user?.khoa} - {user?.boMon}
              </Typography>
            </Box>
            
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ 
                width: 40, 
                height: 40, 
                bgcolor: '#ff9800',
                border: '2px solid white'
              }}>
                {user?.hoTen?.charAt(0) || 'G'}
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              PaperProps={{
                elevation: 3,
                sx: { minWidth: 200 }
              }}
            >
              <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }}>
                <Person sx={{ mr: 1 }} /> Hồ sơ
              </MenuItem>
              <MenuItem onClick={() => { navigate('/settings'); setAnchorEl(null); }}>
                <Settings sx={{ mr: 1 }} /> Cài đặt
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { onLogout(); setAnchorEl(null); }}>
                <ExitToApp sx={{ mr: 1 }} /> Đăng xuất
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
        {children}
      </Container>
    </Box>
  );
};
