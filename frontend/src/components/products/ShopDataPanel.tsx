import React, { useState } from 'react';
import {
  Box,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Store as StoreIcon,
  Sync as SyncIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Edit as EditIcon,
  Launch as LaunchIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { DetailedShopData, ProductStatus } from '../../types/api.types';

interface ShopDataPanelProps {
  shopData: DetailedShopData[];
  onShopClick?: (shopId: string) => void;
  onShopEdit?: (shopData: DetailedShopData) => void;
  readOnly?: boolean;
}

const ShopDataPanel: React.FC<ShopDataPanelProps> = ({
  shopData = [],
  onShopClick,
  onShopEdit,
  readOnly = false,
}) => {
  const [selectedShop, setSelectedShop] = useState<DetailedShopData | null>(null);
  const [shopModalOpen, setShopModalOpen] = useState(false);

  const handleShopClick = (shop: DetailedShopData) => {
    setSelectedShop(shop);
    setShopModalOpen(true);
    onShopClick?.(shop.shop_id.toString());
  };

  const getStatusColor = (status: ProductStatus) => {
    switch (status) {
      case ProductStatus.ACTIVE:
        return 'success';
      case ProductStatus.INACTIVE:
        return 'warning';
      case ProductStatus.DRAFT:
        return 'info';
      case ProductStatus.ARCHIVED:
        return 'default';
      default:
        return 'default';
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString();
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Shop Detail Modal
  const ShopDetailModal = () => {
    if (!selectedShop) return null;

    return (
      <Dialog
        open={shopModalOpen}
        onClose={() => setShopModalOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <StoreIcon />
            <Typography variant="h6">
              {selectedShop.shop?.name || `Shop ${selectedShop.shop_id}`}
            </Typography>
            <Chip
              label={selectedShop.status}
              color={getStatusColor(selectedShop.status)}
              size="small"
            />
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📋 Basic Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Product Name
                      </Typography>
                      <Typography variant="body1">
                        {selectedShop.name}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Shop-specific Description
                      </Typography>
                      <Typography variant="body1">
                        {selectedShop.description || 'No custom description'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Short Description
                      </Typography>
                      <Typography variant="body1">
                        {selectedShop.short_description || 'No short description'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Tags
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                        {selectedShop.tags?.map((tag, index) => (
                          <Chip key={index} label={tag} size="small" variant="outlined" />
                        )) || <Typography variant="body2" color="text.secondary">No tags</Typography>}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Pricing Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    💰 Pricing & Inventory
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Base Price
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(selectedShop.pricing.price, selectedShop.pricing.currency)}
                      </Typography>
                    </Box>

                    {selectedShop.pricing.sale_price && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Sale Price
                        </Typography>
                        <Typography variant="h6" color="error">
                          {formatCurrency(selectedShop.pricing.sale_price, selectedShop.pricing.currency)}
                        </Typography>
                      </Box>
                    )}

                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Price with Tax ({selectedShop.pricing.tax_rate}%)
                      </Typography>
                      <Typography variant="body1">
                        {formatCurrency(selectedShop.pricing.price_with_tax, selectedShop.pricing.currency)}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Stock Quantity
                      </Typography>
                      <Typography variant="body1">
                        {selectedShop.inventory.stock_quantity} units
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Low Stock Threshold
                      </Typography>
                      <Typography variant="body1">
                        {selectedShop.inventory.low_stock_threshold} units
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip 
                        label={selectedShop.inventory.track_quantity ? "Quantity Tracked" : "No Tracking"}
                        color={selectedShop.inventory.track_quantity ? "success" : "default"}
                        size="small"
                      />
                      <Chip 
                        label={selectedShop.inventory.allow_backorders ? "Backorders OK" : "No Backorders"}
                        color={selectedShop.inventory.allow_backorders ? "info" : "default"}
                        size="small"
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* SEO & Meta Information */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🔍 SEO & Meta Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Meta Title
                        </Typography>
                        <Typography variant="body1">
                          {selectedShop.meta_title || 'No meta title set'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Meta Description
                        </Typography>
                        <Typography variant="body1">
                          {selectedShop.meta_description || 'No meta description set'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Sync Information */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SyncIcon />
                    Last Sync Details
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    {getSyncStatusIcon(selectedShop.lastSyncDetails.status)}
                    <Typography variant="body1">
                      Status: {selectedShop.lastSyncDetails.status.toUpperCase()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(selectedShop.lastSyncDetails.timestamp)}
                    </Typography>
                  </Box>

                  {selectedShop.lastSyncDetails.changes_detected.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Changes Detected:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {selectedShop.lastSyncDetails.changes_detected.map((change, index) => (
                          <Chip key={index} label={change} size="small" color="info" />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {selectedShop.lastSyncDetails.error_message && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {selectedShop.lastSyncDetails.error_message}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          {!readOnly && (
            <Button
              startIcon={<EditIcon />}
              onClick={() => onShopEdit?.(selectedShop)}
            >
              Edit Shop Data
            </Button>
          )}
          <Button
            startIcon={<LaunchIcon />}
            onClick={() => window.open(`/shops/${selectedShop.shop_id}`, '_blank')}
          >
            View in Shop
          </Button>
          <Button onClick={() => setShopModalOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      {shopData.length === 0 ? (
        <Alert severity="info">
          This product is not assigned to any shops yet.
        </Alert>
      ) : (
        <Box>
          {/* Shop Badges */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {shopData.map((shop) => (
              <Tooltip key={shop.id} title={`Click for details - ${shop.shop?.name}`}>
                <Badge
                  badgeContent={
                    shop.lastSyncDetails.status === 'error' ? '!' : 
                    shop.lastSyncDetails.changes_detected.length > 0 ? '•' : null
                  }
                  color={
                    shop.lastSyncDetails.status === 'error' ? 'error' : 
                    shop.lastSyncDetails.changes_detected.length > 0 ? 'warning' : 'default'
                  }
                >
                  <Chip
                    label={shop.shop?.shortName || `SHOP${shop.shop_id}`}
                    color={getStatusColor(shop.status)}
                    onClick={() => handleShopClick(shop)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { transform: 'scale(1.05)' },
                      transition: 'transform 0.2s',
                    }}
                  />
                </Badge>
              </Tooltip>
            ))}
          </Box>

          {/* Quick Stats */}
          <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Active Shops
                </Typography>
                <Typography variant="h6">
                  {shopData.filter(shop => shop.status === ProductStatus.ACTIVE).length} / {shopData.length}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Avg Price
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(
                    shopData.reduce((sum, shop) => sum + shop.pricing.price, 0) / shopData.length
                  )}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Recent Sync Issues */}
          {shopData.some(shop => shop.lastSyncDetails.status === 'error' || shop.lastSyncDetails.changes_detected.length > 0) && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Some shops have sync issues or detected changes. Click on shop badges for details.
              </Typography>
            </Alert>
          )}
        </Box>
      )}

      {/* Shop Detail Modal */}
      <ShopDetailModal />
    </Box>
  );
};

export default ShopDataPanel;