import React from 'react'
import {
  Typography, Box, Grid, Button,
  Stack, useTheme, alpha
} from '@mui/material'
import {
  School, QrCodeScanner, Assessment, Security, Speed,
  CheckCircle, People, Dashboard, Login, AutoAwesome,
  TrendingUp, Shield, Bolt
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useVisitorCounter } from '../hooks/useVisitorCounter'
import { useAuth } from '../hooks/useAuth'
import ProfessionalLayout from '../components/ProfessionalLayout'
import ProfessionalCard, { StatsCard } from '../components/ProfessionalCard'

export default function HomePage() {
  const navigate = useNavigate()
  const theme = useTheme()
  const { totalVisits, todayVisits, onlineUsers } = useVisitorCounter()
  const { isAuthenticated, user, logout } = useAuth()

  const handleDashboardNavigation = () => {
    if (user?.role === 'ADMIN') {
      navigate('/admin-dashboard')
    } else if (user?.role === 'GIANGVIEN') {
      navigate('/teacher-dashboard')
    }
  }

  const formatNumber = (num: number): string => {
    return num.toLocaleString('vi-VN')
  }

  const features = [
    {
      icon: <QrCodeScanner sx={{ fontSize: 28 }} />,
      title: 'QR Code Thông Minh',
      description: 'Hệ thống QR code động với 2 lớp bảo mật, tự động xoay mã để chống gian lận',
      color: 'primary' as const
    },
    {
      icon: <Shield sx={{ fontSize: 28 }} />,
      title: 'Bảo Mật Tuyệt Đối',
      description: 'Mã hóa HMAC, token có thời hạn, chống giả mạo QR code hoàn toàn',
      color: 'error' as const
    },
    {
      icon: <Bolt sx={{ fontSize: 28 }} />,
      title: 'Thời Gian Thực',
      description: 'Cập nhật trạng thái điểm danh ngay lập tức với WebSocket',
      color: 'warning' as const
    },
    {
      icon: <Assessment sx={{ fontSize: 28 }} />,
      title: 'Thống Kê Thông Minh',
      description: 'Dashboard analytics với AI insights và báo cáo tự động',
      color: 'success' as const
    },
    {
      icon: <AutoAwesome sx={{ fontSize: 28 }} />,
      title: 'AI Face Recognition',
      description: 'Nhận diện khuôn mặt với độ chính xác cao, chống gian lận',
      color: 'secondary' as const
    },
    {
      icon: <People sx={{ fontSize: 28 }} />,
      title: 'Quản Lý Toàn Diện',
      description: 'Import Excel, quản lý sinh viên, lớp học một cách dễ dàng',
      color: 'primary' as const
    }
  ]

  return (
    <ProfessionalLayout
      headerProps={{
        title: "Hệ thống điểm danh thông minh",
        subtitle: "Đại học An Giang - Công nghệ AI & QR Code",
        user: isAuthenticated ? {
          name: user?.hoTen || 'User',
          role: user?.role || 'USER'
        } : undefined,
        onLogout: logout,
        onDashboard: handleDashboardNavigation,
        showActions: isAuthenticated
      }}
    >
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          borderRadius: 4,
          p: { xs: 4, md: 6 },
          mb: 6,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23000000" fill-opacity="0.02"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.5
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              mb: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '2rem', md: '3rem' }
            }}
          >
            Điểm danh thông minh với AI
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: 'text.secondary',
              mb: 4,
              maxWidth: 600,
              mx: 'auto',
              lineHeight: 1.6
            }}
          >
            Hệ thống điểm danh hiện đại với QR Code động, nhận diện khuôn mặt AI và bảo mật tuyệt đối
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{ mb: 4 }}
          >
            {!isAuthenticated ? (
              <>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Login />}
                  onClick={() => navigate('/login')}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    '&:hover': {
                      boxShadow: '0 12px 40px rgba(0,0,0,0.16)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Đăng nhập hệ thống
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<QrCodeScanner />}
                  onClick={() => navigate('/attend')}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 3,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Điểm danh ngay
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                size="large"
                startIcon={<Dashboard />}
                onClick={handleDashboardNavigation}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  '&:hover': {
                    boxShadow: '0 12px 40px rgba(0,0,0,0.16)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Vào Dashboard
              </Button>
            )}
          </Stack>
        </Box>
      </Box>

      {/* Stats Section */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} md={4}>
          <StatsCard
            title="Tổng lượt truy cập"
            value={formatNumber(totalVisits)}
            icon={<TrendingUp sx={{ fontSize: 32 }} />}
            color="primary"
            trend="up"
            trendValue="+12% tuần này"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatsCard
            title="Truy cập hôm nay"
            value={formatNumber(todayVisits)}
            icon={<CheckCircle sx={{ fontSize: 32 }} />}
            color="success"
            trend="up"
            trendValue="+8% so với hôm qua"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatsCard
            title="Người dùng online"
            value={formatNumber(onlineUsers)}
            icon={<People sx={{ fontSize: 32 }} />}
            color="warning"
            trend="neutral"
            trendValue="Thời gian thực"
          />
        </Grid>
      </Grid>

      {/* Features Section */}
      <Box sx={{ mb: 6 }}>
        <Typography
          variant="h3"
          sx={{
            textAlign: 'center',
            mb: 2,
            fontWeight: 700,
            color: 'text.primary'
          }}
        >
          Tính năng nổi bật
        </Typography>
        <Typography
          variant="h6"
          sx={{
            textAlign: 'center',
            mb: 5,
            color: 'text.secondary',
            maxWidth: 600,
            mx: 'auto'
          }}
        >
          Hệ thống được thiết kế với công nghệ tiên tiến nhất để đảm bảo tính chính xác và bảo mật
        </Typography>

        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <ProfessionalCard
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                variant="gradient"
                color={feature.color}
                sx={{
                  height: '100%',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                  }
                }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          borderRadius: 4,
          p: { xs: 4, md: 6 },
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.3
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Sẵn sàng trải nghiệm?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Bắt đầu sử dụng hệ thống điểm danh thông minh ngay hôm nay
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AutoAwesome />}
            onClick={() => navigate(isAuthenticated ? (user?.role === 'ADMIN' ? '/admin-dashboard' : '/teacher-dashboard') : '/login')}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 3,
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.9),
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 32px rgba(255,255,255,0.3)'
              }
            }}
          >
            {isAuthenticated ? 'Vào Dashboard' : 'Bắt đầu ngay'}
          </Button>
        </Box>
      </Box>
    </ProfessionalLayout>
  )
}
