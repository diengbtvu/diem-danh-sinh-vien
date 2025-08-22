import React from 'react';
import {
  Button,
  ButtonProps,
  CircularProgress,
  Box,
  useTheme,
  alpha,
  Tooltip
} from '@mui/material';

interface ProfessionalButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'contained' | 'outlined' | 'text' | 'gradient' | 'glass';
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  tooltip?: string;
  success?: boolean;
  pulse?: boolean;
  glow?: boolean;
}

export const ProfessionalButton: React.FC<ProfessionalButtonProps> = ({
  variant = 'contained',
  loading = false,
  loadingText,
  icon,
  iconPosition = 'start',
  tooltip,
  success = false,
  pulse = false,
  glow = false,
  children,
  disabled,
  sx,
  ...props
}) => {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const getVariantStyles = () => {
    const baseStyles = {
      borderRadius: 2,
      padding: '12px 24px',
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'none' as const,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      '&:before': pulse ? {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.3)} 0%, transparent 70%)`,
        animation: 'pulse 2s infinite',
        '@keyframes pulse': {
          '0%': { transform: 'scale(0)', opacity: 1 },
          '100%': { transform: 'scale(4)', opacity: 0 }
        }
      } : {},
    };

    switch (variant) {
      case 'gradient':
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          border: 'none',
          boxShadow: glow ? `0 0 20px ${alpha(theme.palette.primary.main, 0.5)}` : '0 4px 12px rgba(0,0,0,0.15)',
          '&:hover': {
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
            transform: 'translateY(-2px)',
            boxShadow: glow ? `0 0 30px ${alpha(theme.palette.primary.main, 0.7)}` : '0 6px 20px rgba(0,0,0,0.2)',
          },
          '&:active': {
            transform: 'translateY(0)',
          }
        };

      case 'glass':
        return {
          ...baseStyles,
          background: alpha(theme.palette.background.paper, 0.1),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          color: theme.palette.primary.main,
          '&:hover': {
            background: alpha(theme.palette.primary.main, 0.1),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
            transform: 'translateY(-1px)',
          }
        };

      case 'outlined':
        return {
          ...baseStyles,
          border: `2px solid ${theme.palette.primary.main}`,
          color: theme.palette.primary.main,
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            border: `2px solid ${theme.palette.primary.dark}`,
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }
        };

      case 'text':
        return {
          ...baseStyles,
          color: theme.palette.primary.main,
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            transform: 'scale(1.02)',
          }
        };

      default: // contained
        return {
          ...baseStyles,
          backgroundColor: success ? theme.palette.success.main : theme.palette.primary.main,
          color: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          '&:hover': {
            backgroundColor: success ? theme.palette.success.dark : theme.palette.primary.dark,
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
          },
          '&:active': {
            transform: 'translateY(0)',
          }
        };
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress 
            size={16} 
            sx={{ 
              color: variant === 'outlined' || variant === 'text' ? 'primary.main' : 'white' 
            }} 
          />
          {loadingText || 'Đang xử lý...'}
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon && iconPosition === 'start' && icon}
        {children}
        {icon && iconPosition === 'end' && icon}
      </Box>
    );
  };

  const button = (
    <Button
      {...props}
      disabled={isDisabled}
      sx={{
        ...getVariantStyles(),
        '&.Mui-disabled': {
          opacity: 0.6,
          transform: 'none',
          cursor: 'not-allowed',
          pointerEvents: 'auto',
        },
        ...sx
      }}
    >
      {renderContent()}
    </Button>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow>
        <span>
          {button}
        </span>
      </Tooltip>
    );
  }

  return button;
};

// Specialized button variants
export const GradientButton: React.FC<Omit<ProfessionalButtonProps, 'variant'>> = (props) => (
  <ProfessionalButton variant="gradient" {...props} />
);

export const GlassButton: React.FC<Omit<ProfessionalButtonProps, 'variant'>> = (props) => (
  <ProfessionalButton variant="glass" {...props} />
);

export const LoadingButton: React.FC<ProfessionalButtonProps> = (props) => (
  <ProfessionalButton loading {...props} />
);

export default ProfessionalButton;
