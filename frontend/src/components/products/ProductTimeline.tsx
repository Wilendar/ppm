import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  Divider,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Sync as SyncIcon,
  Error as ErrorIcon,
  FileDownload as ExportIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Visibility as ViewIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { ActivityEntry, ProductMetadata } from '../../types/api.types';

interface ProductTimelineProps {
  timeline: ActivityEntry[];
  metadata: ProductMetadata;
  onViewFullTimeline?: () => void;
}

const ProductTimeline: React.FC<ProductTimelineProps> = ({
  timeline = [],
  metadata,
  onViewFullTimeline,
}) => {
  const [fullTimelineOpen, setFullTimelineOpen] = useState(false);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <AddIcon />;
      case 'updated':
        return <EditIcon />;
      case 'synced':
        return <SyncIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'exported':
        return <ExportIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'success';
      case 'updated':
        return 'primary';
      case 'synced':
        return 'info';
      case 'error':
        return 'error';
      case 'exported':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatRelativeTime = (date: Date) => {
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
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  // Show only recent 3 activities in compact view
  const recentActivities = timeline.slice(0, 3);

  // Full Timeline Modal
  const FullTimelineModal = () => (
    <Dialog
      open={fullTimelineOpen}
      onClose={() => setFullTimelineOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Complete Product Timeline
      </DialogTitle>
      <DialogContent>
        <List>
          {timeline.map((activity, index) => (
            <React.Fragment key={activity.id}>
              <ListItem alignItems="flex-start">
                <ListItemIcon>
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32,
                      bgcolor: `${getActionColor(activity.action)}.light` 
                    }}
                  >
                    {React.cloneElement(getActionIcon(activity.action), {
                      sx: { fontSize: 18 }
                    })}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="span">
                        {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(activity.timestamp)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        {activity.description}
                      </Typography>
                      {activity.actor && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <Avatar sx={{ width: 16, height: 16 }}>
                            <PersonIcon sx={{ fontSize: 10 }} />
                          </Avatar>
                          <Typography variant="caption" color="text.secondary">
                            by {activity.actor}
                          </Typography>
                        </Box>
                      )}
                      {activity.details && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Details: {JSON.stringify(activity.details)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              {index < timeline.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setFullTimelineOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      {/* Product Metadata */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Product Statistics
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Creator
            </Typography>
            <Typography variant="body1" fontSize="0.875rem">
              {metadata.creator}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Views
            </Typography>
            <Typography variant="body1" fontSize="0.875rem">
              {metadata.total_views}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Exports
            </Typography>
            <Typography variant="body1" fontSize="0.875rem">
              {metadata.export_count}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Size
            </Typography>
            <Typography variant="body1" fontSize="0.875rem">
              {metadata.size_estimate}
            </Typography>
          </Box>
        </Box>
        
        {metadata.last_editor && (
          <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              Last edited by: {metadata.last_editor}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Recent Activities */}
      <Box>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Recent Activity
        </Typography>
        
        {recentActivities.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No recent activity
          </Typography>
        ) : (
          <List dense sx={{ py: 0 }}>
            {recentActivities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Avatar 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        bgcolor: `${getActionColor(activity.action)}.light` 
                      }}
                    >
                      {React.cloneElement(getActionIcon(activity.action), {
                        sx: { fontSize: 14 }
                      })}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" component="div">
                        {activity.description}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatRelativeTime(activity.timestamp)}
                        </Typography>
                        {activity.actor && (
                          <>
                            <Typography variant="caption" color="text.secondary">•</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {activity.actor}
                            </Typography>
                          </>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < recentActivities.length - 1 && (
                  <Divider sx={{ ml: 4 }} />
                )}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* View Full Timeline Button */}
        {timeline.length > 3 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ViewIcon />}
              onClick={() => setFullTimelineOpen(true)}
            >
              View Full Timeline ({timeline.length} events)
            </Button>
          </Box>
        )}
      </Box>

      {/* Full Timeline Modal */}
      <FullTimelineModal />
    </Box>
  );
};

export default ProductTimeline;