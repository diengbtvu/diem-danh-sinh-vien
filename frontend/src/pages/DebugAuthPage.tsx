import React from 'react';
import { Box, Typography, Card, CardContent, Button, Alert } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const DebugAuthPage: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  const clearAuth = () => {
    localStorage.removeItem('diemdanh_auth');
    window.location.reload();
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Debug Auth State
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Auth State:
          </Typography>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(auth, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            LocalStorage:
          </Typography>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {localStorage.getItem('diemdanh_auth') || 'No auth data'}
          </pre>
        </CardContent>
      </Card>

      <Box display="flex" gap={2} flexWrap="wrap">
        <Button variant="contained" onClick={() => navigate('/login')}>
          Go to Login
        </Button>
        <Button variant="contained" onClick={() => navigate('/admin-dashboard')}>
          Go to Admin
        </Button>
        <Button variant="contained" onClick={() => navigate('/teacher-dashboard')}>
          Go to Teacher
        </Button>
        <Button variant="outlined" color="error" onClick={clearAuth}>
          Clear Auth
        </Button>
      </Box>

      {auth.isAuthenticated && (
        <Alert severity="success" sx={{ mt: 2 }}>
          User is authenticated as {auth.user?.role}
        </Alert>
      )}

      {!auth.isAuthenticated && !auth.isLoading && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          User is not authenticated
        </Alert>
      )}

      {auth.isLoading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Auth is loading...
        </Alert>
      )}
    </Box>
  );
};
