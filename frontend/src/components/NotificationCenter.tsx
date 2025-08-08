import React, { useState, useEffect } from 'react'
import {
  IconButton, Badge, Snackbar, Alert, AlertTitle, Drawer, Box, Typography,
  List, ListItem, ListItemText, Button
} from '@mui/material'
import {
  Notifications, Close
} from '@mui/icons-material'

interface NotificationItem {
  id: string
  title: string
  message: string
  severity: 'success' | 'warning' | 'error' | 'info'
  timestamp: Date
  read: boolean
}

interface NotificationCenterProps {
  sessionId?: string
}

export default function NotificationCenter({ sessionId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [currentSnackbar, setCurrentSnackbar] = useState<NotificationItem | null>(null)

  // Simulate receiving notifications (replace with actual WebSocket later)
  useEffect(() => {
    if (sessionId) {
      const interval = setInterval(() => {
        const newNotification: NotificationItem = {
          id: Date.now().toString(),
          title: 'Điểm danh mới',
          message: `Sinh viên vừa điểm danh cho session ${sessionId}`,
          severity: 'info',
          timestamp: new Date(),
          read: false
        }

        setNotifications(prev => [newNotification, ...prev.slice(0, 49)])
        setCurrentSnackbar(newNotification)
        setSnackbarOpen(true)
      }, 30000) // Every 30 seconds for demo

      return () => clearInterval(interval)
    }
  }, [sessionId])

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    )
  }

  const clearAll = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <>
      <IconButton
        color="inherit"
        onClick={() => setDrawerOpen(true)}
        sx={{ mr: 1 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <Notifications />
        </Badge>
      </IconButton>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: { width: 400, maxWidth: '90vw' }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Thông báo
            </Typography>
            <IconButton size="small" onClick={() => setDrawerOpen(false)}>
              <Close />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" onClick={markAllAsRead} disabled={unreadCount === 0}>
              Đánh dấu đã đọc
            </Button>
            <Button size="small" onClick={clearAll} disabled={notifications.length === 0}>
              Xóa tất cả
            </Button>
          </Box>
        </Box>

        <List sx={{ flex: 1, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="Không có thông báo"
                secondary="Bạn sẽ nhận được thông báo real-time tại đây"
              />
            </ListItem>
          ) : (
            notifications.map((notification) => (
              <ListItem
                key={notification.id}
                sx={{
                  bgcolor: notification.read ? 'transparent' : 'action.hover',
                  cursor: 'pointer'
                }}
                onClick={() => markAsRead(notification.id)}
              >
                <ListItemText
                  primary={notification.title}
                  secondary={
                    <Box>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {notification.timestamp.toLocaleString('vi-VN')}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </Drawer>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={currentSnackbar?.severity || 'info'}
          sx={{ width: '100%' }}
        >
          <AlertTitle>{currentSnackbar?.title}</AlertTitle>
          {currentSnackbar?.message}
        </Alert>
      </Snackbar>
    </>
  )
}
