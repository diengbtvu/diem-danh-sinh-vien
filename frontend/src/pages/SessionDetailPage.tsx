import React, { useEffect, useState, useCallback } from 'react'
import {
  AppBar, Toolbar, Typography, Container, Box, Grid, Paper, TextField,
  Button, Stack, Alert, Chip, IconButton, Tooltip, Fade, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
  Card, CardContent, Tabs, Tab
} from '@mui/material'
import {
  ArrowBack, Edit, Delete, Refresh, CheckCircle, Warning, Error,
  Person, Schedule, QrCode, Assessment, Download, Visibility,
  PlayArrow, Stop, ContentCopy
} from '@mui/icons-material'
import { useSearchParams, useNavigate } from 'react-router-dom'
import LoadingButton from '../components/LoadingButton'
import DataTable from '../components/DataTable'
import StatusDistributionCard from '../components/StatusDistributionCard'

type Attendance = {
  id: string
  sessionId: string
  mssv: string
  capturedAt: string
  faceLabel: string
  faceConfidence: number
  status: 'ACCEPTED' | 'REVIEW' | 'REJECTED'
  meta: string
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

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`session-tabpanel-${index}`}
      aria-labelledby={`session-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function SessionDetailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = searchParams.get('sessionId')

  const [session, setSession] = useState<Session | null>(null)
  const [attendances, setAttendances] = useState<Page<Attendance> | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [tabValue, setTabValue] = useState(0)
  const [stats, setStats] = useState<{ total: number; accepted: number; review: number; rejected: number } | null>(null)

  // QR states
  const [qrSessionToken, setQrSessionToken] = useState<string>('')
  const [qrRotatingToken, setQrRotatingToken] = useState<string>('')
  const [qr2Active, setQr2Active] = useState<boolean>(false)
  const [qr2RemainMs, setQr2RemainMs] = useState<number>(0)

  // Search and filter states
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sort, setSort] = useState({ column: 'capturedAt', direction: 'desc' })

  const fetchSession = useCallback(async () => {
    if (!sessionId) return
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setSession(data)
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    }
  }, [sessionId])

  const fetchAttendances = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        sessionId,
        page: page.toString(),
        size: '20',
        sortBy: sort.column,
        sortDir: sort.direction,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter })
      })
      const response = await fetch(`/api/admin/attendances?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAttendances(data)
      }
    } catch (error) {
      console.error('Error fetching attendances:', error)
    } finally {
      setLoading(false)
    }
  }, [sessionId, page, sort, search, statusFilter])

  const fetchStats = useCallback(async () => {
    if (!sessionId) return
    try {
      const response = await fetch(`/api/admin/stats/${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [sessionId])

  const fetchStudents = useCallback(async () => {
    if (!session?.maLop) return
    try {
      const response = await fetch(`/api/admin/students?maLop=${session.maLop}&size=1000`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data.content || [])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }, [session?.maLop])

  const fetchQrStatus = useCallback(async () => {
    if (!sessionId) return
    try {
      const response = await fetch(`/api/sessions/${sessionId}/status`)
      if (response.ok) {
        const data = await response.json()
        setQrSessionToken(data.sessionToken || '')
        setQrRotatingToken(data.rotatingToken || '')
        setQr2Active(data.qr2Active || false)
        setQr2RemainMs(data.validForMs || 0)
      }
    } catch (error) {
      console.error('Error fetching QR status:', error)
    }
  }, [sessionId])

  useEffect(() => {
    if (sessionId) {
      fetchSession()
      fetchStats()
      fetchQrStatus()
    }
  }, [sessionId, fetchSession, fetchStats, fetchQrStatus])

  useEffect(() => {
    fetchAttendances()
  }, [fetchAttendances])

  useEffect(() => {
    if (session) {
      fetchStudents()
    }
  }, [session, fetchStudents])

  // Poll QR status every 5 seconds
  useEffect(() => {
    if (!sessionId) return
    const interval = setInterval(fetchQrStatus, 5000)
    return () => clearInterval(interval)
  }, [sessionId, fetchQrStatus])

  const getStudentName = (mssv: string) => {
    const student = students.find(s => s.mssv === mssv)
    return student ? student.hoTen : 'Không tìm thấy'
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
      default: return null
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const exportAttendances = () => {
    if (sessionId) {
      window.open(`/api/admin/export/${sessionId}`, '_blank')
    }
  }

  if (!sessionId) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Session ID không hợp lệ</Alert>
      </Container>
    )
  }

  return (
    <>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/admin')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Quản lý buổi học - {session?.maLop || sessionId}
          </Typography>
          <IconButton color="inherit" onClick={() => {
            fetchSession()
            fetchAttendances()
            fetchStats()
            fetchQrStatus()
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

            {/* Action Buttons */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={exportAttendances}
              >
                Export CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => window.open(`/attendance-detail?sessionId=${sessionId}`, '_blank')}
              >
                Xem chi tiết điểm danh
              </Button>
              <Button
                variant="outlined"
                startIcon={<ContentCopy />}
                onClick={() => copyToClipboard(sessionId)}
              >
                Copy Session ID
              </Button>
            </Box>
          </Paper>
        )}

        {/* Tabs */}
        <Paper elevation={3} sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Thống kê" />
            <Tab label="QR Code" />
            <Tab label="Danh sách điểm danh" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {/* Statistics Tab */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {stats && (
                  <StatusDistributionCard
                    stats={stats}
                    sessionId={sessionId}
                    onViewDetails={(status) => {
                      setStatusFilter(status === 'all' ? '' : status.toUpperCase())
                      setTabValue(2) // Switch to attendance list tab
                    }}
                    onBulkUpdate={async (fromStatus, toStatus, count) => {
                      setLoading(true)
                      try {
                        const response = await fetch('/api/admin/attendances/bulk-update', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            sessionId: sessionId,
                            fromStatus: fromStatus.toUpperCase(),
                            toStatus: toStatus.toUpperCase()
                          })
                        })
                        if (response.ok) {
                          const result = await response.json()
                          alert(`Đã cập nhật ${result.updatedCount} bản ghi từ "${fromStatus}" thành "${toStatus}"`)
                          fetchStats()
                          fetchAttendances()
                        }
                      } catch (error) {
                        console.error('Error bulk updating:', error)
                        alert('Có lỗi xảy ra khi cập nhật hàng loạt')
                      } finally {
                        setLoading(false)
                      }
                    }}
                  />
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Thông tin buổi học
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Tổng số sinh viên trong lớp
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {students.length}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Tỷ lệ điểm danh
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                          {students.length > 0 ? ((stats?.total || 0) / students.length * 100).toFixed(1) : '0.0'}%
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Trạng thái buổi học
                        </Typography>
                        <Chip
                          label={session?.endAt && new Date(session.endAt) < new Date() ? 'Đã kết thúc' : 'Đang diễn ra'}
                          color={session?.endAt && new Date(session.endAt) < new Date() ? 'default' : 'success'}
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {/* QR Code Tab */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      QR Code A (Cố định)
                    </Typography>
                    {qrSessionToken && (
                      <Box sx={{ textAlign: 'center' }}>
                        <Box
                          component="img"
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`http://localhost:8001/attend?session=${qrSessionToken}`)}`}
                          alt="QR Code A"
                          sx={{ width: 200, height: 200, border: 1, borderColor: 'grey.300' }}
                        />
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Link: http://localhost:8001/attend?session={qrSessionToken}
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<ContentCopy />}
                          onClick={() => copyToClipboard(`http://localhost:8001/attend?session=${qrSessionToken}`)}
                          sx={{ mt: 1 }}
                        >
                          Copy Link
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      QR Code B (Luân phiên)
                    </Typography>
                    {qr2Active && qrRotatingToken ? (
                      <Box sx={{ textAlign: 'center' }}>
                        <Box
                          component="img"
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`http://localhost:8001/attend?session=${qrSessionToken}&rot=${qrRotatingToken}`)}`}
                          alt="QR Code B"
                          sx={{ width: 200, height: 200, border: 1, borderColor: 'grey.300' }}
                        />
                        <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
                          Còn lại: {Math.ceil(qr2RemainMs / 1000)}s
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<ContentCopy />}
                          onClick={() => copyToClipboard(`http://localhost:8001/attend?session=${qrSessionToken}&rot=${qrRotatingToken}`)}
                          sx={{ mt: 1 }}
                        >
                          Copy Link
                        </Button>
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          QR Code B chưa được kích hoạt
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          QR Code B sẽ xuất hiện khi có sinh viên bắt đầu điểm danh
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {/* Attendance List Tab */}
            <Box sx={{ mb: 3 }}>
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
              </Grid>
            </Box>

            <DataTable
              columns={[
                {
                  id: 'mssv',
                  label: 'MSSV',
                  sortable: true
                },
                {
                  id: 'hoTen',
                  label: 'Họ tên',
                  format: (_, row) => getStudentName(row.mssv)
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
              actions={[
                {
                  label: 'Xem chi tiết',
                  icon: <Visibility />,
                  onClick: (row) => {
                    // TODO: Open attendance detail modal
                    console.log('View attendance detail:', row)
                  },
                  color: 'primary'
                }
              ]}
            />
          </TabPanel>
        </Paper>
      </Container>
    </>
  )
}
