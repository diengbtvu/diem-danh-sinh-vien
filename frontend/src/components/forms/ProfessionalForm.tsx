import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Divider,
  Alert,
  Collapse,
  useTheme,
  alpha
} from '@mui/material';
import { CheckCircle, Error, Warning, Info } from '@mui/icons-material';

interface ProfessionalFormProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  onSubmit?: (event: React.FormEvent) => void;
  loading?: boolean;
  error?: string | null;
  success?: string | null;
  warning?: string | null;
  info?: string | null;
  maxWidth?: number | string;
  elevation?: number;
  variant?: 'default' | 'outlined' | 'glass';
  spacing?: number;
  sx?: any;
}

export const ProfessionalForm: React.FC<ProfessionalFormProps> = ({
  title,
  subtitle,
  children,
  onSubmit,
  loading = false,
  error,
  success,
  warning,
  info,
  maxWidth = 500,
  elevation = 3,
  variant = 'default',
  spacing = 3,
  sx
}) => {
  const theme = useTheme();

  const getFormStyles = () => {
    const baseStyles = {
      borderRadius: 3,
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    };

    switch (variant) {
      case 'outlined':
        return {
          ...baseStyles,
          border: `2px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          boxShadow: 'none',
        };
      case 'glass':
        return {
          ...baseStyles,
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        };
      default:
        return {
          ...baseStyles,
          backgroundColor: theme.palette.background.paper,
        };
    }
  };

  const renderAlert = (type: 'error' | 'success' | 'warning' | 'info', message: string) => {
    const icons = {
      error: <Error />,
      success: <CheckCircle />,
      warning: <Warning />,
      info: <Info />
    };

    return (
      <Collapse in={Boolean(message)}>
        <Alert 
          severity={type}
          icon={icons[type]}
          sx={{
            borderRadius: 2,
            '& .MuiAlert-message': {
              fontWeight: 500
            }
          }}
        >
          {message}
        </Alert>
      </Collapse>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100%',
        p: 2
      }}
    >
      <Paper
        elevation={variant === 'glass' ? 0 : elevation}
        sx={{
          width: '100%',
          maxWidth,
          ...getFormStyles(),
          ...sx
        }}
      >
        <Box
          component="form"
          onSubmit={onSubmit}
          sx={{
            p: { xs: 3, sm: 4 },
            position: 'relative',
            '&::before': loading ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: alpha(theme.palette.background.paper, 0.7),
              zIndex: 1,
              pointerEvents: 'none'
            } : {}
          }}
        >
          {/* Header */}
          {(title || subtitle) && (
            <Box sx={{ mb: spacing, textAlign: 'center' }}>
              {title && (
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    mb: subtitle ? 1 : 0,
                    color: 'text.primary',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'text.secondary',
                    lineHeight: 1.6
                  }}
                >
                  {subtitle}
                </Typography>
              )}
              <Divider sx={{ mt: 2, opacity: 0.3 }} />
            </Box>
          )}

          {/* Alerts */}
          <Stack spacing={2} sx={{ mb: spacing }}>
            {error && renderAlert('error', error)}
            {success && renderAlert('success', success)}
            {warning && renderAlert('warning', warning)}
            {info && renderAlert('info', info)}
          </Stack>

          {/* Form Content */}
          <Stack spacing={spacing}>
            {children}
          </Stack>

          {/* Loading Overlay */}
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(2px)',
                zIndex: 2
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    border: `3px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    borderTop: `3px solid ${theme.palette.primary.main}`,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    mx: 'auto',
                    mb: 2,
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  Đang xử lý...
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ProfessionalForm;
