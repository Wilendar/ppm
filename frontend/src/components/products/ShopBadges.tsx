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
} from '@mui/icons-material';
import { ShopAssignment } from '../../types/api.types';

interface ShopBadgesProps {
  shops: ShopAssignment[];
  maxVisible?: number;
  size?: 'small' | 'medium';
  showAllLabels?: boolean;
  minWidth?: number;
  maxWidth?: number;
  maxLabelsPerLine?: number;
}

const ShopBadges: React.FC<ShopBadgesProps> = ({
  shops,
  maxVisible = 3,
  size = 'small',
  showAllLabels = false,
  minWidth = 180,
  maxWidth,
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

  const getSyncStatus = (shop: ShopAssignment): 'synced' | 'differences' | 'error' | 'syncing' | 'inactive' => {
    // Use explicit syncStatus from shop data if available
    if (shop.syncStatus) {
      return shop.syncStatus;
    }
    
    // Fallback to calculated status
    if (!shop.isActive) return 'inactive';
    
    if (shop.lastSync) {
      const syncAge = Date.now() - new Date(shop.lastSync).getTime();
      const hoursOld = syncAge / (1000 * 60 * 60);
      
      if (hoursOld < 1) return 'synced';     // Recently synced - green
      if (hoursOld < 24) return 'differences'; // Some differences - orange  
      return 'error';                         // Needs sync - red
    }
    
    return 'error'; // Never synced - red
  };
  
  const getShopColor = (syncStatus: string) => {
    switch (syncStatus) {
      case 'synced': return '#4caf50';      // Green - OK
      case 'differences': return '#ff9800'; // Orange - rozbieżność
      case 'error': return '#f44336';       // Red - błąd
      case 'syncing': return '#2196f3';     // Blue - syncing
      case 'inactive': return '#9e9e9e';    // Gray - inactive
      default: return '#9e9e9e';
    }
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
        {chunk.map((shop) => {
          const syncStatus = getSyncStatus(shop);
          return (
            <Tooltip
              key={shop.shopId}
              title={
                <Box>
                  <Typography variant="subtitle2">{shop.shopName}</Typography>
                  <Typography variant="body2">
                    Status: {shop.isActive ? 'Active' : 'Inactive'}
                  </Typography>
                  <Typography variant="body2">
                    Sync: {syncStatus === 'synced' ? 'OK' : syncStatus === 'differences' ? 'Differences' : syncStatus === 'error' ? 'Error' : syncStatus === 'syncing' ? 'Syncing...' : 'Inactive'}
                  </Typography>
                  {shop.differences && shop.differences.length > 0 && (
                    <Typography variant="body2" color="warning.main">
                      Issues: {shop.differences.join(', ')}
                    </Typography>
                  )}
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
                sx={{
                  height: size === 'small' ? 20 : 24,           // Slim height
                  fontSize: size === 'small' ? '0.6875rem' : '0.75rem', // Smaller font (11px/12px)
                  fontWeight: 400,                               // Lighter weight
                  margin: '1px 2px',                            // Tight spacing
                  borderRadius: 10,                             // More rounded
                  minWidth: 'auto',
                  backgroundColor: getShopColor(syncStatus),
                  color: '#ffffff',
                  border: 'none',
                  transition: 'all 0.2s ease-in-out',
                  
                  '& .MuiChip-label': {
                    padding: size === 'small' ? '0 4px' : '0 6px', // Reduced padding
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                  },
                  '&:hover': {
                    transform: 'scale(1.05)',
                    zIndex: 1,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  },
                  // Mobile responsive
                  '@media (max-width: 600px)': {
                    fontSize: '0.625rem', // 10px
                    height: 18,
                    '& .MuiChip-label': {
                      padding: '0 3px',
                    },
                  },
                }}
              />
            </Tooltip>
          );
        })}
      </Stack>
    ));
  };

  return (
    <Box sx={{ 
      minWidth: showAllLabels ? minWidth : 'auto',
      maxWidth: maxWidth || 'none',
      width: '100%'
    }}>
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
            sx={{
              height: size === 'small' ? 20 : 24,
              fontSize: size === 'small' ? '0.6875rem' : '0.75rem',
              fontWeight: 400,
              margin: '1px 2px',
              borderRadius: 10,
              mt: 0.5,
              backgroundColor: '#2196f3',
              color: '#ffffff',
              border: 'none',
              '& .MuiChip-label': {
                padding: size === 'small' ? '0 4px' : '0 6px',
              },
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