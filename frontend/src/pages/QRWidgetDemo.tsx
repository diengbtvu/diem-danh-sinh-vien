import React, { useState } from 'react'
import {
  Container, Typography, Grid, Paper, TextField, FormControl,
  InputLabel, Select, MenuItem, FormControlLabel, Switch,
  Box, Stack, Button, Divider
} from '@mui/material'
import { QRWidget } from '../components/QRWidget'

export default function QRWidgetDemo() {
  const [qrData, setQrData] = useState('https://example.com/attend?session=demo-session-123')
  const [title, setTitle] = useState('Demo QR Code')
  const [size, setSize] = useState<'small' | 'medium' | 'large' | 'extra-large'>('medium')
  const [showCopy, setShowCopy] = useState(true)
  const [showDownload, setShowDownload] = useState(true)
  const [showRefresh, setShowRefresh] = useState(true)
  const [showDataToggle, setShowDataToggle] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState<number | undefined>(undefined)
  const [status, setStatus] = useState<'active' | 'inactive' | 'expired' | 'loading'>('active')

  const handleRefresh = () => {
    console.log('QR Widget refreshed!')
  }

  const presetData = [
    {
      label: 'Attendance Session',
      data: 'https://example.com/attend?session=SESSION-abc123-def456'
    },
    {
      label: 'Website URL',
      data: 'https://github.com/your-repo/attendance-system'
    },
    {
      label: 'Contact Info',
      data: 'BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nORG:University\nTEL:+1234567890\nEMAIL:john@university.edu\nEND:VCARD'
    },
    {
      label: 'WiFi Network',
      data: 'WIFI:T:WPA;S:UniversityWiFi;P:password123;H:false;'
    },
    {
      label: 'Simple Text',
      data: 'Hello, this is a simple QR code with text content!'
    }
  ]

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        QR Widget Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Interactive demo of the QR Widget component with various configuration options.
      </Typography>

      <Grid container spacing={4}>
        {/* Configuration Panel */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Configuration
            </Typography>

            <Stack spacing={3}>
              {/* QR Data */}
              <TextField
                label="QR Data"
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
                multiline
                rows={3}
                fullWidth
                helperText="Enter the data to encode in the QR code"
              />

              {/* Preset Data */}
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Quick Presets:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {presetData.map((preset, index) => (
                    <Button
                      key={index}
                      size="small"
                      variant="outlined"
                      onClick={() => setQrData(preset.data)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </Stack>
              </Box>

              <Divider />

              {/* Widget Title */}
              <TextField
                label="Widget Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
              />

              {/* Size */}
              <FormControl fullWidth>
                <InputLabel>Size</InputLabel>
                <Select
                  value={size}
                  label="Size"
                  onChange={(e) => setSize(e.target.value as any)}
                >
                  <MenuItem value="small">Small (150px)</MenuItem>
                  <MenuItem value="medium">Medium (200px)</MenuItem>
                  <MenuItem value="large">Large (300px)</MenuItem>
                  <MenuItem value="extra-large">Extra Large (400px)</MenuItem>
                </Select>
              </FormControl>

              {/* Status */}
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                  <MenuItem value="loading">Loading</MenuItem>
                </Select>
              </FormControl>

              {/* Auto Refresh */}
              <TextField
                label="Auto Refresh (seconds)"
                type="number"
                value={autoRefresh || ''}
                onChange={(e) => setAutoRefresh(e.target.value ? parseInt(e.target.value) : undefined)}
                fullWidth
                helperText="Leave empty to disable auto refresh"
              />

              <Divider />

              {/* Feature Toggles */}
              <Typography variant="subtitle2">Features</Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={showCopy}
                    onChange={(e) => setShowCopy(e.target.checked)}
                  />
                }
                label="Show Copy Button"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={showDownload}
                    onChange={(e) => setShowDownload(e.target.checked)}
                  />
                }
                label="Show Download Button"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={showRefresh}
                    onChange={(e) => setShowRefresh(e.target.checked)}
                  />
                }
                label="Show Refresh Button"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={showDataToggle}
                    onChange={(e) => setShowDataToggle(e.target.checked)}
                  />
                }
                label="Show Data Toggle"
              />
            </Stack>
          </Paper>
        </Grid>

        {/* QR Widget Preview */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Preview
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <QRWidget
                data={qrData}
                title={title}
                size={size}
                showCopy={showCopy}
                showDownload={showDownload}
                showRefresh={showRefresh}
                showDataToggle={showDataToggle}
                autoRefresh={autoRefresh}
                status={status}
                onRefresh={handleRefresh}
              />
            </Box>
          </Paper>

          {/* Usage Example */}
          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Usage Example
            </Typography>
            <Box
              component="pre"
              sx={{
                backgroundColor: '#f5f5f5',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
                fontSize: '0.875rem',
                fontFamily: 'monospace'
              }}
            >
{`<QRWidget
  data="${qrData}"
  title="${title}"
  size="${size}"
  showCopy={${showCopy}}
  showDownload={${showDownload}}
  showRefresh={${showRefresh}}
  showDataToggle={${showDataToggle}}
  ${autoRefresh ? `autoRefresh={${autoRefresh}}` : ''}
  status="${status}"
  onRefresh={handleRefresh}
/>`}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
