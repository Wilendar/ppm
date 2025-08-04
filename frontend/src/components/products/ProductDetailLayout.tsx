import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Paper,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Visibility as PreviewIcon,
  Share as ShareIcon,
  ContentCopy as CopyIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import { DetailedProduct, ProductStatus } from '../../types/api.types';

// Importy komponentów - na razie placeholder
import ProductImages from './ProductImages';
import CategorySelector from './CategorySelector';
import ProductDescriptions from './ProductDescriptions';
import ShopDataPanel from './ShopDataPanel';
import ProductTimeline from './ProductTimeline';
import SyncStatusDashboard from './SyncStatusDashboard';
import VariantsManager from './VariantsManager';

interface ProductDetailLayoutProps {
  open: boolean;
  onClose: () => void;
  product: DetailedProduct | null;
  onSave?: (product: DetailedProduct) => void;
  onEdit?: (product: DetailedProduct) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

const ProductDetailLayout: React.FC<ProductDetailLayoutProps> = ({
  open,
  onClose,
  product,
  onSave,
  onEdit,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const [mobileTab, setMobileTab] = useState(0);

  if (!product) return null;

  // Status chip renderer
  const getStatusChip = (status: ProductStatus) => {
    const statusConfig = {
      [ProductStatus.ACTIVE]: { color: 'success' as const, label: 'Active' },
      [ProductStatus.INACTIVE]: { color: 'warning' as const, label: 'Inactive' },
      [ProductStatus.DRAFT]: { color: 'info' as const, label: 'Draft' },
      [ProductStatus.ARCHIVED]: { color: 'default' as const, label: 'Archived' },
    };

    const config = statusConfig[status];
    return (
      <Chip
        label={config.label}
        color={config.color}
        variant="outlined"
        size="small"
      />
    );
  };

  // Quick actions handler
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'preview':
        // Open product in new tab/window
        console.log('Preview product:', product.sku);
        break;
      case 'export':
        // Export product data
        console.log('Export product:', product.sku);
        break;
      case 'copy':
        // Copy product link to clipboard
        navigator.clipboard.writeText(`/products/${product.id}`);
        break;
      case 'share':
        // Share product URL
        console.log('Share product:', product.sku);
        break;
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(product);
    }
  };

