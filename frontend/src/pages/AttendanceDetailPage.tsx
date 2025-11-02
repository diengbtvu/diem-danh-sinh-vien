import React, { useEffect, useState, useCallback } from 'react'
import {
  AppBar, Toolbar, Typography, Container, Box, Grid, Paper, TextField,
  Button, Stack, Alert, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem
} from '@mui/material'
import {
  ArrowBack, Edit, Delete, Refresh, CheckCircle, Warning, Error,
  Person, Schedule, QrCode, Assessment, Download, FileDownload
} from '@mui/icons-material'
import { useSearchParams, useNavigate } from 'react-router-dom'
import LoadingButton from '../components/LoadingButton'
import DataTable from '../components/DataTable'
import StatusDistributionCard from '../components/StatusDistributionCard'
import RealtimeStatsCard from '../components/RealtimeStatsCard'
import { apiRequest } from '../config/api'

type Attendance = {
  id: string
  sessionId: string
  mssv: string
  capturedAt: string
  imageUrl?: string
  faceLabel: string
  faceConfidence: number
  status: 'ACCEPTED' | 'REVIEW' | 'REJECTED'
  meta: string
  // Enriched student info
  hoTen?: string
  maLop?: string
  studentFound?: boolean
  displayName?: string
}

type Student = {
  mssv: string
  maLop: string
  hoTen: string
}

type Session = {
  sessionId: string
  maLop: string
  startAt: string
  endAt?: string | null
  rotateSeconds: number
}

type Page<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
}

