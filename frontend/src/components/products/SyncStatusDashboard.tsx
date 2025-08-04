import React, { useState } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DetailedSyncStatus } from '../../types/api.types';

interface SyncStatusDashboardProps {
  syncStatus: DetailedSyncStatus;
  onSyncNow?: () => void;
  onViewDetails?: () => void;
  isLoading?: boolean;
}

const SyncStatusDashboard: React.FC<SyncStatusDashboardProps> = ({
  syncStatus,
  onSyncNow,
  onViewDetails,
  isLoading = false,
}) => {
  const [syncDetailsOpen, setSyncDetailsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const getSyncStatusIcon = () => {
    switch (syncStatus.status) {
      case 'synced':
        return <CheckCircleIcon color="success" />;
      case 'differences':
        return <WarningIcon color="warning" />;
      case 'not_synced':
        return <InfoIcon color="info" />;
      case 'syncing':
        return <CircularProgress size={20} />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getSyncStatusColor = () => {
    switch (syncStatus.status) {
      case 'synced':
        return 'success';
      case 'differences':
        return 'warning';
      case 'not_synced':
        return 'info';
      case 'syncing':
        return 'primary';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSyncStatusMessage = () => {
    switch (syncStatus.status) {
      case 'synced':
        return 'All shops are synchronized';
      case 'differences':
        return 'Differences detected in some shops';
      case 'not_synced':
        return 'Product not synchronized yet';
      case 'syncing':
        return 'Synchronization in progress...';
      case 'error':
        return 'Synchronization errors occurred';
      default:
        return 'Unknown sync status';
    }
  };

  const formatDuration = (milliseconds?: number) => {
    if (!milliseconds) return 'N/A';
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatRelativeTime = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return `${diffInDays}d ago`;
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      await onSyncNow?.();
      // Simulate sync duration
      setTimeout(() => {
        setIsSyncing(false);
      }, 3000);
    } catch (error) {
      setIsSyncing(false);
    }
  };

  const syncProgress = (syncStatus.syncedShops / syncStatus.totalShops) * 100;

  // Sync Details Modal
  const SyncDetailsModal = () => (
    <Dialog
      open={syncDetailsOpen}
      onClose={() => setSyncDetailsOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon />
          Sync Status Details
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          {/* Overall Status */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Overall Sync Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {getSyncStatusIcon()}
                <Typography variant="body1">
                  {getSyncStatusMessage()}
                </Typography>
                <Chip 
                  label={syncStatus.status.toUpperCase()}
                  color={getSyncStatusColor()}
                  size="small"
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Shop Synchronization Progress
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={syncProgress} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {syncStatus.syncedShops} of {syncStatus.totalShops} shops synchronized
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Last Sync
                  </Typography>
                  <Typography variant="body1">
                    {formatRelativeTime(syncStatus.lastSync)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Next Sync
                  </Typography>
                  <Typography variant="body1">
                    {formatRelativeTime(syncStatus.nextSync)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Performance Metrics */}
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Last Sync Duration
                  </Typography>
                  <Typography variant="body1">
                    {formatDuration(syncStatus.lastSyncDuration)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Average Sync Time
                  </Typography>
                  <Typography variant="body1">
                    {formatDuration(syncStatus.averageSyncTime)}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Detected Differences */}
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Detected Differences
              </Typography>
              {syncStatus.differences && syncStatus.differences.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {syncStatus.differences.map((diff, index) => (
                    <Chip key={index} label={diff} size="small" color="warning" />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No differences detected
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Sync Errors */}
          {syncStatus.syncErrors.length > 0 && (
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom color="error">
                  Sync Errors ({syncStatus.syncErrors.length})
                </Typography>
                <List dense>
                  {syncStatus.syncErrors.map((error, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <ErrorIcon color="error" />
                      </ListItemIcon>
                      <ListItemText primary={error} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setSyncDetailsOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      {/* Status Overview */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {getSyncStatusIcon()}
          <Typography variant="body1" fontWeight="medium">
            {getSyncStatusMessage()}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Shop Progress
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={syncProgress} 
            sx={{ height: 6, borderRadius: 3 }}
          />
          <Typography variant="caption" color="text.secondary">
            {syncStatus.syncedShops}/{syncStatus.totalShops} shops
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: '0.875rem' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Last Sync
            </Typography>
            <Typography variant="body2">
              {formatRelativeTime(syncStatus.lastSync)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Next Sync
            </Typography>
            <Typography variant="body2">
              {formatRelativeTime(syncStatus.nextSync)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Differences Alert */}
      {syncStatus.differences && syncStatus.differences.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            {syncStatus.differences.length} difference(s) detected between product data and shop data.
          </Typography>
        </Alert>
      )}

      {/* Sync Errors Alert */}
      {syncStatus.syncErrors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2">
            {syncStatus.syncErrors.length} sync error(s) occurred. Click "View Details" for more information.
          </Typography>
        </Alert>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
        <Button
          variant="contained"
          size="small"
          startIcon={isSyncing ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={handleSyncNow}
          disabled={isSyncing || syncStatus.status === 'syncing'}
          fullWidth
        >
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </Button>
        
        <Button
          variant="outlined"
          size="small"
          startIcon={<AssessmentIcon />}
          onClick={() => setSyncDetailsOpen(true)}
          fullWidth
        >
          View Details
        </Button>
      </Box>

      {/* Sync Details Modal */}
      <SyncDetailsModal />
    </Box>
  );
};

export default SyncStatusDashboard;