import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'GIANGVIEN';
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo = '/login'
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Đang kiểm tra quyền truy cập...
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    // If user doesn't have required role, show access denied or redirect
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
          p: 3,
          textAlign: 'center'
        }}
      >
        <Typography variant="h4" color="error" gutterBottom>
          Truy cập bị từ chối
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Bạn không có quyền truy cập vào trang này.
          {requiredRole && (
            <>
              <br />
              Trang này yêu cầu quyền: <strong>{requiredRole}</strong>
              <br />
              Quyền hiện tại của bạn: <strong>{user?.role || 'Không xác định'}</strong>
            </>
          )}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Quay lại
          </button>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Về trang chủ
          </button>
        </Box>
      </Box>
    );
  }

  // If all checks pass, render the protected content
  return <>{children}</>;
};

// Convenience component for Admin-only routes
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      {children}
    </ProtectedRoute>
  );
};

// Convenience component for Teacher routes (both ADMIN and GIANGVIEN can access)
export const TeacherRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Đang kiểm tra quyền truy cập...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Allow both ADMIN and GIANGVIEN
  if (user?.role !== 'ADMIN' && user?.role !== 'GIANGVIEN') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
          p: 3,
          textAlign: 'center'
        }}
      >
        <Typography variant="h4" color="error" gutterBottom>
          Truy cập bị từ chối
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bạn cần có quyền Giảng viên hoặc Quản trị viên để truy cập trang này.
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
};
