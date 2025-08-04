import React from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  Tooltip,
  Typography,
  IconButton,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Sync as SyncIcon,
  SyncDisabled as SyncDisabledIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { SyncStatus } from '../../types/api.types';

interface SyncStatusIndicatorProps {
  syncStatus: SyncStatus;
  productName?: string;
  onRefreshSync?: () => void;
  size?: 'small' | 'medium';
  showLabel?: boolean;
  isRefreshing?: boolean;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  syncStatus,
  productName = 'Product',
  onRefreshSync,
  size = 'small',
  showLabel = true,
  isRefreshing = false,
}) => {
  const getStatusConfig = (status: SyncStatus['status']) => {
    switch (status) {
      case 'synced':
        return {
          color: 'success' as const,
          icon: <CheckCircleIcon />,
          label: 'Synced',
          description: 'Data is synchronized across all shops',
        };
      case 'differences':
        return {
          color: 'warning' as const,
          icon: <WarningIcon />,
          label: 'Differences',
          description: 'Data differences detected between shops',
        };
      case 'not_synced':
        return {
          color: 'default' as const,
          icon: <SyncDisabledIcon />,
          label: 'Not synced',
          description: 'Product has never been synchronized',
        };
      case 'syncing':
        return {
          color: 'info' as const,
          icon: <SyncIcon />,
          label: 'Syncing',
          description: 'Synchronization in progress',
        };
      case 'error':
        return {
          color: 'error' as const,
          icon: <ErrorIcon />,
          label: 'Error',
          description: 'Synchronization failed',
        };
      default:
        return {
          color: 'default' as const,
          icon: <SyncDisabledIcon />,
          label: 'Unknown',
          description: 'Unknown synchronization status',
        };
    }
  };

  const config = getStatusConfig(syncStatus.status);

  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(date).toLocaleDateString('pl-PL');
  };

  const getTooltipContent = () => (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {productName} - Sync Status
      </Typography>
      
      <Typography variant="body2" gutterBottom>
        Status: <strong>{config.description}</strong>
      </Typography>
      
      <Typography variant="body2" gutterBottom>
        Last sync: <strong>{formatDate(syncStatus.lastSync)}</strong>
      </Typography>
      
      {syncStatus.nextSync && (
        <Typography variant="body2" gutterBottom>
          Next sync: <strong>{formatDate(syncStatus.nextSync)}</strong>
        </Typography>
      )}
      
      {syncStatus.differences && syncStatus.differences.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" gutterBottom>
            <strong>Differences detected:</strong>
          </Typography>
          {syncStatus.differences.slice(0, 3).map((diff, index) => (
            <Typography key={index} variant="body2" sx={{ fontSize: '0.8em' }}>
              • {diff}
            </Typography>
          ))}
          {syncStatus.differences.length > 3 && (
            <Typography variant="body2" sx={{ fontSize: '0.8em' }}>
              • ... and {syncStatus.differences.length - 3} more
            </Typography>
          )}
        </Box>
      )}
      
      {onRefreshSync && (
        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
          Click to refresh sync status
        </Typography>
      )}
    </Box>
  );

  const handleClick = () => {
    if (onRefreshSync && !isRefreshing) {
      onRefreshSync();
    }
  };

  if (!showLabel) {
    return (
      <Tooltip title={getTooltipContent()} arrow>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            cursor: onRefreshSync ? 'pointer' : 'default',
          }}
          onClick={handleClick}
        >
          {isRefreshing ? (
            <CircularProgress size={size === 'small' ? 16 : 20} />
          ) : (
            <Box
              sx={{
                color: `${config.color}.main`,
                display: 'flex',
                alignItems: 'center',
                fontSize: size === 'small' ? '1rem' : '1.2rem',
              }}
            >
              {config.icon}
            </Box>
          )}
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Tooltip title={getTooltipContent()} arrow>
        <Chip
          icon={
            isRefreshing ? (
              <CircularProgress size={size === 'small' ? 12 : 16} />
            ) : (
              config.icon
            )
          }
          label={config.label}
          size={size}
          color={config.color}
          variant={syncStatus.status === 'synced' ? 'filled' : 'outlined'}
          onClick={handleClick}
          sx={{
            cursor: onRefreshSync ? 'pointer' : 'default',
            '& .MuiChip-icon': {
              fontSize: size === 'small' ? '1rem' : '1.2rem',
            },
          }}
        />
      </Tooltip>
      
      {onRefreshSync && !isRefreshing && (
        <Tooltip title="Refresh sync status">
          <IconButton
            size="small"
            onClick={handleClick}
            sx={{
              padding: '2px',
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main',
              },
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default SyncStatusIndicator;