import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Download,
  PictureAsPdf,
  TableChart,
  DataArray
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface ExportButtonProps {
  onExport: (format: string, options?: any) => Promise<void>;
  disabled?: boolean;
  data?: any;
  filename?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  disabled = false,
  data,
  filename = 'dashboard_export'
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExport = async (format: string) => {
    setLoading(format);
    handleClose();

    try {
      await onExport(format, { filename, data });
      setNotification({
        open: true,
        message: `Export completed successfully (${format.toUpperCase()})`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Export failed:', error);
      setNotification({
        open: true,
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setLoading(null);
    }
  };

  const exportOptions = [
    {
      format: 'pdf',
      label: 'PDF Report',
      icon: <PictureAsPdf />,
      description: 'Formatted report with charts'
    },
    {
      format: 'excel',
      label: 'Excel Spreadsheet',
      icon: <TableChart />,
      description: 'Raw data in Excel format'
    },
    {
      format: 'csv',
      label: 'CSV Data',
      icon: <DataArray />,
      description: 'Comma-separated values'
    }
  ];

  return (
    <>
      <Button
        startIcon={loading ? <CircularProgress size={16} /> : <Download />}
        onClick={handleClick}
        disabled={disabled || loading !== null}
        variant="outlined"
        sx={{
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {loading ? `Exporting ${loading.toUpperCase()}...` : 'Export'}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5
            }
          }
        }}
      >
        {exportOptions.map((option, index) => (
          <motion.div
            key={option.format}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <MenuItem
              onClick={() => handleExport(option.format)}
              disabled={loading === option.format}
            >
              <ListItemIcon>
                {loading === option.format ? (
                  <CircularProgress size={20} />
                ) : (
                  option.icon
                )}
              </ListItemIcon>
              <ListItemText
                primary={option.label}
                secondary={option.description}
                secondaryTypographyProps={{
                  variant: 'caption',
                  color: 'text.secondary'
                }}
              />
            </MenuItem>
          </motion.div>
        ))}
      </Menu>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};