  // Mobile tab navigation
  const MobileTabsComponent = () => (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs 
        value={mobileTab} 
        onChange={(_, newValue) => setMobileTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Images" />
        <Tab label="Content" />
        <Tab label="Info" />
      </Tabs>
    </Box>
  );

  // Desktop 3-column layout
  const DesktopLayout = () => (
    <Box sx={{ display: 'flex', gap: 2, height: '70vh', overflow: 'hidden' }}>
      {/* LEFT COLUMN - Images & Actions */}
      <Paper 
        elevation={1} 
        sx={{ 
          width: 300, 
          flexShrink: 0, 
          p: 2, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'auto'
        }}
      >
        <Typography variant="h6" gutterBottom>
          📷 Images
        </Typography>
        <ProductImages 
          images={product.images}
          onImageSelect={(image) => console.log('Selected image:', image)}
          onImageUpload={(files) => console.log('Upload files:', files)}
        />
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          🎯 Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PreviewIcon />}
            onClick={() => handleQuickAction('preview')}
            fullWidth
          >
            Preview
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ExportIcon />}
            onClick={() => handleQuickAction('export')}
            fullWidth
          >
            Export
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CopyIcon />}
            onClick={() => handleQuickAction('copy')}
            fullWidth
          >
            Copy Link
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ShareIcon />}
            onClick={() => handleQuickAction('share')}
            fullWidth
          >
            Share
          </Button>
        </Box>
      </Paper>

      {/* CENTER COLUMN - Categories & Content */}
      <Paper 
        elevation={1} 
        sx={{ 
          flex: 1, 
          p: 2, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'auto'
        }}
      >
        <Typography variant="h6" gutterBottom>
          🏷️ Category Selection
        </Typography>
        <CategorySelector
          selectedCategories={product.categories}
          onCategoryChange={(categories) => console.log('Categories:', categories)}
        />

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          📝 Descriptions
        </Typography>
        <ProductDescriptions
          descriptions={product.descriptions}
          onChange={(descriptions) => console.log('Descriptions:', descriptions)}
        />

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          🔧 Variants
        </Typography>
        <VariantsManager
          variants={product.variants}
          onVariantsChange={(variants) => console.log('Variants:', variants)}
        />
      </Paper>

      {/* RIGHT COLUMN - Info & Shop Data */}
      <Paper 
        elevation={1} 
        sx={{ 
          width: 350, 
          flexShrink: 0, 
          p: 2, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'auto'
        }}
      >
        <Typography variant="h6" gutterBottom>
          ℹ️ Basic Information
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Product Name
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {product.name}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            SKU
          </Typography>
          <Typography variant="body1" fontFamily="monospace">
            {product.sku}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Status
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            {getStatusChip(product.status)}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          🏪 Shop Data
        </Typography>
        <ShopDataPanel
          shopData={product.shopData}
          onShopClick={(shopId) => console.log('Shop clicked:', shopId)}
        />

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          📅 Timeline
        </Typography>
        <ProductTimeline
          timeline={product.timeline}
          metadata={product.metadata}
        />

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          🔄 Sync Status
        </Typography>
        <SyncStatusDashboard
          syncStatus={product.syncStatus}
          onSyncNow={() => console.log('Manual sync triggered')}
        />
      </Paper>
    </Box>
  );

  // Mobile/Tablet stacked layout
  const MobileLayout = () => (
    <Box>
      <MobileTabsComponent />
      
      <TabPanel value={mobileTab} index={0}>
        <ProductImages 
          images={product.images}
          onImageSelect={(image) => console.log('Selected image:', image)}
          onImageUpload={(files) => console.log('Upload files:', files)}
        />
      </TabPanel>
      
      <TabPanel value={mobileTab} index={1}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🏷️ Category Selection
          </Typography>
          <CategorySelector
            selectedCategories={product.categories}
            onCategoryChange={(categories) => console.log('Categories:', categories)}
          />
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            📝 Descriptions
          </Typography>
          <ProductDescriptions
            descriptions={product.descriptions}
            onChange={(descriptions) => console.log('Descriptions:', descriptions)}
          />
        </Box>
        
        <Box>
          <Typography variant="h6" gutterBottom>
            🔧 Variants
          </Typography>
          <VariantsManager
            variants={product.variants}
            onVariantsChange={(variants) => console.log('Variants:', variants)}
          />
        </Box>
      </TabPanel>
      
      <TabPanel value={mobileTab} index={2}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            ℹ️ Basic Information
          </Typography>
          <Typography variant="body1">{product.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            SKU: {product.sku}
          </Typography>
          {getStatusChip(product.status)}
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🏪 Shop Data
          </Typography>
          <ShopDataPanel
            shopData={product.shopData}
            onShopClick={(shopId) => console.log('Shop clicked:', shopId)}
          />
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            📅 Timeline
          </Typography>
          <ProductTimeline
            timeline={product.timeline}
            metadata={product.metadata}
          />
        </Box>
        
        <Box>
          <Typography variant="h6" gutterBottom>
            🔄 Sync Status
          </Typography>
          <SyncStatusDashboard
            syncStatus={product.syncStatus}
            onSyncNow={() => console.log('Manual sync triggered')}
          />
        </Box>
      </TabPanel>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: { 
          borderRadius: isMobile ? 0 : 2,
          height: isMobile ? '100vh' : '80vh',
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={onClose} size="small">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" component="div">
              Product Details: {product.name} ({product.sku})
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              size="small"
            >
              Save
            </Button>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ p: 2, overflow: 'hidden' }}>
        {isMobile || isTablet ? <MobileLayout /> : <DesktopLayout />}
      </DialogContent>

      {/* Footer - only on mobile */}
      {isMobile && (
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ProductDetailLayout;