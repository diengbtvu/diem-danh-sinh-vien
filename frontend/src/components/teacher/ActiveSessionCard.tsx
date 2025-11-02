import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  IconButton,
  Stack,
  Tooltip
} from '@mui/material';
import {
  Visibility,
  QrCode2,
  CheckCircle,
  Schedule,
  People
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface ActiveSessionCardProps {
  session: {
    sessionId: string;
    maLop: string;
    startAt: string;
    endAt: string;
    attendanceCount?: number;
    totalStudents?: number;
    isActive: boolean;
  };
  onViewDetail: (sessionId: string) => void;
  onShowQR: (sessionId: string) => void;
}

export const ActiveSessionCard: React.FC<ActiveSessionCardProps> = ({
  session,
  onViewDetail,
  onShowQR
}) => {
  const attendanceRate = session.totalStudents 
    ? (session.attendanceCount || 0) / session.totalStudents * 100
    : 0;

  const getStatusColor = () => {
    if (attendanceRate >= 80) return 'success.main';
    if (attendanceRate >= 50) return 'warning.main';
    return 'error.main';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.2 }}
    >
      <Card sx={{ 
        height: '100%',
        borderRadius: 2,
        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
        border: '1px solid',
        borderColor: session.isActive ? '#1976d2' : 'grey.300',
        bgcolor: session.isActive ? '#f5f9ff' : '#ffffff'
      }}>
        {/* Active Badge */}
        {session.isActive && (
          <Box sx={{ 
            bgcolor: '#1976d2',
            color: 'white',
            px: 1.5,
            py: 0.5,
            borderRadius: '0 0 8px 0',
            position: 'absolute',
            top: 0,
            left: 0,
            fontSize: '0.75rem',
            fontWeight: 600
          }}>
            Đang hoạt động
          </Box>
        )}

        <CardContent sx={{ p: 2.5, pt: session.isActive ? 4 : 2.5 }}>
          {/* Class Name */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
              {session.maLop}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
              {session.sessionId.substring(0, 13)}...
            </Typography>
          </Box>

          {/* Time Info */}
          <Box sx={{ mb: 2, py: 1.5, px: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Thời gian
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {new Date(session.startAt).toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
              {' - '}
              {new Date(session.endAt).toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Typography>
          </Box>

          {/* Attendance Progress */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Điểm danh
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: getStatusColor() }}>
                {session.attendanceCount || 0}/{session.totalStudents || 0}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={attendanceRate}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  bgcolor: getStatusColor()
                }
              }}
            />
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ mt: 0.5, display: 'block' }}
            >
              {attendanceRate.toFixed(0)}% đã điểm danh
            </Typography>
          </Box>

          {/* Actions */}
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<Visibility />}
              onClick={() => onViewDetail(session.sessionId)}
              sx={{ 
                borderColor: '#1976d2',
                color: '#1976d2',
                '&:hover': {
                  borderColor: '#1565c0',
                  bgcolor: '#f5f5f5'
                }
              }}
            >
              Chi tiết
            </Button>
            {session.isActive && (
              <Button
                fullWidth
                variant="contained"
                size="small"
                startIcon={<QrCode2 />}
                onClick={() => onShowQR(session.sessionId)}
                sx={{
                  bgcolor: '#1976d2',
                  '&:hover': {
                    bgcolor: '#1565c0'
                  }
                }}
              >
                QR Code
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
};
