import React from 'react';
import {
  TextField,
  TextFieldProps,
  InputAdornment,
  IconButton,
  Box,
  Typography,
  useTheme,
  alpha,
  Tooltip
} from '@mui/material';
import { Visibility, VisibilityOff, Help } from '@mui/icons-material';

interface ProfessionalTextFieldProps extends Omit<TextFieldProps, 'variant'> {
  variant?: 'outlined' | 'filled' | 'standard';
  showPasswordToggle?: boolean;
  helpText?: string;
  icon?: React.ReactNode;
  success?: boolean;
  loading?: boolean;
}

export const ProfessionalTextField: React.FC<ProfessionalTextFieldProps> = ({
  type,
  showPasswordToggle = false,
  helpText,
  icon,
  success = false,
  loading = false,
  InputProps,
  sx,
  ...props
}) => {
  const theme = useTheme();
  const [showPassword, setShowPassword] = React.useState(false);
  const isPassword = type === 'password';
  const actualType = isPassword && showPassword ? 'text' : type;

  const getFieldColor = () => {
    if (props.error) return 'error';
    if (success) return 'success';
    return 'primary';
  };

  const getBorderColor = () => {
    if (props.error) return theme.palette.error.main;
    if (success) return theme.palette.success.main;
    return theme.palette.primary.main;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        {...props}
        type={actualType}
        variant="outlined"
        fullWidth
        InputProps={{
          ...InputProps,
          startAdornment: icon ? (
            <InputAdornment position="start">
              <Box sx={{ 
                color: props.error ? 'error.main' : success ? 'success.main' : 'text.secondary',
                display: 'flex',
                alignItems: 'center'
              }}>
                {icon}
              </Box>
            </InputAdornment>
          ) : InputProps?.startAdornment,
          endAdornment: (
            <>
              {(isPassword && showPasswordToggle) && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { color: 'primary.main' }
                    }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )}
              {helpText && (
                <InputAdornment position="end">
                  <Tooltip title={helpText} arrow placement="top">
                    <IconButton size="small" sx={{ color: 'text.secondary' }}>
                      <Help fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              )}
              {InputProps?.endAdornment}
            </>
          )
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: theme.palette.background.paper,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha(getBorderColor(), 0.5),
                borderWidth: 2,
              }
            },
            '&.Mui-focused': {
              backgroundColor: theme.palette.background.paper,
              transform: 'scale(1.01)',
              boxShadow: `0 0 0 3px ${alpha(getBorderColor(), 0.1)}`,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: getBorderColor(),
                borderWidth: 2,
              }
            },
            '&.Mui-error': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.error.main,
              }
            }
          },
          '& .MuiInputLabel-root': {
            fontWeight: 500,
            '&.Mui-focused': {
              color: getBorderColor(),
              fontWeight: 600,
            }
          },
          '& .MuiFormHelperText-root': {
            marginLeft: 0,
            marginTop: 1,
            fontSize: '0.875rem',
            '&.Mui-error': {
              color: theme.palette.error.main,
            }
          },
          ...sx
        }}
      />
    </Box>
  );
};

export default ProfessionalTextField;
