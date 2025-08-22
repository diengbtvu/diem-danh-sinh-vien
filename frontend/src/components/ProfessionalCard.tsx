import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  IconButton,
  Chip,
  Stack,
  useTheme,
  alpha,
  Skeleton
} from '@mui/material';
import { MoreVert } from '@mui/icons-material';

interface ProfessionalCardProps {
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  status?: 'active' | 'inactive' | 'pending' | 'success' | 'error' | 'warning';
  statusLabel?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
  onMenuClick?: () => void;
  loading?: boolean;
  elevation?: number;
  variant?: 'default' | 'outlined' | 'gradient';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  sx?: any;
}

export const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  title,
  subtitle,
  description,
  icon,
  status,
  statusLabel,
  actions,
  children,
  onClick,
  onMenuClick,
  loading = false,
  elevation = 1,
  variant = 'default',
  color = 'primary',
  sx
}) => {
  const theme = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'success':
        return 'success';
      case 'inactive':
        return 'default';
      case 'pending':
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getCardStyles = () => {
    const baseStyles = {
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': onClick ? {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      } : {},
      ...sx
    };

    switch (variant) {
      case 'outlined':
        return {
          ...baseStyles,
          border: `2px solid ${theme.palette[color].main}`,
          bgcolor: alpha(theme.palette[color].main, 0.02),
        };
      case 'gradient':
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)} 0%, ${alpha(theme.palette[color].light, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
        };
      default:
        return baseStyles;
    }
  };

  if (loading) {
    return (
      <Card elevation={elevation} sx={getCardStyles()}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flexGrow: 1 }}>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="40%" height={20} />
              </Box>
              <Skeleton variant="rectangular" width={60} height={24} />
            </Stack>
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="80%" height={20} />
            <Skeleton variant="rectangular" width="100%" height={100} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      elevation={elevation} 
      sx={getCardStyles()}
      onClick={onClick}
    >
      {/* Header */}
      {(title || subtitle || icon || status || onMenuClick) && (
        <CardContent sx={{ pb: children ? 1 : 2 }}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            {/* Icon */}
            {icon && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette[color].main, 0.1),
                  color: theme.palette[color].main,
                  flexShrink: 0
                }}
              >
                {icon}
              </Box>
            )}

            {/* Content */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              {title && (
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    mb: subtitle ? 0.5 : 1,
                    color: 'text.primary'
                  }}
                >
                  {title}
                </Typography>
              )}
              
              {subtitle && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    mb: 1
                  }}
                >
                  {subtitle}
                </Typography>
              )}

              {description && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    lineHeight: 1.6
                  }}
                >
                  {description}
                </Typography>
              )}
            </Box>

            {/* Status and Menu */}
            <Stack direction="row" spacing={1} alignItems="center">
              {status && (
                <Chip
                  label={statusLabel || status}
                  size="small"
                  color={getStatusColor(status)}
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}
                />
              )}
              
              {onMenuClick && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMenuClick();
                  }}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.action.hover, 0.5)
                    }
                  }}
                >
                  <MoreVert />
                </IconButton>
              )}
            </Stack>
          </Stack>
        </CardContent>
      )}

      {/* Children Content */}
      {children && (
        <CardContent sx={{ pt: title || subtitle || icon ? 0 : 2 }}>
          {children}
        </CardContent>
      )}

      {/* Actions */}
      {actions && (
        <CardActions sx={{ px: 2, pb: 2 }}>
          {actions}
        </CardActions>
      )}
    </Card>
  );
};

// Specialized card variants
export const StatsCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  loading?: boolean;
}> = ({ title, value, subtitle, icon, trend, trendValue, color = 'primary', loading }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <ProfessionalCard loading variant="gradient" color={color} />
    );
  }

  return (
    <ProfessionalCard
      variant="gradient"
      color={color}
      icon={icon}
    >
      <Stack spacing={1}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, color: `${color}.main` }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        {trend && trendValue && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: trend === 'up' ? 'success.main' : trend === 'down' ? 'error.main' : 'text.secondary',
                fontWeight: 600
              }}
            >
              {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
            </Typography>
          </Box>
        )}
      </Stack>
    </ProfessionalCard>
  );
};

export default ProfessionalCard;
