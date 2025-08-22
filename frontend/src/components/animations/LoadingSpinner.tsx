import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, useTheme } from '@mui/material';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  text?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'wave' | 'skeleton';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  color,
  text,
  variant = 'spinner'
}) => {
  const theme = useTheme();
  const spinnerColor = color || theme.palette.primary.main;

  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  };

  const dotsVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  const waveVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'spinner':
        return (
          <motion.div
            variants={spinnerVariants}
            animate="animate"
            style={{
              width: size,
              height: size,
              border: `3px solid ${theme.palette.grey[200]}`,
              borderTop: `3px solid ${spinnerColor}`,
              borderRadius: '50%'
            }}
          />
        );

      case 'dots':
        return (
          <Box display="flex" gap={1}>
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                variants={dotsVariants}
                animate="animate"
                style={{
                  width: size / 4,
                  height: size / 4,
                  backgroundColor: spinnerColor,
                  borderRadius: '50%',
                  animationDelay: `${index * 0.2}s`
                }}
                transition={{
                  delay: index * 0.2
                }}
              />
            ))}
          </Box>
        );

      case 'pulse':
        return (
          <motion.div
            variants={pulseVariants}
            animate="animate"
            style={{
              width: size,
              height: size,
              backgroundColor: spinnerColor,
              borderRadius: '50%'
            }}
          />
        );

      case 'wave':
        return (
          <Box display="flex" alignItems="end" gap={0.5}>
            {[0, 1, 2, 3, 4].map((index) => (
              <motion.div
                key={index}
                variants={waveVariants}
                animate="animate"
                style={{
                  width: size / 8,
                  height: size / 2,
                  backgroundColor: spinnerColor,
                  borderRadius: 2
                }}
                transition={{
                  delay: index * 0.1
                }}
              />
            ))}
          </Box>
        );

      case 'skeleton':
        return (
          <Box width="100%" maxWidth={300}>
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                  transition: {
                    duration: 1.5,
                    repeat: Infinity,
                    delay: index * 0.2
                  }
                }}
                style={{
                  height: 20,
                  backgroundColor: theme.palette.grey[300],
                  borderRadius: 4,
                  marginBottom: 8,
                  width: `${100 - index * 20}%`
                }}
              />
            ))}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
      p={2}
    >
      {renderSpinner()}
      {text && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
          >
            {text}
          </Typography>
        </motion.div>
      )}
    </Box>
  );
};

// Specialized loading components
export const PageLoader: React.FC<{ text?: string }> = ({ text = 'Đang tải...' }) => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="center"
    minHeight="50vh"
  >
    <LoadingSpinner variant="spinner" size={50} text={text} />
  </Box>
);

export const ButtonLoader: React.FC = () => (
  <LoadingSpinner variant="dots" size={20} />
);

export const InlineLoader: React.FC<{ text?: string }> = ({ text }) => (
  <Box display="inline-flex" alignItems="center" gap={1}>
    <LoadingSpinner variant="dots" size={16} />
    {text && (
      <Typography variant="body2" color="text.secondary">
        {text}
      </Typography>
    )}
  </Box>
);

export const SkeletonLoader: React.FC = () => (
  <LoadingSpinner variant="skeleton" />
);
