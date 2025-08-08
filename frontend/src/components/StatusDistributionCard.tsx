import React, { useState } from 'react'
import {
  Card, CardContent, Typography, Box, Grid, Chip, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText,
  ListItemIcon, IconButton, Tooltip, Stack, LinearProgress
} from '@mui/material'
import {
  CheckCircle, Warning, Error, Visibility, Edit, TrendingUp,
  Assessment, PieChart as PieChartIcon
} from '@mui/icons-material'

interface StatusStats {
  total: number
  accepted: number
  review: number
  rejected: number
}

interface StatusDistributionCardProps {
  stats: StatusStats
  sessionId?: string
  onViewDetails?: (status: string) => void
  onBulkUpdate?: (fromStatus: string, toStatus: string, count: number) => void
  showActions?: boolean
}

export default function StatusDistributionCard({
  stats,
  sessionId,
  onViewDetails,
  onBulkUpdate,
  showActions = true
}: StatusDistributionCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false)

  const getPercentage = (value: number) => {
    return stats.total > 0 ? ((value / stats.total) * 100).toFixed(1) : '0.0'
  }

  const statusItems = [
    {
      key: 'accepted',
      label: 'Thành công',
      value: stats.accepted,
      color: '#10b981',
      icon: <CheckCircle />,
      description: 'Điểm danh thành công với độ tin cậy cao'
    },
    {
      key: 'review',
      label: 'Cần xem xét',
      value: stats.review,
      color: '#f59e0b',
      icon: <Warning />,
      description: 'Cần kiểm tra thủ công do độ tin cậy thấp hoặc không nhận diện được'
    },
    {
      key: 'rejected',
      label: 'Thất bại',
      value: stats.rejected,
      color: '#ef4444',
      icon: <Error />,
      description: 'Điểm danh thất bại hoặc bị từ chối'
    }
  ]

  const handleBulkUpdate = (fromStatus: string, toStatus: string) => {
    const fromItem = statusItems.find(item => item.key === fromStatus)
    if (fromItem && onBulkUpdate) {
      onBulkUpdate(fromStatus, toStatus, fromItem.value)
    }
    setBulkUpdateOpen(false)
  }

  return (
    <>
      <Card elevation={3} sx={{ height: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PieChartIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Phân bố trạng thái
              </Typography>
            </Box>
            {showActions && (
              <Box>
                <Tooltip title="Xem chi tiết">
                  <IconButton size="small" onClick={() => setDetailsOpen(true)}>
                    <Visibility />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Cập nhật hàng loạt">
                  <IconButton size="small" onClick={() => setBulkUpdateOpen(true)}>
                    <Edit />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Tỷ lệ phần trăm và số lượng
          </Typography>

          <Stack spacing={3}>
            {statusItems.map((item) => (
              <Box key={item.key}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ color: item.color, mr: 1 }}>
                      {item.icon}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {item.label}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: item.color }}>
                      {item.value}
                    </Typography>
                    <Chip
                      label={`${getPercentage(item.value)}%`}
                      size="small"
                      sx={{
                        bgcolor: item.color,
                        color: 'white',
                        fontWeight: 600,
                        minWidth: '60px'
                      }}
                    />
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.total > 0 ? (item.value / stats.total) * 100 : 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: item.color,
                      borderRadius: 4
                    }
                  }}
                />
              </Box>
            ))}
          </Stack>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Tổng số điểm danh
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {stats.total}
              </Typography>
            </Box>
          </Box>

          {showActions && onViewDetails && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Assessment />}
                onClick={() => onViewDetails('all')}
                fullWidth
                size="small"
              >
                Xem báo cáo chi tiết
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Assessment sx={{ mr: 2, color: 'primary.main' }} />
            Chi tiết phân bố trạng thái
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {statusItems.map((item) => (
              <Grid item xs={12} md={4} key={item.key}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box sx={{ color: item.color, mb: 2 }}>
                      {React.cloneElement(item.icon, { sx: { fontSize: 48 } })}
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: item.color, mb: 1 }}>
                      {item.value}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {item.label}
                    </Typography>
                    <Chip
                      label={`${getPercentage(item.value)}%`}
                      sx={{
                        bgcolor: item.color,
                        color: 'white',
                        fontWeight: 600,
                        mb: 2
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                    {onViewDetails && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          onViewDetails(item.key)
                          setDetailsOpen(false)
                        }}
                        sx={{ mt: 2 }}
                      >
                        Xem danh sách
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
              Tổng quan
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                  Tổng số điểm danh:
                </Typography>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                  {stats.total}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                  Tỷ lệ thành công:
                </Typography>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                  {getPercentage(stats.accepted)}%
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog
        open={bulkUpdateOpen}
        onClose={() => setBulkUpdateOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Edit sx={{ mr: 2, color: 'primary.main' }} />
            Cập nhật trạng thái hàng loạt
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Chọn thao tác cập nhật trạng thái:
          </Typography>
          <List>
            {stats.review > 0 && (
              <>
                <ListItem
                  button
                  onClick={() => handleBulkUpdate('review', 'accepted')}
                  sx={{ border: 1, borderColor: 'grey.300', borderRadius: 1, mb: 1 }}
                >
                  <ListItemIcon>
                    <CheckCircle sx={{ color: 'success.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Chuyển ${stats.review} bản ghi "Cần xem xét" thành "Thành công"`}
                    secondary="Áp dụng cho tất cả bản ghi đang cần xem xét"
                  />
                </ListItem>
                <ListItem
                  button
                  onClick={() => handleBulkUpdate('review', 'rejected')}
                  sx={{ border: 1, borderColor: 'grey.300', borderRadius: 1, mb: 1 }}
                >
                  <ListItemIcon>
                    <Error sx={{ color: 'error.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Chuyển ${stats.review} bản ghi "Cần xem xét" thành "Thất bại"`}
                    secondary="Áp dụng cho tất cả bản ghi đang cần xem xét"
                  />
                </ListItem>
              </>
            )}
            {stats.rejected > 0 && (
              <ListItem
                button
                onClick={() => handleBulkUpdate('rejected', 'review')}
                sx={{ border: 1, borderColor: 'grey.300', borderRadius: 1, mb: 1 }}
              >
                <ListItemIcon>
                  <Warning sx={{ color: 'warning.main' }} />
                </ListItemIcon>
                <ListItemText
                  primary={`Chuyển ${stats.rejected} bản ghi "Thất bại" thành "Cần xem xét"`}
                  secondary="Để xem xét lại các trường hợp bị từ chối"
                />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkUpdateOpen(false)}>
            Hủy
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
