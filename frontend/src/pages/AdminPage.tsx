import React, { useEffect, useState, useCallback } from 'react'
import {
  AppBar, Toolbar, Typography, Container, Box, Grid, Paper, TextField,
  Button, Stack, Alert, Chip, IconButton, Tooltip, Fade, Avatar, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
  Card, CardContent, Table, TableContainer, TableHead, TableRow, TableCell, TableBody,
  Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton, Divider,
  Breadcrumbs, Link, Autocomplete, Tabs, Tab
} from '@mui/material'
import {
  Dashboard, School, People, QrCode, Add, Edit, Visibility, Delete,
  FileDownload, Refresh, TrendingUp, CheckCircle, Person, Assessment,
  Analytics, CalendarToday, Group, Class, BarChart, PieChart, Menu,
  Home, ContentCopy, Schedule, PlayArrow, Stop
} from '@mui/icons-material'
import LoadingButton from '../components/LoadingButton'
import StatusCard from '../components/StatusCard'
import StatCard from '../components/StatCard'
import ChartCard from '../components/ChartCard'
import DataTable from '../components/DataTable'
import NotificationCenter from '../components/NotificationCenter'
import StatusDistributionCard from '../components/StatusDistributionCard'
import { apiRequest } from '../config/api'

type Session = {
  sessionId: string
  maLop: string
  startAt: string
  endAt?: string | null
  rotateSeconds: number
}

type Student = {
  mssv: string
  maLop: string
  hoTen: string
}

type Page<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
}

type ClassInfo = {
  maLop: string
  studentCount: number
  sessionCount: number
}

type CreateSessionResponse = {
  sessionId: string
  sessionToken: string
  rotateSeconds: number
  qrUrlTemplate: string
  expiresAt: string
}

