import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  SelectProps,
  Box,
  Chip,
  useTheme,
  alpha,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Checkbox
} from '@mui/material';
import { Check, ExpandMore } from '@mui/icons-material';

interface Option {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  description?: string;
}

interface ProfessionalSelectProps extends Omit<SelectProps, 'variant'> {
  label?: string;
  options: Option[];
  helperText?: string;
  success?: boolean;
  icon?: React.ReactNode;
  variant?: 'outlined' | 'filled' | 'standard';
  showCheckbox?: boolean;
  searchable?: boolean;
}

export const ProfessionalSelect: React.FC<ProfessionalSelectProps> = ({
  label,
  options,
  helperText,
  success = false,
  icon,
  variant = 'outlined',
  showCheckbox = false,
  searchable = false,
  error,
  sx,
  ...props
}) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = React.useState('');

  const getBorderColor = () => {
    if (error) return theme.palette.error.main;
    if (success) return theme.palette.success.main;
    return theme.palette.primary.main;
  };

  const filteredOptions = searchable 
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const renderValue = (selected: any) => {
    if (props.multiple) {
      const selectedOptions = options.filter(option => 
        Array.isArray(selected) && selected.includes(option.value)
      );
      
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {selectedOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              size="small"
              sx={{
                height: 24,
                '& .MuiChip-label': {
                  fontSize: '0.75rem'
                }
              }}
            />
          ))}
        </Box>
      );
    }

    const selectedOption = options.find(option => option.value === selected);
    return selectedOption ? selectedOption.label : '';
  };

  return (
    <FormControl 
      fullWidth 
      error={Boolean(error)}
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
          }
        },
        '& .MuiInputLabel-root': {
          fontWeight: 500,
          '&.Mui-focused': {
            color: getBorderColor(),
            fontWeight: 600,
          }
        },
        ...sx
      }}
    >
      {label && <InputLabel>{label}</InputLabel>}
      
      <Select
        {...props}
        variant={variant}
        renderValue={renderValue}
        startAdornment={icon ? (
          <InputAdornment position="start">
            <Box sx={{ 
              color: error ? 'error.main' : success ? 'success.main' : 'text.secondary',
              display: 'flex',
              alignItems: 'center'
            }}>
              {icon}
            </Box>
          </InputAdornment>
        ) : undefined}
        IconComponent={ExpandMore}
        MenuProps={{
          PaperProps: {
            sx: {
              borderRadius: 2,
              mt: 1,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: `1px solid ${theme.palette.divider}`,
              maxHeight: 300,
              '& .MuiMenuItem-root': {
                borderRadius: 1,
                mx: 1,
                my: 0.5,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  transform: 'translateX(4px)',
                },
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.16),
                  }
                }
              }
            }
          }
        }}
      >
        {/* Search Input */}
        {searchable && (
          <Box sx={{ p: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
                fontSize: '0.875rem',
                outline: 'none',
                backgroundColor: theme.palette.background.default
              }}
            />
          </Box>
        )}

        {filteredOptions.map((option) => (
          <MenuItem 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {showCheckbox && props.multiple && (
              <ListItemIcon>
                <Checkbox
                  checked={Array.isArray(props.value) && props.value.includes(option.value)}
                  size="small"
                />
              </ListItemIcon>
            )}
            
            {option.icon && (
              <ListItemIcon sx={{ minWidth: 36 }}>
                {option.icon}
              </ListItemIcon>
            )}
            
            <ListItemText 
              primary={option.label}
              secondary={option.description}
              sx={{
                '& .MuiListItemText-primary': {
                  fontWeight: 500,
                  fontSize: '0.875rem'
                },
                '& .MuiListItemText-secondary': {
                  fontSize: '0.75rem'
                }
              }}
            />
            
            {!showCheckbox && !props.multiple && props.value === option.value && (
              <Check sx={{ color: 'primary.main', ml: 1 }} />
            )}
          </MenuItem>
        ))}
        
        {filteredOptions.length === 0 && (
          <MenuItem disabled>
            <ListItemText primary="Không tìm thấy kết quả" />
          </MenuItem>
        )}
      </Select>
      
      {helperText && (
        <FormHelperText sx={{ ml: 0, mt: 1, fontSize: '0.875rem' }}>
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default ProfessionalSelect;
