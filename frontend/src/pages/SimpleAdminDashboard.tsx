import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import {
  ExitToApp,
  Person
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const SimpleAdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

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

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Đang tải...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard - Simple
          </Typography>
          
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              <Person />
            </Avatar>
          </IconButton>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
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

      {/* Content */}
      <Box p={3}>
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Chào mừng, {user.hoTen}!
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Vai trò: {user.role}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Email: {user.email}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Khoa: {user.khoa}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Bộ môn: {user.boMon}
            </Typography>

            <Box mt={3}>
              <Button 
                variant="contained" 
                onClick={() => navigate('/admin')}
                sx={{ mr: 2 }}
              >
                Đi tới Admin Page cũ
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/admin-dashboard')}
              >
                Thử Admin Dashboard đầy đủ
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