export default function AttendanceDetailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = searchParams.get('sessionId')

  const [session, setSession] = useState<Session | null>(null)
  const [attendances, setAttendances] = useState<Page<Attendance> | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null)
  const [stats, setStats] = useState<{ total: number; accepted: number; review: number; rejected: number } | null>(null)
  const [viewingImage, setViewingImage] = useState<string | null>(null)

  // Search and filter states
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sort, setSort] = useState({ column: 'capturedAt', direction: 'desc' })

  // Get user role from localStorage
  const getUserRole = () => {
    try {
      const stored = localStorage.getItem('diemdanh_auth')
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed?.user?.role as string | undefined
      }
    } catch {
      return undefined
    }
    return undefined
  }

  const userRole = getUserRole()
  const isAdmin = userRole === 'ADMIN'
  const isTeacher = userRole === 'GIANGVIEN'

  // API prefix based on role
  const apiPrefix = isAdmin ? '/api/admin' : isTeacher ? '/api/teacher' : '/api/admin'
  
  // Get correct back URL based on role
  const getBackUrl = () => {
    console.log('getBackUrl - userRole:', userRole, 'isAdmin:', isAdmin, 'isTeacher:', isTeacher);
    if (isAdmin) {
      return '/admin-dashboard';
    } else if (isTeacher) {
      return '/teacher-dashboard';
    } else {
      return '/';
    }
  }
  
  // Debug logs
  console.log('User role:', userRole, 'isAdmin:', isAdmin, 'isTeacher:', isTeacher, 'apiPrefix:', apiPrefix, 'backUrl:', getBackUrl())

  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      // No specific session, set session to null
      setSession(null)
      return
    }
    try {
      const response = await apiRequest(`${apiPrefix}/sessions/${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setSession(data)
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    }
  }, [sessionId, apiPrefix])

  const fetchAttendances = useCallback(async () => {
    setLoading(true)
    try {
      let endpoint = ''
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('size', '20')
      
      // Always use enrichStudent for both teacher and admin
      if (sessionId) {
        params.append('sessionId', sessionId)
        params.append('enrichStudent', 'true')
        // Use public endpoint that supports enrichStudent parameter
        endpoint = `/api/attendances?${params.toString()}`
      } else {
        endpoint = `${apiPrefix}/attendances?${params.toString()}`
      }

      console.log('Fetching attendances with enrichment from:', endpoint)
      const response = await apiRequest(endpoint)
      if (response.ok) {
        const data = await response.json()
        console.log('Enriched attendance data received. First item:', data.content?.[0])
        setAttendances(data)
      } else {
        console.error('Failed to fetch attendances:', response.status)
      }
    } catch (error) {
      console.error('Error fetching attendances:', error)
    } finally {
      setLoading(false)
    }
  }, [sessionId, page, apiPrefix, isAdmin, isTeacher])

  const fetchStats = useCallback(async () => {
    try {
      if (sessionId) {
        // Fetch stats for specific session
        console.log('Fetching stats for sessionId:', sessionId)
        let endpoint = ''
        
        if (isTeacher) {
          // Teacher API: /api/teacher/sessions/{sessionId}/stats
          endpoint = `${apiPrefix}/sessions/${sessionId}/stats`
        } else if (isAdmin) {
          // Admin API: /api/admin/stats/{sessionId}
          endpoint = `${apiPrefix}/stats/${sessionId}`
        } else {
          throw new Error('Unauthorized')
        }

        const response = await apiRequest(endpoint)
        console.log('Stats response status:', response.status)
        if (response.ok) {
          const data = await response.json()
          console.log('Stats data received:', data)
          setStats(data)
        } else {
          console.error('Failed to fetch stats:', response.status, response.statusText)
        }
      } else {
        // Fetch dashboard stats (all sessions) - only for admin
        if (isAdmin) {
          console.log('Fetching dashboard stats (all sessions)')
          const response = await apiRequest('/api/admin/dashboard/stats')
          console.log('Dashboard stats response status:', response.status)
          if (response.ok) {
            const data = await response.json()
            console.log('Dashboard stats data received:', data)
            setStats(data)
          } else {
            console.error('Failed to fetch dashboard stats:', response.status, response.statusText)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [sessionId, apiPrefix, isAdmin, isTeacher])

  const fetchStudents = useCallback(async () => {
    if (!session?.maLop) return
    try {
      const response = await apiRequest(`${apiPrefix}/students?maLop=${session.maLop}&size=1000`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data.content || [])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }, [session?.maLop, apiPrefix])

  useEffect(() => {
    if (sessionId) {
      console.log('useEffect: sessionId found, fetching data for:', sessionId)
      fetchSession()
      fetchStats()
    } else {
      console.log('useEffect: no sessionId found')
    }
  }, [sessionId, fetchSession, fetchStats])

  // Debug log for stats changes
  useEffect(() => {
    console.log('Stats updated:', stats)
  }, [stats])

  useEffect(() => {
    fetchAttendances()
  }, [fetchAttendances])

  useEffect(() => {
    if (session) {
      fetchStudents()
    }
  }, [session, fetchStudents])

  const updateAttendance = async () => {
    if (!editingAttendance) return
    setLoading(true)
    try {
      // Use appropriate API endpoint based on role
      const endpoint = isTeacher 
        ? `/api/teacher/attendances/${editingAttendance.id}`
        : `/api/admin/attendances/${editingAttendance.id}`;
      
      console.log('Updating attendance via:', endpoint);
      const response = await apiRequest(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editingAttendance.status,
          meta: editingAttendance.meta
        })
      })
      if (response.ok) {
        setEditingAttendance(null)
        fetchAttendances()
        fetchStats()
      } else {
        console.error('Update failed:', response.status);
        alert('Lỗi cập nhật: ' + response.status);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Lỗi kết nối');
    } finally {
      setLoading(false)
    }
  }

  const deleteAttendance = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bản ghi điểm danh này?')) return
    setLoading(true)
    try {
      // Use appropriate API endpoint based on role
      const endpoint = isTeacher
        ? `/api/teacher/attendances/${id}`
        : `/api/admin/attendances/${id}`;
      
      console.log('Deleting attendance via:', endpoint);
      const response = await apiRequest(endpoint, {
        method: 'DELETE'
      })
      if (response.ok) {
        console.log('Delete successful');
        fetchAttendances()
        fetchStats()
      } else {
        console.error('Delete failed:', response.status);
        alert('Lỗi xóa: ' + response.status);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Lỗi kết nối');
    } finally {
      setLoading(false)
    }
  }

  const getStudentName = (mssv: string) => {
    const student = students.find(s => s.mssv === mssv)
    return student ? student.hoTen : 'Không tìm thấy'
  }

  const downloadReport = async (type: 'basic' | 'detailed') => {
    if (!sessionId) return

    try {
      const endpoint = type === 'detailed'
        ? `/api/admin/export/detailed/${sessionId}`
        : `/api/admin/export/${sessionId}`

      const response = await apiRequest(endpoint)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `attendance-${type}-${sessionId}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading report:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'success'
      case 'REVIEW': return 'warning'
      case 'REJECTED': return 'error'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return <CheckCircle />
      case 'REVIEW': return <Warning />
      case 'REJECTED': return <Error />
      default: return undefined
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'Thành công'
      case 'REVIEW': return 'Cần xem xét'
      case 'REJECTED': return 'Thất bại'
      default: return status
    }
  }



  console.log('Rendering AttendanceDetailPage with sessionId:', sessionId, 'stats:', stats)

  return (
    <>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main', boxShadow: 'none', border: 'none' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => {
              const backUrl = getBackUrl();
              console.log('Back button clicked, navigating to:', backUrl);
              navigate(backUrl);
            }}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {sessionId ? `Chi tiết điểm danh - ${session?.maLop || sessionId}` : 'Tất cả điểm danh'}
          </Typography>
          <IconButton color="inherit" onClick={() => {
            fetchAttendances()
            fetchStats()
          }}>
            <Refresh />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Session Info */}
        {session && (
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <QrCode sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Session ID
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {session.sessionId}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Person sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Mã lớp
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {session.maLop}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Schedule sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Thời gian bắt đầu
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {new Date(session.startAt).toLocaleString('vi-VN')}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Assessment sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    QR Timer
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {session.rotateSeconds}s
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Statistics */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Thống kê điểm danh
          </Typography>
          {stats ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <StatusDistributionCard
                  stats={stats}
                  sessionId={sessionId || undefined}
                  onViewDetails={(status) => {
                    if (status !== 'all') {
                      setStatusFilter(status.toUpperCase())
                    }
                  }}
                  showActions={true}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <RealtimeStatsCard
                  sessionId={sessionId || ''}
                  refreshInterval={30000}
                  apiPrefix={apiPrefix}
                />
              </Grid>
            </Grid>
          ) : (
            <Typography variant="body1" color="text.secondary">
              {sessionId ? 'Đang tải thống kê...' : 'Không có session ID'}
            </Typography>
          )}
        </Paper>

        {/* Filters */}
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Tìm kiếm theo MSSV hoặc tên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={statusFilter}
                  label="Trạng thái"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="ACCEPTED">Thành công</MenuItem>
                  <MenuItem value="REVIEW">Cần xem xét</MenuItem>
                  <MenuItem value="REJECTED">Thất bại</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('')
                  setPage(0)
                }}
                fullWidth
              >
                Xóa bộ lọc
              </Button>
            </Grid>
            <Grid item xs={12} md={3}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={() => downloadReport('basic')}
                  size="small"
                >
                  Xuất CSV
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FileDownload />}
                  onClick={() => downloadReport('detailed')}
                  size="small"
                >
                  Báo cáo chi tiết
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Attendance Table */}
        <Paper elevation={3}>
          <DataTable
            columns={[
              {
                id: 'imageUrl',
                label: 'Ảnh',
                format: (value: any, row: any) => (
                  value ? (
                    <Box
                      component="img"
                      src={value}
                      alt="Student"
                      sx={{
                        width: 60,
                        height: 60,
                        objectFit: 'cover',
                        borderRadius: 1,
                        cursor: 'pointer',
                        border: '2px solid #e0e0e0',
                        '&:hover': {
                          border: '2px solid #1976d2',
                          transform: 'scale(1.05)',
                          transition: 'all 0.2s'
                        }
                      }}
                      onClick={() => setViewingImage(value)}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: '#f5f5f5',
                        borderRadius: 1,
                        color: '#999'
                      }}
                    >
                      N/A
                    </Box>
                  )
                )
              },
              {
                id: 'mssv',
                label: 'Sinh viên',
                format: (value: any, row: any) => {
                  // Safely access row properties with fallbacks
                  const mssv = row?.mssv || value || 'N/A'
                  const hoTen = row?.hoTen || 'Không tìm thấy'
                  const studentFound = row?.studentFound === true
                  
                  return (
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {mssv}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: studentFound ? 'success.main' : 'error.main',
                          fontWeight: 500
                        }}
                      >
                        {hoTen}
                      </Typography>
                    </Box>
                  )
                }
              },
              {
                id: 'capturedAt',
                label: 'Thời gian',
                sortable: true,
                format: (value) => new Date(value).toLocaleString('vi-VN')
              },
              {
                id: 'faceLabel',
                label: 'Face Label',
                format: (value) => value || 'N/A'
              },
              {
                id: 'faceConfidence',
                label: 'Confidence',
                format: (value) => value ? `${(value * 100).toFixed(1)}%` : 'N/A'
              },
              {
                id: 'status',
                label: 'Trạng thái',
                format: (value) => (
                  <Chip
                    icon={getStatusIcon(value)}
                    label={getStatusText(value)}
                    color={getStatusColor(value) as any}
                    size="small"
                  />
                )
              }
            ]}
            data={attendances?.content || []}
            totalCount={attendances?.totalElements || 0}
            page={page}
            rowsPerPage={20}
            onPageChange={setPage}
            onRowsPerPageChange={() => {}}
            onSort={(column, direction) => setSort({ column, direction })}
            onSearch={setSearch}
            searchPlaceholder="Tìm kiếm điểm danh..."
            loading={loading}
            actions={(isAdmin || isTeacher) ? [
              {
                label: 'Chỉnh sửa',
                icon: <Edit />,
                onClick: (row) => setEditingAttendance(row),
                color: 'primary'
              },
              {
                label: 'Xóa',
                icon: <Delete />,
                onClick: (row) => deleteAttendance(row.id),
                color: 'error'
              }
            ] : []}
          />
        </Paper>

        {/* Edit Attendance Modal */}
        <Dialog
          open={editingAttendance !== null}
          onClose={() => setEditingAttendance(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Edit sx={{ mr: 2, color: 'primary.main' }} />
              Chỉnh sửa điểm danh
            </Box>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="MSSV"
                value={editingAttendance?.mssv || ''}
                disabled
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Họ tên"
                value={editingAttendance ? getStudentName(editingAttendance.mssv) : ''}
                disabled
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Thời gian điểm danh"
                value={editingAttendance ? new Date(editingAttendance.capturedAt).toLocaleString('vi-VN') : ''}
                disabled
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Face Label"
                value={editingAttendance?.faceLabel || ''}
                disabled
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Confidence"
                value={editingAttendance?.faceConfidence ? `${(editingAttendance.faceConfidence * 100).toFixed(1)}%` : ''}
                disabled
                fullWidth
                variant="outlined"
              />
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={editingAttendance?.status || ''}
                  label="Trạng thái"
                  onChange={(e) => setEditingAttendance(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                >
                  <MenuItem value="ACCEPTED">Thành công</MenuItem>
                  <MenuItem value="REVIEW">Cần xem xét</MenuItem>
                  <MenuItem value="REJECTED">Thất bại</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Ghi chú"
                value={editingAttendance?.meta || ''}
                onChange={(e) => setEditingAttendance(prev => prev ? { ...prev, meta: e.target.value } : null)}
                fullWidth
                variant="outlined"
                multiline
                rows={3}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingAttendance(null)}>
              Hủy
            </Button>
            <LoadingButton
              variant="contained"
              onClick={updateAttendance}
              loading={loading}
            >
              Cập nhật
            </LoadingButton>
          </DialogActions>
        </Dialog>

        {/* Image Viewer Dialog */}
        <Dialog
          open={viewingImage !== null}
          onClose={() => setViewingImage(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Ảnh điểm danh
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 300
              }}
            >
              {viewingImage && (
                <Box
                  component="img"
                  src={viewingImage}
                  alt="Student attendance"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                    borderRadius: 2
                  }}
                />
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewingImage(null)}>
              Đóng
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  )
}