export default function AdminPage() {
  const [tab, setTab] = useState<'dashboard' | 'sessions' | 'students' | 'create'>('dashboard')
  const [csvText, setCsvText] = useState('')
  const [sessions, setSessions] = useState<Page<Session> | null>(null)
  const [students, setStudents] = useState<Page<Student> | null>(null)
  const [pageS, setPageS] = useState(0)
  const [pageStu, setPageStu] = useState(0)
  const [loading, setLoading] = useState(false)

  // Create session states
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null)
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [createLoading, setCreateLoading] = useState(false)
  const [createResult, setCreateResult] = useState<CreateSessionResponse | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)

  // QR states for created session
  const [createQrBData, setCreateQrBData] = useState<string>('')
  const [createQr2Active, setCreateQr2Active] = useState<boolean>(false)
  const [createQr2RemainMs, setCreateQr2RemainMs] = useState<number>(0)


  const [studentForm, setStudentForm] = useState<Partial<Student>>({})
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [editStudentForm, setEditStudentForm] = useState<Partial<Student>>({})
  const [editingSession, setEditingSession] = useState<Session | null>(null)

  const [qrSessionId, setQrSessionId] = useState<string>('')
  const [qrAUrl, setQrAUrl] = useState<string>('')
  const [qrBData, setQrBData] = useState<string>('')
  const [qr2Active, setQr2Active] = useState<boolean>(false)
  const [qr2RemainMs, setQr2RemainMs] = useState<number>(0)
  const [qrARemainMs, setQrARemainMs] = useState<number>(0)

  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [stats, setStats] = useState<{ total: number; accepted: number; review: number; rejected: number } | null>(null)
  const [dashboardStats, setDashboardStats] = useState<{ total: number; accepted: number; review: number; rejected: number } | null>(null)
  const [overview, setOverview] = useState<{
    totalSessions: number
    totalStudents: number
    totalAttendances: number
    recentAttendances: number
  } | null>(null)

  // Dialog states
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false)
  const [studentDialogOpen, setStudentDialogOpen] = useState(false)

  // Search and filter states
  const [sessionSearch, setSessionSearch] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [sessionSort, setSessionSort] = useState({ column: 'createdAt', direction: 'desc' as 'asc' | 'desc' })
  const [studentSort, setStudentSort] = useState({ column: 'hoTen', direction: 'asc' as 'asc' | 'desc' })



  // Poll rotating token and QR url for selected session to show QR on admin
  useEffect(() => {
    if (!qrSessionId) return
    let active = true
    const tick = async () => {
      try {
        const resp = await apiRequest(`/api/sessions/${qrSessionId}/status`)
        if (!resp.ok) {
          // Session not found or expired, stop polling
          if (resp.status === 404 || resp.status === 400) {
            console.log('Admin QR session expired or not found, stopping polling')
            setQrSessionId('') // Clear session ID to stop polling
            return
          }
          return
        }
        const json = await resp.json()
        if (active) {
          const sessionLink = `/attend?session=${encodeURIComponent(json.sessionToken)}`
          setQrAUrl(sessionLink)
          setQr2Active(!!json.qr2Active)
          setQr2RemainMs(json.validForMs || 0)
          setQrBData(json.rotatingToken || '')
          
          // Calculate QR A remaining time (30s rotation)
          const now = Date.now()
          const qrAIntervalMs = 30 * 1000 // 30 seconds
          const qrARemaining = qrAIntervalMs - (now % qrAIntervalMs)
          setQrARemainMs(qrARemaining)
          
          // QR URL is generated dynamically
        }
      } catch (err) {
        console.log('Admin QR polling error:', err)
        // Continue polling despite errors
      }
    }
    tick()
    const h = setInterval(tick, 1000)
    return () => {
      active = false
      clearInterval(h)
    }
  }, [qrSessionId])

  // Fetch functions
  const fetchSessions = useCallback(async () => {
    const params = new URLSearchParams({
      page: pageS.toString(),
      size: '25',
      sortBy: sessionSort.column,
      sortDir: sessionSort.direction,
      ...(sessionSearch && { search: sessionSearch })
    })
    const response = await apiRequest(`/api/admin/sessions?${params}`)
    const data = await response.json()
    setSessions(data)
  }, [pageS, sessionSort, sessionSearch])

  const fetchStudents = useCallback(async () => {
    const params = new URLSearchParams({
      page: pageStu.toString(),
      size: '20',
      sortBy: studentSort.column,
      sortDir: studentSort.direction,
      ...(studentSearch && { search: studentSearch })
    })
    const response = await apiRequest(`/api/admin/students?${params}`)
    const data = await response.json()
    setStudents(data)
  }, [pageStu, studentSort, studentSearch])



  const createStudent = async () => {
    setLoading(true)
    try {
      await apiRequest('/api/admin/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(studentForm) })
      setStudentForm({})
      setPageStu(0)
      apiRequest(`/api/admin/students?page=0&size=10`).then(r => r.json()).then(setStudents)
    } finally {
      setLoading(false)
    }
  }

  const updateStudent = async () => {
    if (!editingStudent) return
    setLoading(true)
    try {
      const response = await apiRequest(`/api/admin/students/${editingStudent.mssv}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editStudentForm)
      })
      if (response.ok) {
        setEditingStudent(null)
        setEditStudentForm({})
        fetchStudents()
      }
    } finally {
      setLoading(false)
    }
  }

  const openEditStudent = (student: Student) => {
    setEditingStudent(student)
    setEditStudentForm({
      maLop: student.maLop,
      hoTen: student.hoTen
    })
  }

  const updateSession = async () => {
    if (!editingSession) return
    setLoading(true)
    try {
      const response = await apiRequest(`/api/admin/sessions/${editingSession.sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maLop: editingSession.maLop,
          startAt: editingSession.startAt,
          endAt: editingSession.endAt,
          rotateSeconds: editingSession.rotateSeconds
        })
      })
      if (response.ok) {
        setEditingSession(null)
        fetchSessions()
      }
    } finally {
      setLoading(false)
    }
  }

  const openEditSession = (session: Session) => {
    setEditingSession(session)
  }

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Bạn có chắc muốn xóa buổi học này?')) return
    setLoading(true)
    try {
      const response = await apiRequest(`/api/admin/sessions/${sessionId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchSessions()
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = useCallback(async () => {
    if (!selectedSessionId) return
    try {
      const response = await apiRequest(`/api/admin/stats/${selectedSessionId}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [selectedSessionId])

  const fetchOverview = useCallback(async () => {
    try {
      const response = await apiRequest('/api/admin/dashboard/overview')
      if (response.ok) {
        const data = await response.json()
        console.log('Overview data received:', data)
        setOverview(data)
      }
    } catch (error) {
      console.error('Error fetching overview:', error)
    }
  }, [])

  const fetchDashboardStats = useCallback(async () => {
    try {
      const response = await apiRequest('/api/admin/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        console.log('Dashboard stats received:', data)
        setDashboardStats(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }, [])

  const importStudents = async () => {
    setLoading(true)
    try {
      const response = await apiRequest('/api/admin/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: csvText
      })
      if (response.ok) {
        setCsvText('')
        setPageStu(0)
        fetchStudents()
      }
    } finally {
      setLoading(false)
    }
  }

  // Load classes for create session
  const loadClasses = useCallback(async () => {
    try {
      const response = await apiRequest('/api/sessions/classes')
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes)
      } else {
        setCreateError('Không thể tải danh sách lớp')
      }
    } catch (err) {
      setCreateError('Lỗi kết nối server')
    }
  }, [])

  // Create session with simple API
  const handleCreateSession = async () => {
    if (!selectedClass) {
      setCreateError('Vui lòng chọn mã lớp')
      return
    }

    setCreateLoading(true)
    setCreateError(null)

    try {
      const response = await apiRequest('/api/sessions/simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maLop: selectedClass.maLop,
          durationMinutes
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCreateResult(data)

        // Activate QR B for the new session
        try {
          const activateResponse = await apiRequest(`/api/sessions/${data.sessionId}/activate-qr2`, {
            method: 'POST'
          })
          if (activateResponse.ok) {
            const qrData = await activateResponse.json()
            setCreateQrBData(qrData.rotatingToken || '')
            setCreateQr2Active(true)
            setCreateQr2RemainMs(qrData.validForMs || 0)
          }
        } catch (err) {
          console.error('Failed to activate QR B:', err)
        }

        // Refresh sessions list
        fetchSessions()
      } else {
        const errorText = await response.text()
        setCreateError(errorText || 'Không thể tạo buổi học')
      }
    } catch (err) {
      setCreateError('Lỗi kết nối server')
    } finally {
      setCreateLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('vi-VN')
  }

  // Effects for data fetching
  useEffect(() => {
    if (tab === 'sessions') {
      fetchSessions()
    }
  }, [tab, fetchSessions])

  useEffect(() => {
    if (tab === 'students') {
      fetchStudents()
    }
  }, [tab, fetchStudents])

  useEffect(() => {
    if (tab === 'create') {
      loadClasses()
    }
  }, [tab, loadClasses])

  useEffect(() => {
    if (tab === 'dashboard') {
      // Load basic data for dashboard
      fetchOverview()
      fetchDashboardStats()
      fetchSessions()
      fetchStudents()
      if (selectedSessionId) {
        fetchStats()
      }
    }
  }, [tab, selectedSessionId, fetchSessions, fetchStudents, fetchStats, fetchOverview, fetchDashboardStats])

  // Poll QR B for created session
  useEffect(() => {
    if (!createResult?.sessionId) return
    let active = true
    const tick = async () => {
      try {
        const resp = await apiRequest(`/api/sessions/${createResult.sessionId}/status`)
        if (!resp.ok) {
          // Session not found or expired, stop polling
          if (resp.status === 404 || resp.status === 400) {
            console.log('Session expired or not found, stopping QR polling')
            return
          }
          return
        }
        const json = await resp.json()
        if (active) {
          setCreateQr2Active(!!json.qr2Active)
          setCreateQr2RemainMs(json.validForMs || 0)
          setCreateQrBData(json.rotatingToken || '')
        }
      } catch (err) {
        console.log('QR polling error:', err)
        // Continue polling despite errors
      }
    }
    tick()
    const h = setInterval(tick, 1000)
    return () => {
      active = false
      clearInterval(h)
    }
  }, [createResult?.sessionId])

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#1976d2', borderRadius: 0, boxShadow: 'none', border: 'none' }}>
        <Toolbar>
          <Dashboard sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Quản trị hệ thống
          </Typography>
          <NotificationCenter sessionId={selectedSessionId} />
          <Chip
            label="Admin Panel"
            color="secondary"
            size="small"
            sx={{ color: 'white', fontWeight: 500 }}
          />
        </Toolbar>
      </AppBar>

      <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <Container sx={{ py: 4 }}>
          <Paper elevation={2} sx={{ mb: 3 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  minHeight: 64,
                  fontSize: '1rem',
                  fontWeight: 500
                }
              }}
            >
              <Tab
                value="dashboard"
                label="Dashboard"
                icon={<Dashboard />}
                iconPosition="start"
                sx={{ textTransform: 'none' }}
              />
              <Tab
                value="sessions"
                label="Quản lý buổi học"
                icon={<School />}
                iconPosition="start"
                sx={{ textTransform: 'none' }}
              />
              <Tab
                value="students"
                label="Quản lý sinh viên"
                icon={<People />}
                iconPosition="start"
                sx={{ textTransform: 'none' }}
              />
              <Tab
                value="create"
                label="Tạo buổi học"
                icon={<Add />}
                iconPosition="start"
                sx={{ textTransform: 'none' }}
              />
            </Tabs>
          </Paper>

          {/* Dashboard Tab */}
          {tab === 'dashboard' && (
            <Fade in={tab === 'dashboard'}>
              <Box>
                {/* Overview Stats */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                      title="Tổng buổi học"
                      value={overview?.totalSessions || 0}
                      subtitle="Buổi học đã tạo"
                      icon={<School />}
                      color="primary"

                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                      title="Sinh viên"
                      value={overview?.totalStudents || 0}
                      subtitle="Đã đăng ký"
                      icon={<People />}
                      color="secondary"

                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                      title="Điểm danh hôm nay"
                      value={overview?.recentAttendances || 0}
                      subtitle="Lượt điểm danh"
                      icon={<CheckCircle />}
                      color="success"
                      progress={{
                        value: dashboardStats?.accepted || 0,
                        max: dashboardStats?.total || 1,
                        label: 'Thành công'
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                      title="Tỷ lệ thành công"
                      value={dashboardStats ? `${Math.round((dashboardStats.accepted / Math.max(dashboardStats.total, 1)) * 100)}%` : '0%'}
                      subtitle="Điểm danh thành công"
                      icon={<TrendingUp />}
                      color="info"

                    />
                  </Grid>
                </Grid>

                {/* Charts and Analytics */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={8}>
                    <ChartCard
                      title="Thống kê điểm danh theo trạng thái"
                      subtitle={selectedSessionId ? "Dữ liệu từ session hiện tại" : "Dữ liệu tổng hợp"}
                      type="bar"
                      data={(() => {
                        const currentStats = stats || dashboardStats;
                        const chartData = [
                          { label: 'Thành công', value: currentStats?.accepted || 0, color: '#10b981' },
                          { label: 'Cần xem xét', value: currentStats?.review || 0, color: '#f59e0b' },
                          { label: 'Thất bại', value: currentStats?.rejected || 0, color: '#ef4444' }
                        ];
                        console.log('ChartCard data:', chartData, 'currentStats:', currentStats);
                        return chartData;
                      })()}
                      height={300}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <StatusDistributionCard
                      stats={stats || dashboardStats || { total: 0, accepted: 0, review: 0, rejected: 0 }}
                      sessionId={selectedSessionId}
                      onViewDetails={(status) => {
                        if (selectedSessionId) {
                          // Xem chi tiết session cụ thể
                          window.open(`/attendance-detail?sessionId=${selectedSessionId}&status=${status}`, '_blank')
                        } else {
                          // Xem tất cả điểm danh từ tất cả sessions
                          window.open(`/attendance-detail?status=${status}`, '_blank')
                        }
                      }}
                      onBulkUpdate={async (fromStatus, toStatus, count) => {
                        if (!selectedSessionId) return
                        setLoading(true)
                        try {
                          const response = await fetch('/api/admin/attendances/bulk-update', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              sessionId: selectedSessionId,
                              fromStatus: fromStatus.toUpperCase(),
                              toStatus: toStatus.toUpperCase()
                            })
                          })
                          if (response.ok) {
                            const result = await response.json()
                            alert(`Đã cập nhật ${result.updatedCount} bản ghi từ "${fromStatus}" thành "${toStatus}"`)
                            fetchStats()
                          }
                        } catch (error) {
                          console.error('Error bulk updating:', error)
                          alert('Có lỗi xảy ra khi cập nhật hàng loạt')
                        } finally {
                          setLoading(false)
                        }
                      }}
                    />
                  </Grid>
                </Grid>

                {/* Quick Actions */}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Assessment sx={{ mr: 2, color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Thống kê nhanh
                        </Typography>
                      </Box>
                      <Stack spacing={2}>
                        <TextField
                          size="small"
                          label="Session ID để xem thống kê"
                          value={selectedSessionId}
                          onChange={(e) => setSelectedSessionId(e.target.value)}
                          fullWidth
                        />
                        <LoadingButton
                          variant="contained"
                          onClick={() => selectedSessionId && fetchStats()}
                          disabled={!selectedSessionId}
                          startIcon={<Refresh />}
                          fullWidth
                        >
                          Xem thống kê
                        </LoadingButton>
                      </Stack>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <QrCode sx={{ mr: 2, color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          QR Code nhanh
                        </Typography>
                      </Box>
                      <Stack spacing={2}>
                        <TextField
                          size="small"
                          label="Session ID để hiển thị QR"
                          value={qrSessionId}
                          onChange={(e) => setQrSessionId(e.target.value)}
                          fullWidth
                        />
                        {qrSessionId && qrAUrl && (
                          <Box sx={{ textAlign: 'center' }}>
                            <img
                              alt="QR Code"
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + qrAUrl)}`}
                              style={{ borderRadius: 12, maxWidth: '100%' }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              QR A - Mã xoay (30s)
                            </Typography>
                            {qrARemainMs > 0 && (
                              <Box sx={{ 
                                mt: 1, 
                                p: 0.5,
                                bgcolor: 'primary.50',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'primary.200'
                              }}>
                                <Typography variant="caption" sx={{ 
                                  color: 'primary.main',
                                  fontWeight: 600,
                                  fontSize: '0.7rem'
                                }}>
                                  🕒 Làm mới sau: {Math.ceil(qrARemainMs / 1000)}s
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Add sx={{ mr: 2, color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Hành động nhanh
                        </Typography>
                      </Box>
                      <Stack spacing={2}>
                        <LoadingButton
                          variant="contained"
                          startIcon={<School />}
                          onClick={() => setTab('sessions')}
                          fullWidth
                        >
                          Tạo buổi học mới
                        </LoadingButton>
                        <LoadingButton
                          variant="outlined"
                          startIcon={<People />}
                          onClick={() => setTab('students')}
                          fullWidth
                        >
                          Quản lý sinh viên
                        </LoadingButton>
                        <LoadingButton
                          variant="outlined"
                          startIcon={<FileDownload />}
                          onClick={() => {/* TODO: Export all data */}}
                          fullWidth
                        >
                          Export dữ liệu
                        </LoadingButton>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Fade>
          )}

          {tab === 'sessions' && (
            <Fade in={tab === 'sessions'}>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12}>
                    <DataTable
                      columns={[
                        {
                          id: 'sessionId',
                          label: 'Session ID',
                          minWidth: 200,
                          format: (value) => (
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                              {value}
                            </Typography>
                          )
                        },
                        {
                          id: 'maLop',
                          label: 'Mã lớp',
                          format: (value) => <Chip label={value} size="small" color="secondary" />
                        },
                        {
                          id: 'startAt',
                          label: 'Bắt đầu',
                          format: (value) => new Date(value).toLocaleString('vi-VN')
                        },
                        {
                          id: 'endAt',
                          label: 'Kết thúc',
                          format: (value) => value ? new Date(value).toLocaleString('vi-VN') : '-'
                        },
                        {
                          id: 'rotateSeconds',
                          label: 'QR Timer',
                          format: (value) => <Chip label={`${value}s`} size="small" />
                        }
                      ]}
                      data={sessions?.content || []}
                      totalCount={sessions?.totalElements || 0}
                      page={pageS}
                      rowsPerPage={20}
                      onPageChange={setPageS}
                      onRowsPerPageChange={() => {}}
                      onSort={(column, direction) => setSessionSort({ column, direction })}
                      onSearch={setSessionSearch}
                      searchPlaceholder="Tìm kiếm session..."
                      actions={[
                        {
                          label: 'Hiển thị QR',
                          icon: <QrCode />,
                          onClick: (row) => setQrSessionId(row.sessionId),
                          color: 'primary'
                        },
                        {
                          label: 'Xem dashboard',
                          icon: <Visibility />,
                          onClick: (row) => setSelectedSessionId(row.sessionId),
                          color: 'secondary'
                        },
                        {
                          label: 'Quản lý chi tiết',
                          icon: <Assessment />,
                          onClick: (row) => window.open(`/session-detail?sessionId=${row.sessionId}`, '_blank'),
                          color: 'secondary'
                        },
                        {
                          label: 'Chi tiết điểm danh',
                          icon: <Visibility />,
                          onClick: (row) => window.open(`/attendance-detail?sessionId=${row.sessionId}`, '_blank'),
                          color: 'secondary'
                        },
                        {
                          label: 'Export CSV',
                          icon: <FileDownload />,
                          onClick: (row) => window.open(`/api/admin/export/${row.sessionId}`, '_blank'),
                          color: 'secondary'
                        },
                        {
                          label: 'Chỉnh sửa',
                          icon: <Edit />,
                          onClick: (row) => openEditSession(row),
                          color: 'primary'
                        },
                        {
                          label: 'Xóa',
                          icon: <Delete />,
                          onClick: (row) => deleteSession(row.sessionId),
                          color: 'error'
                        }
                      ]}
                    />
                  </Grid>
                </Grid>

                {/* QR Display Section */}
                {qrSessionId && (
                    <Fade in={!!qrSessionId}>
                      <Paper elevation={3} sx={{ p: 3, mt: 3, border: '2px solid', borderColor: 'primary.light' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <QrCode sx={{ mr: 2, color: 'primary.main' }} />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            QR Code điểm danh
                          </Typography>
                          <Chip
                            label={qr2Active ? 'QR B đang hoạt động' : 'Chờ sinh viên'}
                            color={qr2Active ? 'success' : 'warning'}
                            size="small"
                            sx={{ ml: 2 }}
                          />
                        </Box>

                        <Grid container spacing={3} alignItems="center">
                          <Grid item xs={12} md={6}>
                            <Stack spacing={2}>
                              <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                  Session ID
                                </Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                                  {qrSessionId}
                                </Typography>
                              </Box>

                              <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>
                                  QR A - Mã xoay (30s)
                                </Typography>
                                <Typography variant="body2" sx={{ wordBreak: 'break-all', bgcolor: 'primary.50', p: 1, borderRadius: 1 }}>
                                  {qrAUrl || 'Đang tạo QR A...'}
                                </Typography>
                              </Box>

                              <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'secondary.main' }}>
                                  QR B - Mã xoay
                                </Typography>
                                {qr2Active ? (
                                  <Alert severity="success" sx={{ mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      Còn hiệu lực: {Math.ceil(qr2RemainMs / 1000)} giây
                                    </Typography>
                                  </Alert>
                                ) : (
                                  <Alert severity="info">
                                    Chờ sinh viên quét QR A để kích hoạt
                                  </Alert>
                                )}
                              </Box>

                              <Stack direction="row" spacing={2}>
                                <Button
                                  variant="outlined"
                                  onClick={() => { setQrSessionId(''); setQrAUrl('') }}
                                  startIcon={<Refresh />}
                                >
                                  Ẩn QR
                                </Button>
                                {qrAUrl && (
                                  <Button
                                    variant="contained"
                                    color="secondary"
                                    href={qrAUrl}
                                    target="_blank"
                                    startIcon={<Visibility />}
                                  >
                                    Mở liên kết
                                  </Button>
                                )}
                              </Stack>
                            </Stack>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                {qrAUrl ? (
                                  <img
                                    alt="QR A"
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(window.location.origin + qrAUrl)}`}
                                    style={{
                                      borderRadius: 16,
                                      width: 280,
                                      height: 280,
                                      border: '4px solid #e2e8f0'
                                    }}
                                  />
                                ) : (
                                  <Box sx={{
                                    width: 280,
                                    height: 280,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '4px solid #e2e8f0',
                                    borderRadius: 2,
                                    bgcolor: 'grey.100'
                                  }}>
                                    <Typography variant="body2" color="text.secondary">
                                      Đang tạo QR A...
                                    </Typography>
                                  </Box>
                                )}

                                {/* QR B Overlay */}
                                {qr2Active && qrBData && (
                                  <Box sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(0,0,0,0.1)',
                                    borderRadius: 2
                                  }}>
                                    <img
                                      alt="QR B"
                                      src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrBData)}`}
                                      style={{
                                        borderRadius: 16,
                                        width: 280,
                                        height: 280,
                                        border: '6px solid white',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                      }}
                                    />
                                    <Box sx={{
                                      position: 'absolute',
                                      bottom: 12,
                                      left: 0,
                                      right: 0,
                                      textAlign: 'center'
                                    }}>
                                      <Chip
                                        label={`QR B - ${Math.ceil(qr2RemainMs / 1000)}s`}
                                        color="error"
                                        size="small"
                                        sx={{ fontWeight: 600 }}
                                      />
                                    </Box>
                                  </Box>
                                )}
                              </Box>

                              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                                {qr2Active ? 'QR A + QR B đang hiển thị' : 'QR A - Mã xoay (30s)'}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Fade>
                  )}
              </Box>
            </Fade>
          )}

        {tab === 'students' && (
          <Fade in={tab === 'students'}>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} lg={4}>
                  <Stack spacing={3}>
                    <Paper elevation={3} sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Person sx={{ mr: 2, color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Thêm sinh viên
                        </Typography>
                      </Box>
                      <Stack spacing={2}>
                        <TextField
                          size="small"
                          label="MSSV"
                          value={studentForm.mssv || ''}
                          onChange={e => setStudentForm(f => ({ ...f, mssv: e.target.value || undefined }))}
                          required
                          fullWidth
                        />
                        <TextField
                          size="small"
                          label="Mã lớp"
                          value={studentForm.maLop || ''}
                          onChange={e => setStudentForm(f => ({ ...f, maLop: e.target.value || undefined }))}
                          required
                          fullWidth
                        />
                        <TextField
                          size="small"
                          label="Họ và tên"
                          value={studentForm.hoTen || ''}
                          onChange={e => setStudentForm(f => ({ ...f, hoTen: e.target.value || undefined }))}
                          required
                          fullWidth
                        />
                        <LoadingButton
                          variant="contained"
                          onClick={createStudent}
                          loading={loading}
                          startIcon={<Add />}
                          size="large"
                          fullWidth
                        >
                          Thêm sinh viên
                        </LoadingButton>
                      </Stack>
                    </Paper>

                    <Paper elevation={3} sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <FileDownload sx={{ mr: 2, color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Import CSV
                        </Typography>
                      </Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          Định dạng: <code>mssv,maLop,hoTen</code> (có thể có header)
                        </Typography>
                      </Alert>
                      <TextField
                        size="small"
                        label="Dữ liệu CSV"
                        value={csvText}
                        onChange={e => setCsvText(e.target.value)}
                        multiline
                        minRows={6}
                        fullWidth
                        sx={{ mb: 2 }}
                      />
                      <Stack direction="row" spacing={2}>
                        <Button
                          variant="outlined"
                          onClick={() => setCsvText('mssv,maLop,hoTen\n201234567,CTK43,Nguyen Van A\n201234568,CTK43,Tran Thi B')}
                          startIcon={<Edit />}
                        >
                          Dữ liệu mẫu
                        </Button>
                        <LoadingButton
                          variant="contained"
                          onClick={importStudents}
                          disabled={!csvText.trim()}
                          loading={loading}
                          startIcon={<FileDownload />}
                          sx={{ flex: 1 }}
                        >
                          Import CSV
                        </LoadingButton>
                      </Stack>
                    </Paper>
                  </Stack>
                </Grid>
                <Grid item xs={12} lg={8}>
                  <DataTable
                    columns={[
                      {
                        id: 'mssv',
                        label: 'MSSV',
                        minWidth: 120,
                        format: (value) => (
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                            {value}
                          </Typography>
                        )
                      },
                      {
                        id: 'maLop',
                        label: 'Mã lớp',
                        format: (value) => <Chip label={value} size="small" color="primary" />
                      },
                      {
                        id: 'hoTen',
                        label: 'Họ và tên',
                        minWidth: 200,
                        format: (value) => value
                      }
                    ]}
                    data={students?.content || []}
                    totalCount={students?.totalElements || 0}
                    page={pageStu}
                    rowsPerPage={20}
                    onPageChange={setPageStu}
                    onRowsPerPageChange={() => {}}
                    onSort={(column, direction) => setStudentSort({ column, direction })}
                    onSearch={setStudentSearch}
                    searchPlaceholder="Tìm kiếm sinh viên..."
                    selectable={true}
                    actions={[
                      {
                        label: 'Chỉnh sửa',
                        icon: <Edit />,
                        onClick: (row) => {
                          openEditStudent(row)
                        },
                        color: 'primary'
                      },
                      {
                        label: 'Xóa',
                        icon: <Delete />,
                        onClick: (row) => {
                          if (confirm(`Bạn có chắc muốn xóa sinh viên ${row.hoTen}?`)) {
                            apiRequest(`/api/admin/students/${row.mssv}`, { method: 'DELETE' })
                              .then(() => fetchStudents())
                          }
                        },
                        color: 'error'
                      }
                    ]}
                  />
                </Grid>
              </Grid>
            </Box>
          </Fade>
        )}

        {/* Create Session Tab */}
        {tab === 'create' && (
          <Fade in={tab === 'create'}>
            <Box>
              {createResult ? (
                // Success Result
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Stack spacing={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                              Tạo buổi học thành công!
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                              Buổi học cho lớp <strong>{selectedClass?.maLop}</strong> đã được tạo
                            </Typography>
                          </Box>

                          <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                              Thông tin buổi học
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary">Session ID</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                                    {createResult.sessionId}
                                  </Typography>
                                  <Tooltip title="Copy Session ID">
                                    <IconButton size="small" onClick={() => copyToClipboard(createResult.sessionId)}>
                                      <ContentCopy fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary">Thời gian kết thúc</Typography>
                                <Typography variant="body1">
                                  {formatDateTime(createResult.expiresAt)}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Paper>

                          <Paper sx={{ p: 3, bgcolor: 'primary.50' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
                                QR Code điểm danh
                              </Typography>
                              <Chip
                                label={createQr2Active ? 'QR B đang hoạt động' : 'Chờ sinh viên'}
                                color={createQr2Active ? 'success' : 'warning'}
                                size="small"
                              />
                            </Box>

                            <Grid container spacing={3} alignItems="center">
                              <Grid item xs={12} md={6}>
                                <Stack spacing={2}>
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                      QR A - Mã xoay (30s)
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        value={createResult.qrUrlTemplate}
                                        InputProps={{
                                          readOnly: true,
                                          sx: { fontFamily: 'monospace', fontSize: '0.75rem' }
                                        }}
                                      />
                                      <Tooltip title="Copy URL">
                                        <IconButton size="small" onClick={() => copyToClipboard(createResult.qrUrlTemplate)}>
                                          <ContentCopy fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  </Box>

                                  <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'secondary.main' }}>
                                      QR B - Mã xoay
                                    </Typography>
                                    {createQr2Active ? (
                                      <Alert severity="success" sx={{ mb: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                          Còn hiệu lực: {Math.ceil(createQr2RemainMs / 1000)} giây
                                        </Typography>
                                      </Alert>
                                    ) : (
                                      <Alert severity="info">
                                        Chờ sinh viên quét QR A để kích hoạt
                                      </Alert>
                                    )}
                                  </Box>
                                </Stack>
                              </Grid>

                              <Grid item xs={12} md={6}>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                    {/* QR A Background */}
                                    <Box
                                      sx={{
                                        p: 2,
                                        bgcolor: 'white',
                                        borderRadius: 2,
                                        boxShadow: 2
                                      }}
                                    >
                                      <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(createResult.qrUrlTemplate)}`}
                                        alt="QR A - Session Link"
                                        style={{ width: 200, height: 200, display: 'block' }}
                                      />
                                    </Box>

                                    {/* QR B Overlay */}
                                    {createQr2Active && createQrBData && (
                                      <Box sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'rgba(0,0,0,0.1)',
                                        borderRadius: 2
                                      }}>
                                        <Box
                                          sx={{
                                            p: 1,
                                            bgcolor: 'white',
                                            borderRadius: 1,
                                            boxShadow: 3,
                                            border: '2px solid',
                                            borderColor: 'secondary.main'
                                          }}
                                        >
                                          <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(createQrBData)}`}
                                            alt="QR B - Rotating Token"
                                            style={{ width: 120, height: 120, display: 'block' }}
                                          />
                                        </Box>
                                      </Box>
                                    )}
                                  </Box>

                                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                                    {createQr2Active ? 'QR A + QR B đang hiển thị' : 'QR A - Mã xoay (30s)'}
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>

                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                              Sinh viên quét QR A trước, sau đó quét QR B để hoàn tất điểm danh
                            </Typography>
                          </Paper>

                          <Stack direction="row" spacing={2}>
                            <Button
                              variant="outlined"
                              onClick={() => {
                                setCreateResult(null)
                                setSelectedClass(null)
                                setCreateError(null)
                                setCreateQrBData('')
                                setCreateQr2Active(false)
                                setCreateQr2RemainMs(0)
                              }}
                              fullWidth
                            >
                              Tạo buổi học khác
                            </Button>
                            <Button
                              variant="contained"
                              onClick={() => setTab('sessions')}
                              fullWidth
                            >
                              Quản lý buổi học
                            </Button>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              ) : (
                // Create Form
                <Grid container spacing={3}>
                  <Grid item xs={12} lg={8}>
                    <Card>
                      <CardContent>
                        <Stack spacing={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <QrCode sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                              Tạo buổi học mới
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                              Tạo buổi điểm danh nhanh chóng với thông tin đơn giản
                            </Typography>
                          </Box>

                          {createError && (
                            <Alert severity="error" onClose={() => setCreateError(null)}>
                              {createError}
                            </Alert>
                          )}

                          <Box>
                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                              <School sx={{ mr: 1, verticalAlign: 'middle' }} />
                              Chọn mã lớp
                            </Typography>
                            <Autocomplete
                              options={classes}
                              getOptionLabel={(option) => option.maLop}
                              value={selectedClass}
                              onChange={(_, newValue) => setSelectedClass(newValue)}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  placeholder="Chọn mã lớp..."
                                  helperText={selectedClass ? `${selectedClass.studentCount} sinh viên • ${selectedClass.sessionCount} buổi học` : 'Chọn lớp từ danh sách có sẵn'}
                                />
                              )}
                              renderOption={(props, option) => (
                                <Box component="li" {...props}>
                                  <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                      {option.maLop}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      <Group sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                      {option.studentCount} sinh viên • {option.sessionCount} buổi học
                                    </Typography>
                                  </Box>
                                </Box>
                              )}
                            />
                          </Box>

                          <Box>
                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                              <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
                              Thời gian điểm danh
                            </Typography>
                            <TextField
                              type="number"
                              value={durationMinutes}
                              onChange={(e) => setDurationMinutes(Number(e.target.value))}
                              InputProps={{
                                endAdornment: <Typography variant="body2" color="text.secondary">phút</Typography>
                              }}
                              helperText="Thời gian từ bây giờ đến khi kết thúc điểm danh"
                              inputProps={{ min: 5, max: 180 }}
                            />
                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                              {[15, 30, 45, 60].map((minutes) => (
                                <Chip
                                  key={minutes}
                                  label={`${minutes} phút`}
                                  variant={durationMinutes === minutes ? 'filled' : 'outlined'}
                                  onClick={() => setDurationMinutes(minutes)}
                                  size="small"
                                />
                              ))}
                            </Stack>
                          </Box>

                          <LoadingButton
                            variant="contained"
                            size="large"
                            onClick={handleCreateSession}
                            loading={createLoading}
                            disabled={!selectedClass}
                            startIcon={<QrCode />}
                            fullWidth
                          >
                            Tạo buổi học ngay
                          </LoadingButton>

                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                            Buổi học sẽ bắt đầu ngay bây giờ và kết thúc sau {durationMinutes} phút
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} lg={4}>
                    <Stack spacing={3}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Thống kê nhanh
                          </Typography>
                          <Stack spacing={2}>
                            <Box>
                              <Typography variant="body2" color="text.secondary">Tổng số lớp</Typography>
                              <Typography variant="h6">{classes.length}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">Tổng sinh viên</Typography>
                              <Typography variant="h6">
                                {classes.reduce((sum, cls) => sum + cls.studentCount, 0)}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">Tổng buổi học</Typography>
                              <Typography variant="h6">
                                {classes.reduce((sum, cls) => sum + cls.sessionCount, 0)}
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Hướng dẫn
                          </Typography>
                          <Stack spacing={1}>
                            <Typography variant="body2">
                              1. Chọn mã lớp từ danh sách
                            </Typography>
                            <Typography variant="body2">
                              2. Thiết lập thời gian điểm danh
                            </Typography>
                            <Typography variant="body2">
                              3. Tạo buổi học và nhận QR code
                            </Typography>
                            <Typography variant="body2">
                              4. Chia sẻ QR code cho sinh viên
                            </Typography>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Stack>
                  </Grid>
                </Grid>
              )}
            </Box>
          </Fade>
        )}

        </Container>

        {/* Edit Student Modal */}
        <Dialog
          open={editingStudent !== null}
          onClose={() => setEditingStudent(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Edit sx={{ mr: 2, color: 'primary.main' }} />
              Chỉnh sửa sinh viên
            </Box>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="MSSV"
                value={editingStudent?.mssv || ''}
                disabled
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Mã lớp"
                value={editStudentForm.maLop || ''}
                onChange={(e) => setEditStudentForm({ ...editStudentForm, maLop: e.target.value })}
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Họ tên"
                value={editStudentForm.hoTen || ''}
                onChange={(e) => setEditStudentForm({ ...editStudentForm, hoTen: e.target.value })}
                fullWidth
                variant="outlined"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingStudent(null)}>
              Hủy
            </Button>
            <LoadingButton
              variant="contained"
              onClick={updateStudent}
              loading={loading}
              disabled={!editStudentForm.maLop || !editStudentForm.hoTen}
            >
              Cập nhật
            </LoadingButton>
          </DialogActions>
        </Dialog>

        {/* Edit Session Modal */}
        <Dialog
          open={editingSession !== null}
          onClose={() => setEditingSession(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Edit sx={{ mr: 2, color: 'primary.main' }} />
              Chỉnh sửa buổi học
            </Box>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="Session ID"
                value={editingSession?.sessionId || ''}
                disabled
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Mã lớp"
                value={editingSession?.maLop || ''}
                onChange={(e) => setEditingSession(prev => prev ? { ...prev, maLop: e.target.value } : null)}
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Thời gian bắt đầu"
                type="datetime-local"
                value={editingSession?.startAt ? new Date(editingSession.startAt).toISOString().slice(0, 16) : ''}
                onChange={(e) => setEditingSession(prev => prev ? { ...prev, startAt: new Date(e.target.value).toISOString() } : null)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Thời gian kết thúc"
                type="datetime-local"
                value={editingSession?.endAt ? new Date(editingSession.endAt).toISOString().slice(0, 16) : ''}
                onChange={(e) => setEditingSession(prev => prev ? { ...prev, endAt: new Date(e.target.value).toISOString() } : null)}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Thời gian xoay QR (giây)"
                type="number"
                value={editingSession?.rotateSeconds || ''}
                onChange={(e) => setEditingSession(prev => prev ? { ...prev, rotateSeconds: parseInt(e.target.value) } : null)}
                fullWidth
                variant="outlined"
                inputProps={{ min: 5, max: 300 }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingSession(null)}>
              Hủy
            </Button>
            <LoadingButton
              variant="contained"
              onClick={updateSession}
              loading={loading}
              disabled={!editingSession?.maLop}
            >
              Cập nhật
            </LoadingButton>
          </DialogActions>
        </Dialog>

      </Box>
    </>
  )
}

