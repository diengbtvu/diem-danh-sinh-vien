import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AttendPage from './pages/AttendPage'
import CreateSessionPage from './pages/CreateSessionPage'
import AttendanceDetailPage from './pages/AttendanceDetailPage'

import TestPage from './pages/TestPage'
import DebugPage from './pages/DebugPage'
import SimpleAttendanceDetailPage from './pages/SimpleAttendanceDetailPage'
import { LoginPage } from './pages/LoginPage'
import { AdminDashboard } from './pages/AdminDashboard'
import { TeacherDashboard } from './pages/TeacherDashboard'
import { AuthTestPage } from './pages/AuthTestPage'
import { DemoPage } from './pages/DemoPage'
import QRWidgetDemo from './pages/QRWidgetDemo'
import ComponentsDemo from './pages/ComponentsDemo'
import { ProtectedRoute, AdminRoute, TeacherRoute } from './components/ProtectedRoute'
import { CssBaseline, ThemeProvider, GlobalStyles } from '@mui/material'
import { professionalTheme } from './theme/professionalTheme'

function App() {
  return (
    <ThemeProvider theme={professionalTheme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          '.MuiAppBar-root': {
            boxShadow: 'none !important',
            border: 'none !important',
            borderBottom: 'none !important',
            borderTop: 'none !important',
            borderLeft: 'none !important',
            borderRight: 'none !important',
            outline: 'none !important',
          },
          '.MuiAppBar-root::before': {
            border: 'none !important',
          },
          '.MuiAppBar-root::after': {
            border: 'none !important',
          },
          '.MuiToolbar-root': {
            borderBottom: 'none !important',
            borderRadius: '0 !important',
          }
        }}
      />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/attend" element={<AttendPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth-test" element={<AuthTestPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/qr-widget-demo" element={<QRWidgetDemo />} />
          <Route path="/components-demo" element={<ComponentsDemo />} />

          {/* Admin-only routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          } />
          <Route path="/admin-dashboard" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />

          {/* Teacher routes (both ADMIN and GIANGVIEN can access) */}
          <Route path="/teacher-dashboard" element={
            <TeacherRoute>
              <TeacherDashboard />
            </TeacherRoute>
          } />
          <Route path="/create" element={
            <TeacherRoute>
              <CreateSessionPage />
            </TeacherRoute>
          } />
          <Route path="/attendance-detail" element={
            <TeacherRoute>
              <AttendanceDetailPage />
            </TeacherRoute>
          } />

          <Route path="/simple-attendance" element={
            <TeacherRoute>
              <SimpleAttendanceDetailPage />
            </TeacherRoute>
          } />

          {/* Development/Debug routes - protected */}
          <Route path="/test" element={
            <ProtectedRoute>
              <TestPage />
            </ProtectedRoute>
          } />
          <Route path="/debug" element={
            <ProtectedRoute>
              <DebugPage />
            </ProtectedRoute>
          } />

          {/* Redirect unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
