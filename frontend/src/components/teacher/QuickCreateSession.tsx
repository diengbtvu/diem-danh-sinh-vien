import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Stack,
  Alert,
  Chip
} from '@mui/material';
import {
  Add,
  QrCode2,
  Schedule,
  School
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import LoadingButton from '../LoadingButton';

interface QuickCreateSessionProps {
  classes: string[];
  onCreateSession: (data: { maLop: string; durationMinutes: number; showQR: boolean }) => Promise<void>;
  loading?: boolean;
}

export const QuickCreateSession: React.FC<QuickCreateSessionProps> = ({
  classes,
  onCreateSession,
  loading = false
}) => {
  const [maLop, setMaLop] = useState('');
  const [duration, setDuration] = useState(30);
  const [error, setError] = useState('');

  const handleCreate = async (showQR: boolean) => {
    if (!maLop) {
      setError('Vui lòng chọn lớp học');
      return;
    }
    
    setError('');
    try {
      await onCreateSession({ maLop, durationMinutes: duration, showQR });
      // Reset form after successful creation
      setMaLop('');
      setDuration(30);
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card sx={{ 
        borderRadius: 2,
        bgcolor: '#ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '2px solid #1976d2'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box sx={{ 
              bgcolor: '#e3f2fd', 
              borderRadius: 1, 
              p: 1,
              mr: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Add sx={{ fontSize: 28, color: '#1976d2' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                Tạo phiên điểm danh mới
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Chọn lớp học và thời gian để bắt đầu
              </Typography>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2.5}>
            <FormControl fullWidth>
              <InputLabel>Lớp học</InputLabel>
              <Select
                value={maLop}
                label="Lớp học"
                onChange={(e) => setMaLop(e.target.value)}
              >
                {classes.length === 0 ? (
                  <MenuItem disabled>Chưa có lớp nào</MenuItem>
                ) : (
                  classes.map((className) => (
                    <MenuItem key={className} value={className}>
                      {className}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="number"
              label="Thời gian (phút)"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              inputProps={{ min: 5, max: 180 }}
            />

            <Stack direction="row" spacing={2}>
              <LoadingButton
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => handleCreate(false)}
                loading={loading}
                startIcon={<Add />}
                sx={{
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#1565c0',
                    bgcolor: '#f5f5f5'
                  }
                }}
              >
                Tạo phiên
              </LoadingButton>
              
              <LoadingButton
                fullWidth
                variant="contained"
                size="large"
                onClick={() => handleCreate(true)}
                loading={loading}
                startIcon={<QrCode2 />}
                sx={{
                  bgcolor: '#1976d2',
                  color: 'white',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#1565c0'
                  }
                }}
              >
                Tạo và hiển thị QR
              </LoadingButton>
            </Stack>

            {classes.length === 0 && (
              <Alert severity="info">
                Bạn chưa có lớp nào. Vui lòng tạo lớp học trước khi tạo phiên điểm danh.
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
};
