import React from 'react'
import {
  AppBar, Toolbar, Typography, Container, Box, Grid, Paper, Button,
  Card, CardContent, CardActions, List, ListItem, ListItemIcon, ListItemText,
  Divider, Stack, Chip
} from '@mui/material'
import {
  School, QrCodeScanner, CameraAlt, Assessment, Security, Speed,
  CheckCircle, People, Dashboard, Login
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import VisitorCounter from '../components/VisitorCounter'

export default function HomePage() {
  const navigate = useNavigate()

  const features = [
    {
      icon: <QrCodeScanner />,
      title: 'QR Code Điểm Danh',
      description: 'Hệ thống QR code động với 2 lớp bảo mật, tự động xoay mã để chống gian lận'
    },
    {
      icon: <CameraAlt />,
      title: 'Nhận Diện Khuôn Mặt',
      description: 'Tích hợp AI nhận diện khuôn mặt để xác thực danh tính sinh viên'
    },
    {
      icon: <Assessment />,
      title: 'Báo Cáo Thống Kê',
      description: 'Dashboard quản lý với thống kê chi tiết, xuất báo cáo Excel'
    },
    {
      icon: <Security />,
      title: 'Bảo Mật Cao',
      description: 'Mã hóa HMAC, token có thời hạn, chống giả mạo QR code'
    },
    {
      icon: <Speed />,
      title: 'Thời Gian Thực',
      description: 'Cập nhật trạng thái điểm danh ngay lập tức, không cần refresh'
    },
    {
      icon: <People />,
      title: 'Quản Lý Sinh Viên',
      description: 'Import danh sách sinh viên từ Excel, quản lý thông tin lớp học'
    }
  ]

  const steps = [
    {
      step: '1',
      title: 'Giảng viên tạo buổi học',
      description: 'Tạo session điểm danh với thông tin lớp học và thời gian'
    },
    {
      step: '2', 
      title: 'Hiển thị QR Code',
      description: 'QR A hiển thị trên màn hình lớp, QR B xuất hiện khi cần thiết'
    },
    {
      step: '3',
      title: 'Sinh viên quét QR',
      description: 'Quét QR A để mở trang điểm danh, sau đó quét QR B'
    },
    {
      step: '4',
      title: 'Chụp ảnh xác thực',
      description: 'Chụp ảnh khuôn mặt để hệ thống AI xác thực danh tính'
    },
    {
      step: '5',
      title: 'Kết quả điểm danh',
      description: 'Hệ thống xử lý và hiển thị kết quả điểm danh ngay lập tức'
    }
  ]

  return (
    <>
      {/* Header */}
      <AppBar position="static" sx={{ backgroundColor: '#1976d2', borderRadius: 0 }}>
        <Toolbar>
          <School sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Hệ Thống Điểm Danh - Đại Học An Giang
          </Typography>
          <Button
            color="inherit"
            startIcon={<Login />}
            onClick={() => navigate('/admin')}
          >
            Đăng nhập
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box sx={{ backgroundColor: '#f5f5f5', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700, color: '#1976d2' }}>
                Hệ Thống Điểm Danh Thông Minh
              </Typography>
              <Typography variant="h5" color="text.secondary" paragraph sx={{ mb: 2 }}>
                Giải pháp điểm danh hiện đại với QR Code và AI nhận diện khuôn mặt
                dành cho Đại học An Giang
              </Typography>
              <Typography variant="body1" color="warning.main" sx={{ mb: 4, fontStyle: 'italic' }}>
                Hệ thống đang trong quá trình phát triển và thử nghiệm
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button 
                  variant="contained" 
                  size="large" 
                  startIcon={<QrCodeScanner />}
                  onClick={() => navigate('/attend')}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Điểm Danh Ngay
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Dashboard />}
                  onClick={() => navigate('/admin')}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Xem Demo
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 4, textAlign: 'center', backgroundColor: 'white' }}>
                <QrCodeScanner sx={{ fontSize: 120, color: '#1976d2', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Quét QR Code để điểm danh
                </Typography>
                <Typography color="text.secondary">
                  Nhanh chóng, chính xác, bảo mật cao
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom sx={{ fontWeight: 600, mb: 6 }}>
          Tính Năng Nổi Bật
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  <Box sx={{ color: '#1976d2', mb: 2 }}>
                    {React.cloneElement(feature.icon, { sx: { fontSize: 48 } })}
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How it works */}
      <Box sx={{ backgroundColor: '#f5f5f5', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" textAlign="center" gutterBottom sx={{ fontWeight: 600, mb: 6 }}>
            Cách Thức Hoạt Động
          </Typography>
          <Grid container spacing={4}>
            {steps.map((step, index) => (
              <Grid item xs={12} md={2.4} key={index}>
                <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                  <CardContent>
                    <Chip 
                      label={step.step} 
                      sx={{ 
                        backgroundColor: '#1976d2', 
                        color: 'white', 
                        fontSize: '1.2rem',
                        width: 40,
                        height: 40,
                        mb: 2
                      }} 
                    />
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      {step.title}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {step.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* About Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              Về Đại Học An Giang
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
              Đại học An Giang là một trong những trường đại học hàng đầu khu vực Đồng bằng sông Cửu Long,
              luôn tiên phong trong việc ứng dụng công nghệ vào giáo dục.
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
              Hệ thống điểm danh thông minh này được phát triển nhằm nâng cao chất lượng quản lý giáo dục,
              giúp giảng viên và sinh viên có trải nghiệm học tập tốt hơn.
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle sx={{ color: '#4caf50' }} />
                </ListItemIcon>
                <ListItemText primary="Tiết kiệm thời gian điểm danh" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle sx={{ color: '#4caf50' }} />
                </ListItemIcon>
                <ListItemText primary="Chống gian lận hiệu quả" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle sx={{ color: '#4caf50' }} />
                </ListItemIcon>
                <ListItemText primary="Báo cáo thống kê chi tiết" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle sx={{ color: '#4caf50' }} />
                </ListItemIcon>
                <ListItemText primary="Dễ sử dụng, thân thiện" />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 4, backgroundColor: '#1976d2', color: 'white', textAlign: 'center' }}>
              <School sx={{ fontSize: 80, mb: 2 }} />
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                Đại Học An Giang
              </Typography>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Đổi mới - Sáng tạo - Phát triển
              </Typography>
              <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.3)' }} />
              <Typography variant="body1">
                Địa chỉ: 18 Ung Văn Khiêm, Phường Đông Xuyên, TP. Long Xuyên, An Giang
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                Website: www.agu.edu.vn
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ backgroundColor: '#1976d2', color: 'white', py: 6 }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Sẵn sàng trải nghiệm?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Bắt đầu sử dụng hệ thống điểm danh thông minh ngay hôm nay
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{ backgroundColor: 'white', color: '#1976d2', '&:hover': { backgroundColor: '#f5f5f5' } }}
            startIcon={<QrCodeScanner />}
            onClick={() => navigate('/attend')}
          >
            Điểm Danh Ngay
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ backgroundColor: '#333', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <VisitorCounter />
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Đại Học An Giang
              </Typography>
              <Typography variant="body2" color="grey.400" paragraph>
                Trường đại học công lập đa ngành, đa lĩnh vực tại khu vực Đồng bằng sông Cửu Long
              </Typography>
              <Typography variant="body2" color="grey.400">
                <strong>Địa chỉ:</strong> 18 Ung Văn Khiêm, Phường Đông Xuyên, TP. Long Xuyên, An Giang
              </Typography>
              <Typography variant="body2" color="grey.400">
                <strong>Điện thoại:</strong> (0296) 3841 390
              </Typography>
              <Typography variant="body2" color="grey.400">
                <strong>Email:</strong> dhag@agu.edu.vn
              </Typography>
              <Typography variant="body2" color="grey.400">
                <strong>Website:</strong> www.agu.edu.vn
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Hệ Thống Điểm Danh
              </Typography>
              <Typography variant="body2" color="grey.400" paragraph>
                Giải pháp điểm danh thông minh với công nghệ QR Code và AI nhận diện khuôn mặt
              </Typography>
              <Typography variant="body2" color="grey.400">
                <strong>Phiên bản:</strong> 1.0.0
              </Typography>
              <Typography variant="body2" color="grey.400">
                <strong>Cập nhật:</strong> Tháng 8, 2024
              </Typography>
              <Typography variant="body2" color="grey.400">
                <strong>Hỗ trợ:</strong> support@agu.edu.vn
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Phát Triển Bởi
              </Typography>
              <Typography variant="body2" color="grey.400" paragraph>
                Khoa Công nghệ Thông tin<br />
                Đại học An Giang
              </Typography>
              <Typography variant="body2" color="orange.300" sx={{ fontStyle: 'italic' }}>
                Trang web đang trong quá trình phát triển
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4, borderColor: 'grey.700' }} />

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="body2" color="grey.400">
                © 2024 Đại học An Giang. Tất cả quyền được bảo lưu.
              </Typography>
              <Typography variant="body2" color="orange.300" sx={{ mt: 1, fontStyle: 'italic' }}>
                Trang web đang trong quá trình phát triển - Một số tính năng có thể chưa hoàn thiện
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Typography variant="body2" color="grey.400">
                Phiên bản 1.0.0 - Build 2024.08
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  )
}
