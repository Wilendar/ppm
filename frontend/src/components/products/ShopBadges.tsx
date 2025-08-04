import React from 'react';
import {
  Box,
  Chip,
  Tooltip,
  Typography,
  Stack,
} from '@mui/material';
import {
  Store as StoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { ShopAssignment } from '../../types/api.types';

interface ShopBadgesProps {
  shops: ShopAssignment[];
  maxVisible?: number;
  size?: 'small' | 'medium';
  showAllLabels?: boolean;
  minWidth?: number;
  maxLabelsPerLine?: number;
}

const ShopBadges: React.FC<ShopBadgesProps> = ({
  shops,
  maxVisible = 3,
  size = 'small',
  showAllLabels = false,
  minWidth = 180,
  maxLabelsPerLine = 4,
}) => {
  if (!shops || shops.length === 0) {
    return (
      <Tooltip title="Product not assigned to any shops">
        <Chip
          label="No shops"
          size={size}
          color="default"
          variant="outlined"
          icon={<StoreIcon />}
        />
      </Tooltip>
    );
  }

  const visibleShops = showAllLabels ? shops : shops.slice(0, maxVisible);
  const hiddenCount = showAllLabels ? 0 : Math.max(0, shops.length - maxVisible);
  const activeShops = shops.filter(shop => shop.isActive);

  const getShopColor = (shop: ShopAssignment) => {
    if (!shop.isActive) return 'default';
    
    // Color based on sync status
    if (shop.lastSync) {
      const syncAge = Date.now() - new Date(shop.lastSync).getTime();
      const hoursOld = syncAge / (1000 * 60 * 60);
      
      if (hoursOld < 1) return 'success';  // Recently synced
      if (hoursOld < 24) return 'primary'; // Synced today
      return 'warning'; // Needs sync
    }
    
    return 'error'; // Never synced
  };

  const getShopIcon = (shop: ShopAssignment) => {
    if (!shop.isActive) return <ErrorIcon />;
    
    if (shop.lastSync) {
      const syncAge = Date.now() - new Date(shop.lastSync).getTime();
      const hoursOld = syncAge / (1000 * 60 * 60);
      
      if (hoursOld < 1) return <CheckCircleIcon />;
      return <ScheduleIcon />;
    }
    
    return <ErrorIcon />;
  };

  // const getShopTooltip = (shop: ShopAssignment) => {
  //   const statusText = shop.isActive ? 'Active' : 'Inactive';
  //   const syncText = shop.lastSync 
  //     ? `Last sync: ${new Date(shop.lastSync).toLocaleString('pl-PL')}`
  //     : 'Never synced';
  //   
  //   return `${shop.shopName} (${statusText})\n${syncText}`;
  // };

  const formatLastSync = (lastSync?: Date) => {
    if (!lastSync) return 'Never';
    
    const now = new Date();
    const sync = new Date(lastSync);
    const diffMinutes = Math.floor((now.getTime() - sync.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const renderShopChips = () => {
    const chunks = [];
    const shopsToShow = showAllLabels ? shops : visibleShops;
    
    // Group shops into lines based on maxLabelsPerLine
    for (let i = 0; i < shopsToShow.length; i += maxLabelsPerLine) {
      chunks.push(shopsToShow.slice(i, i + maxLabelsPerLine));
    }
    
    return chunks.map((chunk, chunkIndex) => (
      <Stack 
        key={chunkIndex} 
        direction="row" 
        spacing={0.5} 
        flexWrap="nowrap" 
        sx={{ 
          mb: chunkIndex < chunks.length - 1 ? 0.5 : 0,
          // Responsive behavior
          '@media (max-width: 900px)': {
            flexWrap: 'wrap',
            '& > *': {
              marginBottom: 0.25,
            },
          },
        }}
      >
        {chunk.map((shop) => (
          <Tooltip
            key={shop.shopId}
            title={
              <Box>
                <Typography variant="subtitle2">{shop.shopName}</Typography>
                <Typography variant="body2">
                  Status: {shop.isActive ? 'Active' : 'Inactive'}
                </Typography>
                <Typography variant="body2">
                  Last sync: {formatLastSync(shop.lastSync)}
                </Typography>
              </Box>
            }
            arrow
          >
            <Chip
              label={shop.shortName}
              size={size}
              color={getShopColor(shop)}
              variant={shop.isActive ? 'filled' : 'outlined'}
              icon={getShopIcon(shop)}
              sx={{
                fontWeight: 'medium',
                fontSize: size === 'small' ? '0.7em' : '0.8em',
                height: size === 'small' ? 24 : 32,
                minWidth: 'auto',
                transition: 'all 0.2s ease-in-out',
                '& .MuiChip-icon': {
                  fontSize: size === 'small' ? '0.9em' : '1em',
                },
                '& .MuiChip-label': {
                  paddingX: size === 'small' ? 1 : 1.5,
                },
                '&:hover': {
                  transform: 'scale(1.05)',
                  zIndex: 1,
                },
                // Mobile responsive
                '@media (max-width: 600px)': {
                  fontSize: '0.65em',
                  height: 20,
                },
              }}
            />
          </Tooltip>
        ))}
      </Stack>
    ));
  };

  return (
    <Box sx={{ minWidth: showAllLabels ? minWidth : 'auto' }}>
      {renderShopChips()}
      
      {hiddenCount > 0 && (
        <Tooltip
          title={
            <Box>
              <Typography variant="subtitle2">Additional shops:</Typography>
              {shops.slice(maxVisible).map((shop) => (
                <Typography key={shop.shopId} variant="body2">
                  • {shop.shopName} ({shop.isActive ? 'Active' : 'Inactive'})
                </Typography>
              ))}
            </Box>
          }
          arrow
        >
          <Chip
            label={`+${hiddenCount}`}
            size={size}
            color="primary"
            variant="outlined"
            sx={{
              fontWeight: 'medium',
              fontSize: size === 'small' ? '0.7em' : '0.8em',
              height: size === 'small' ? 24 : 32,
              mt: 0.5,
            }}
          />
        </Tooltip>
      )}
      
      {/* Summary info for larger displays */}
      {shops.length > 1 && !showAllLabels && (
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            display: { xs: 'none', md: 'block' },
            mt: 0.5,
            fontSize: '0.7em'
          }}
        >
          {activeShops.length} of {shops.length} active
        </Typography>
      )}
    </Box>
  );
};

export default ShopBadges;