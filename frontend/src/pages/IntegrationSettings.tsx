import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Test,
  Webhook,
  School,
  Api,
  Settings,
  CheckCircle,
  Error,
  Warning
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { AnimatedPage, StaggerContainer, StaggerItem } from '../components/animations/AnimatedPage';
import { LoadingSpinner } from '../components/animations/LoadingSpinner';

interface Webhook {
  id: number;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  successCount: number;
  failureCount: number;
  lastError?: string;
  createdAt: string;
  lastTriggeredAt?: string;
}

interface LMSIntegration {
  id: string;
  name: string;
  type: 'moodle' | 'canvas' | 'blackboard';
  baseUrl: string;
  isActive: boolean;
  lastSync?: string;
  syncedStudents?: number;
  syncedGrades?: number;
}

export const IntegrationSettings: React.FC = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [lmsIntegrations, setLmsIntegrations] = useState<LMSIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [lmsDialogOpen, setLmsDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [editingLMS, setEditingLMS] = useState<LMSIntegration | null>(null);

  // Webhook form state
  const [webhookForm, setWebhookForm] = useState({
    name: '',
    url: '',
    secret: '',
    events: [] as string[],
    description: '',
    timeoutSeconds: 30,
    retryCount: 3
  });

  // LMS form state
  const [lmsForm, setLmsForm] = useState({
    name: '',
    type: 'moodle' as 'moodle' | 'canvas' | 'blackboard',
    baseUrl: '',
    apiKey: '',
    courseId: ''
  });

  const availableEvents = [
    'attendance.created',
    'attendance.updated',
    'session.created',
    'session.ended',
    'student.registered',
    'anti_cheat.violation'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load webhooks
      const webhooksResponse = await fetch('/api/integrations/webhooks');
      if (webhooksResponse.ok) {
        const webhooksData = await webhooksResponse.json();
        setWebhooks(webhooksData.content || []);
      }

      // Mock LMS integrations data
      setLmsIntegrations([
        {
          id: '1',
          name: 'Moodle HUST',
          type: 'moodle',
          baseUrl: 'https://moodle.hust.edu.vn',
          isActive: true,
          lastSync: '2024-01-15T10:30:00Z',
          syncedStudents: 45,
          syncedGrades: 42
        },
        {
          id: '2',
          name: 'Canvas LMS',
          type: 'canvas',
          baseUrl: 'https://canvas.university.edu',
          isActive: false,
          lastSync: '2024-01-10T14:20:00Z',
          syncedStudents: 38,
          syncedGrades: 35
        }
      ]);
    } catch (error) {
      console.error('Failed to load integration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async () => {
    try {
      const response = await fetch('/api/integrations/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookForm)
      });

      if (response.ok) {
        await loadData();
        setWebhookDialogOpen(false);
        resetWebhookForm();
      }
    } catch (error) {
      console.error('Failed to create webhook:', error);
    }
  };

  const handleTestWebhook = async (webhookId: number) => {
    try {
      const response = await fetch(`/api/integrations/webhooks/${webhookId}/test`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Test ${result.success ? 'successful' : 'failed'}: ${result.error || 'OK'}`);
      }
    } catch (error) {
      console.error('Failed to test webhook:', error);
    }
  };

  const handleToggleWebhook = async (webhookId: number) => {
    try {
      const response = await fetch(`/api/integrations/webhooks/${webhookId}/toggle`, {
        method: 'POST'
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Failed to toggle webhook:', error);
    }
  };

  const handleSyncLMS = async (integration: LMSIntegration) => {
    try {
      const endpoint = integration.type === 'moodle' 
        ? '/api/integrations/lms/moodle/sync'
        : '/api/integrations/lms/canvas/sync';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lmsType: integration.type,
          baseUrl: integration.baseUrl,
          courseId: 'default'
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Sync completed: ${result.syncedStudents} students, ${result.syncedGrades} grades`);
        await loadData();
      }
    } catch (error) {
      console.error('Failed to sync LMS:', error);
    }
  };

  const resetWebhookForm = () => {
    setWebhookForm({
      name: '',
      url: '',
      secret: '',
      events: [],
      description: '',
      timeoutSeconds: 30,
      retryCount: 3
    });
    setEditingWebhook(null);
  };

  const getStatusColor = (webhook: Webhook) => {
    if (!webhook.isActive) return 'default';
    if (webhook.failureCount > 5) return 'error';
    if (webhook.failureCount > 0) return 'warning';
    return 'success';
  };

  const getStatusLabel = (webhook: Webhook) => {
    if (!webhook.isActive) return 'Inactive';
    if (webhook.failureCount > 5) return 'Failing';
    if (webhook.failureCount > 0) return 'Warning';
    return 'Active';
  };

  if (loading) {
    return (
      <AnimatedPage>
        <Box p={3}>
          <LoadingSpinner text="Loading integrations..." />
        </Box>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <Box p={3}>
        <StaggerContainer>
          {/* Header */}
          <StaggerItem>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h4" fontWeight={600} gutterBottom>
                  Integration Settings
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage webhooks and external system integrations
                </Typography>
              </Box>
            </Box>
          </StaggerItem>

          {/* Webhooks Section */}
          <StaggerItem>
            <Card sx={{ mb: 3 }}>
              <CardHeader
                title="Webhooks"
                subheader="Configure HTTP callbacks for real-time notifications"
                action={
                  <Button
                    startIcon={<Add />}
                    onClick={() => setWebhookDialogOpen(true)}
                    variant="contained"
                  >
                    Add Webhook
                  </Button>
                }
              />
              <CardContent>
                {webhooks.length === 0 ? (
                  <Alert severity="info">
                    No webhooks configured. Add a webhook to receive real-time notifications.
                  </Alert>
                ) : (
                  <Grid container spacing={2}>
                    {webhooks.map((webhook) => (
                      <Grid item xs={12} md={6} key={webhook.id}>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                              <Box>
                                <Typography variant="h6" gutterBottom>
                                  {webhook.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  {webhook.url}
                                </Typography>
                              </Box>
                              <Chip
                                label={getStatusLabel(webhook)}
                                color={getStatusColor(webhook)}
                                size="small"
                              />
                            </Box>

                            <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
                              {webhook.events.map((event) => (
                                <Chip key={event} label={event} size="small" variant="outlined" />
                              ))}
                            </Stack>

                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="text.secondary">
                                Success: {webhook.successCount} | Failures: {webhook.failureCount}
                              </Typography>
                              <Stack direction="row" spacing={1}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleTestWebhook(webhook.id)}
                                  title="Test webhook"
                                >
                                  <Test />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleToggleWebhook(webhook.id)}
                                  title={webhook.isActive ? 'Disable' : 'Enable'}
                                >
                                  {webhook.isActive ? <CheckCircle color="success" /> : <Error color="disabled" />}
                                </IconButton>
                              </Stack>
                            </Box>
                          </Paper>
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </StaggerItem>

          {/* LMS Integrations Section */}
          <StaggerItem>
            <Card>
              <CardHeader
                title="LMS Integrations"
                subheader="Connect with Learning Management Systems"
                action={
                  <Button
                    startIcon={<Add />}
                    onClick={() => setLmsDialogOpen(true)}
                    variant="outlined"
                  >
                    Add LMS
                  </Button>
                }
              />
              <CardContent>
                {lmsIntegrations.length === 0 ? (
                  <Alert severity="info">
                    No LMS integrations configured. Connect with your Learning Management System.
                  </Alert>
                ) : (
                  <List>
                    {lmsIntegrations.map((integration, index) => (
                      <React.Fragment key={integration.id}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <School />
                                <Typography variant="subtitle1">{integration.name}</Typography>
                                <Chip
                                  label={integration.type.toUpperCase()}
                                  size="small"
                                  variant="outlined"
                                />
                                <Chip
                                  label={integration.isActive ? 'Active' : 'Inactive'}
                                  color={integration.isActive ? 'success' : 'default'}
                                  size="small"
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {integration.baseUrl}
                                </Typography>
                                {integration.lastSync && (
                                  <Typography variant="caption" color="text.secondary">
                                    Last sync: {new Date(integration.lastSync).toLocaleString()} 
                                    ({integration.syncedStudents} students, {integration.syncedGrades} grades)
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                onClick={() => handleSyncLMS(integration)}
                                disabled={!integration.isActive}
                              >
                                Sync Now
                              </Button>
                              <IconButton size="small">
                                <Settings />
                              </IconButton>
                            </Stack>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < lmsIntegrations.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* Webhook Dialog */}
        <Dialog open={webhookDialogOpen} onClose={() => setWebhookDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingWebhook ? 'Edit Webhook' : 'Create New Webhook'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="Name"
                value={webhookForm.name}
                onChange={(e) => setWebhookForm(prev => ({ ...prev, name: e.target.value }))}
                fullWidth
                required
              />
              <TextField
                label="URL"
                value={webhookForm.url}
                onChange={(e) => setWebhookForm(prev => ({ ...prev, url: e.target.value }))}
                fullWidth
                required
                placeholder="https://your-server.com/webhook"
              />
              <TextField
                label="Secret (optional)"
                value={webhookForm.secret}
                onChange={(e) => setWebhookForm(prev => ({ ...prev, secret: e.target.value }))}
                fullWidth
                type="password"
                helperText="Used to sign webhook payloads for security"
              />
              <FormControl fullWidth>
                <InputLabel>Events</InputLabel>
                <Select
                  multiple
                  value={webhookForm.events}
                  onChange={(e) => setWebhookForm(prev => ({ ...prev, events: e.target.value as string[] }))}
                  label="Events"
                >
                  {availableEvents.map((event) => (
                    <MenuItem key={event} value={event}>
                      {event}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Description"
                value={webhookForm.description}
                onChange={(e) => setWebhookForm(prev => ({ ...prev, description: e.target.value }))}
                fullWidth
                multiline
                rows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setWebhookDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateWebhook} variant="contained">
              {editingWebhook ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AnimatedPage>
  );
};
