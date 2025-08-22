import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import {
  School,
  AccountCircle,
  Logout,
  Settings,
  Dashboard,
  QrCodeScanner
} from '@mui/icons-material';

interface ProfessionalHeaderProps {
  title?: string;
  subtitle?: string;
  user?: {
    name: string;
    role: string;
    avatar?: string;
  };
  onLogout?: () => void;
  onSettings?: () => void;
  onDashboard?: () => void;
  showActions?: boolean;
}

export const ProfessionalHeader: React.FC<ProfessionalHeaderProps> = ({
  title = "Hệ thống điểm danh sinh viên",
  subtitle = "Quản lý điểm danh thông minh",
  user,
  onLogout,
  onSettings,
  onDashboard,
  showActions = true
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    onLogout?.();
  };

  const handleSettings = () => {
    handleMenuClose();
    onSettings?.();
  };

  const handleDashboard = () => {
    handleMenuClose();
    onDashboard?.();
  };

  const getRoleColor = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'error';
      case 'GIANGVIEN':
        return 'primary';
      case 'SINHVIEN':
        return 'success';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'Quản trị viên';
      case 'GIANGVIEN':
        return 'Giảng viên';
      case 'SINHVIEN':
        return 'Sinh viên';
      default:
        return role;
    }
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        boxShadow: 'none !important',
        border: 'none !important',
        borderBottom: 'none !important',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.3
        }
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 64, sm: 80 }, px: { xs: 2, sm: 3 } }}>
        {/* Logo and Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 2,
              background: alpha(theme.palette.common.white, 0.15),
              backdropFilter: 'blur(10px)',
              mr: 2,
              border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`
            }}
          >
            <School sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'white',
                fontWeight: 700,
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                lineHeight: 1.2,
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: alpha(theme.palette.common.white, 0.8),
                fontSize: '0.875rem',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {subtitle}
            </Typography>
          </Box>
        </Box>

        {/* User Actions */}
        {showActions && user && (
          <Stack direction="row" spacing={2} alignItems="center">
            {/* User Info */}
            <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'right' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                {user.name}
              </Typography>
              <Chip
                label={getRoleLabel(user.role)}
                size="small"
                color={getRoleColor(user.role)}
                sx={{
                  height: 20,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  '& .MuiChip-label': {
                    px: 1
                  }
                }}
              />
            </Box>

            {/* Avatar and Menu */}
            <IconButton
              onClick={handleMenuOpen}
              sx={{
                p: 0,
                border: `2px solid ${alpha(theme.palette.common.white, 0.2)}`,
                '&:hover': {
                  border: `2px solid ${alpha(theme.palette.common.white, 0.4)}`,
                }
              }}
            >
              {user.avatar ? (
                <Avatar 
                  src={user.avatar} 
                  alt={user.name}
                  sx={{ width: 40, height: 40 }}
                />
              ) : (
                <Avatar 
                  sx={{ 
                    width: 40, 
                    height: 40,
                    bgcolor: alpha(theme.palette.common.white, 0.2),
                    color: 'white'
                  }}
                >
                  <AccountCircle />
                </Avatar>
              )}
            </IconButton>

            {/* User Menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 200,
                  borderRadius: 2,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  border: `1px solid ${theme.palette.divider}`
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {/* User Info in Menu (mobile) */}
              <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {user.name}
                </Typography>
                <Chip
                  label={getRoleLabel(user.role)}
                  size="small"
                  color={getRoleColor(user.role)}
                  sx={{ mt: 0.5, height: 20, fontSize: '0.75rem' }}
                />
              </Box>

              {onDashboard && (
                <MenuItem onClick={handleDashboard}>
                  <Dashboard sx={{ mr: 2, fontSize: 20 }} />
                  Dashboard
                </MenuItem>
              )}
              
              {onSettings && (
                <MenuItem onClick={handleSettings}>
                  <Settings sx={{ mr: 2, fontSize: 20 }} />
                  Cài đặt
                </MenuItem>
              )}
              
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <Logout sx={{ mr: 2, fontSize: 20 }} />
                Đăng xuất
              </MenuItem>
            </Menu>
          </Stack>
        )}

        {/* QR Scanner Icon for mobile */}
        {!user && (
          <IconButton
            sx={{
              color: 'white',
              bgcolor: alpha(theme.palette.common.white, 0.1),
              '&:hover': {
                bgcolor: alpha(theme.palette.common.white, 0.2),
              }
            }}
          >
            <QrCodeScanner />
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default ProfessionalHeader;
