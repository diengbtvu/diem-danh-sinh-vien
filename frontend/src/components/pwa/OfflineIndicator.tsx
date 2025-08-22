import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Box,
  Typography,
  IconButton,
  Slide,
  useTheme
} from '@mui/material';
import {
  WifiOff,
  Wifi,
  Sync,
  Close
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface OfflineIndicatorProps {
  isOffline: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ isOffline }) => {
  const theme = useTheme();
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [showOnlineAlert, setShowOnlineAlert] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (isOffline && !wasOffline) {
      setShowOfflineAlert(true);
      setWasOffline(true);
    } else if (!isOffline && wasOffline) {
      setShowOfflineAlert(false);
      setShowOnlineAlert(true);
      setWasOffline(false);
      
      // Auto hide online alert after 3 seconds
      setTimeout(() => {
        setShowOnlineAlert(false);
      }, 3000);
    }
  }, [isOffline, wasOffline]);

  return (
    <>
      {/* Persistent Offline Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: theme.zIndex.appBar + 1,
              background: 'linear-gradient(45deg, #f59e0b 30%, #f97316 90%)',
              color: 'white',
              padding: theme.spacing(1, 2),
              boxShadow: theme.shadows[4]
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={1}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <WifiOff fontSize="small" />
              </motion.div>
              <Typography variant="body2" fontWeight={500}>
                Đang offline - Một số tính năng có thể bị hạn chế
              </Typography>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Sync fontSize="small" />
              </motion.div>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Alert */}
      <Snackbar
        open={showOfflineAlert}
        onClose={() => setShowOfflineAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Slide}
      >
        <Alert
          severity="warning"
          variant="filled"
          onClose={() => setShowOfflineAlert(false)}
          icon={<WifiOff />}
          sx={{
            background: 'linear-gradient(45deg, #f59e0b 30%, #f97316 90%)',
            '& .MuiAlert-icon': {
              color: 'white'
            }
          }}
        >
          <AlertTitle>Mất kết nối mạng</AlertTitle>
          <Typography variant="body2">
            Ứng dụng đang hoạt động ở chế độ offline. 
            Dữ liệu sẽ được đồng bộ khi có kết nối trở lại.
          </Typography>
        </Alert>
      </Snackbar>

      {/* Online Alert */}
      <Snackbar
        open={showOnlineAlert}
        onClose={() => setShowOnlineAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        autoHideDuration={3000}
        TransitionComponent={Slide}
      >
        <Alert
          severity="success"
          variant="filled"
          icon={
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Wifi />
            </motion.div>
          }
          sx={{
            background: 'linear-gradient(45deg, #10b981 30%, #059669 90%)'
          }}
        >
          <AlertTitle>Đã kết nối lại</AlertTitle>
          <Typography variant="body2">
            Kết nối mạng đã được khôi phục. Đang đồng bộ dữ liệu...
          </Typography>
        </Alert>
      </Snackbar>
    </>
  );
};

// Offline Status Component for use in other parts of the app
export const OfflineStatus: React.FC<{ isOffline: boolean }> = ({ isOffline }) => {
  if (!isOffline) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      <Box
        display="inline-flex"
        alignItems="center"
        gap={0.5}
        px={1}
        py={0.5}
        borderRadius={1}
        bgcolor="warning.main"
        color="warning.contrastText"
        fontSize="0.75rem"
        fontWeight={500}
      >
        <WifiOff fontSize="inherit" />
        Offline
      </Box>
    </motion.div>
  );
};
