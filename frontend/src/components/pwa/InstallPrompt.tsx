import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  GetApp,
  Close,
  PhoneIphone,
  Computer,
  CloudOff,
  Speed,
  Security
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface InstallPromptProps {
  open: boolean;
  onClose: () => void;
  onInstall: () => Promise<boolean>;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({
  open,
  onClose,
  onInstall
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleInstall = async () => {
    const success = await onInstall();
    if (success) {
      onClose();
    }
  };

  const features = [
    {
      icon: <CloudOff color="primary" />,
      title: 'Hoạt động offline',
      description: 'Sử dụng được khi không có mạng'
    },
    {
      icon: <Speed color="primary" />,
      title: 'Tải nhanh hơn',
      description: 'Khởi động nhanh như ứng dụng gốc'
    },
    {
      icon: <Security color="primary" />,
      title: 'An toàn & bảo mật',
      description: 'Dữ liệu được mã hóa và bảo vệ'
    }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        component: motion.div,
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.9, opacity: 0 },
        transition: { duration: 0.2 }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <GetApp color="primary" fontSize="large" />
            <Typography variant="h6" fontWeight={600}>
              Cài đặt ứng dụng
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Hero Section */}
          <Box textAlign="center" py={2}>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Box
                component="img"
                src="/icons/icon-192x192.png"
                alt="App Icon"
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 2,
                  mb: 2,
                  boxShadow: theme.shadows[4]
                }}
              />
              <Typography variant="h6" gutterBottom>
                Hệ thống Điểm danh Sinh viên
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cài đặt ứng dụng để có trải nghiệm tốt nhất
              </Typography>
            </motion.div>
          </Box>

          {/* Features */}
          <Stack spacing={2}>
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  gap={2}
                  p={2}
                  borderRadius={2}
                  bgcolor="background.paper"
                  border={1}
                  borderColor="divider"
                >
                  {feature.icon}
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </Stack>

          {/* Device Info */}
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            p={2}
            borderRadius={2}
            bgcolor="primary.50"
            border={1}
            borderColor="primary.200"
          >
            {isMobile ? <PhoneIphone color="primary" /> : <Computer color="primary" />}
            <Typography variant="body2" color="primary.main">
              Tương thích với {isMobile ? 'điện thoại' : 'máy tính'} của bạn
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          fullWidth={isMobile}
          sx={{ mr: isMobile ? 0 : 1 }}
        >
          Để sau
        </Button>
        <Button
          onClick={handleInstall}
          variant="contained"
          startIcon={<GetApp />}
          fullWidth={isMobile}
          sx={{
            background: 'linear-gradient(45deg, #2563eb 30%, #3b82f6 90%)',
            boxShadow: theme.shadows[4],
            '&:hover': {
              boxShadow: theme.shadows[8]
            }
          }}
        >
          Cài đặt ngay
        </Button>
      </DialogActions>
    </Dialog>
  );
};
