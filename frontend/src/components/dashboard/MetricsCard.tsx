import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  Chip,
  useTheme
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: number;
  trendLabel?: string;
  loading?: boolean;
  subtitle?: string;
  animated?: boolean;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  icon,
  color = 'primary',
  trend,
  trendLabel,
  loading = false,
  subtitle,
  animated = true
}) => {
  const theme = useTheme();

  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return <TrendingFlat />;
    return trend > 0 ? <TrendingUp /> : <TrendingDown />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return 'text.secondary';
    return trend > 0 ? 'success.main' : 'error.main';
  };

  const formatTrend = () => {
    if (trend === undefined) return '';
    const sign = trend > 0 ? '+' : '';
    return `${sign}${trend.toFixed(1)}%`;
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut'
      }
    },
    hover: {
      y: -4,
      boxShadow: theme.shadows[8],
      transition: {
        duration: 0.2,
        ease: 'easeInOut'
      }
    }
  };

  const iconVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: {
        delay: 0.2,
        duration: 0.5,
        ease: 'easeOut'
      }
    }
  };

  const valueVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        delay: 0.3,
        duration: 0.4,
        ease: 'easeOut'
      }
    }
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="circular" width={40} height={40} />
          </Box>
          <Skeleton variant="text" width="40%" height={48} />
          <Skeleton variant="text" width="30%" height={20} sx={{ mt: 1 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      variants={animated ? cardVariants : {}}
      initial={animated ? 'initial' : ''}
      animate={animated ? 'animate' : ''}
      whileHover={animated ? 'hover' : ''}
    >
      <Card
        sx={{
          height: '100%',
          background: `linear-gradient(135deg, ${theme.palette[color].main}08 0%, ${theme.palette[color].main}04 100%)`,
          border: `1px solid ${theme.palette[color].main}20`,
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: `${theme.palette[color].main}40`
          }
        }}
      >
        <CardContent>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={500}
                gutterBottom
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            
            <motion.div
              variants={animated ? iconVariants : {}}
              initial={animated ? 'initial' : ''}
              animate={animated ? 'animate' : ''}
            >
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: `${theme.palette[color].main}15`,
                  color: `${theme.palette[color].main}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {icon}
              </Box>
            </motion.div>
          </Box>

          {/* Value */}
          <motion.div
            variants={animated ? valueVariants : {}}
            initial={animated ? 'initial' : ''}
            animate={animated ? 'animate' : ''}
          >
            <Typography
              variant="h4"
              fontWeight={700}
              color="text.primary"
              gutterBottom
              sx={{
                background: `linear-gradient(45deg, ${theme.palette[color].main}, ${theme.palette[color].dark})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
          </motion.div>

          {/* Trend */}
          {trend !== undefined && (
            <motion.div
              initial={animated ? { opacity: 0, scale: 0.8 } : {}}
              animate={animated ? { opacity: 1, scale: 1 } : {}}
              transition={animated ? { delay: 0.4, duration: 0.3 } : {}}
            >
              <Chip
                icon={getTrendIcon()}
                label={trendLabel || formatTrend()}
                size="small"
                sx={{
                  color: getTrendColor(),
                  bgcolor: 'transparent',
                  border: `1px solid ${theme.palette.divider}`,
                  '& .MuiChip-icon': {
                    color: getTrendColor()
                  }
                }}
              />
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
