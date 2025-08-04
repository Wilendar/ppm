import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Collapse,
  Alert,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { DetailedVariant, ProductStatus } from '../../types/api.types';

interface VariantsManagerProps {
  variants: DetailedVariant[];
  onVariantsChange: (variants: DetailedVariant[]) => void;
  readOnly?: boolean;
}

const VariantsManager: React.FC<VariantsManagerProps> = ({
  variants = [],
  onVariantsChange,
  readOnly = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<DetailedVariant | null>(null);
  const [bulkEditMode, setBulkEditMode] = useState(false);

  const handleAddVariant = (variant: DetailedVariant) => {
    const newVariants = [...variants, variant];
    onVariantsChange(newVariants);
    setVariantDialogOpen(false);
    setEditingVariant(null);
  };

  const handleEditVariant = (index: number, variant: DetailedVariant) => {
    const newVariants = [...variants];
    newVariants[index] = variant;
    onVariantsChange(newVariants);
    setVariantDialogOpen(false);
    setEditingVariant(null);
  };

  const handleDeleteVariant = (index: number) => {
    const newVariants = variants.filter((_, i) => i !== index);
    onVariantsChange(newVariants);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Variant Dialog Component
  const VariantDialog = () => {
    const [name, setName] = useState(editingVariant?.name || '');
    const [sku, setSku] = useState(editingVariant?.sku || '');
    const [price, setPrice] = useState(editingVariant?.price.toString() || '');
    const [stock, setStock] = useState(editingVariant?.stock.toString() || '');
    const [status, setStatus] = useState<ProductStatus>(editingVariant?.status || ProductStatus.ACTIVE);
    const [attributes, setAttributes] = useState(editingVariant?.attributes || []);

    const handleSubmit = () => {
      const variant: DetailedVariant = {
        id: editingVariant?.id || Date.now().toString(),
        name,
        sku,
        price: parseFloat(price) || 0,
        stock: parseInt(stock) || 0,
        status,
        attributes,
        images: editingVariant?.images || [],
        shopSpecificData: editingVariant?.shopSpecificData || [],
      };

      if (editingVariant) {
        const index = variants.findIndex(v => v.id === editingVariant.id);
        handleEditVariant(index, variant);
      } else {
        handleAddVariant(variant);
      }
    };

    const handleAddAttribute = () => {
      setAttributes([...attributes, { name: '', value: '' }]);
    };

    const handleAttributeChange = (index: number, field: 'name' | 'value', value: string) => {
      const newAttributes = [...attributes];
      newAttributes[index][field] = value;
      setAttributes(newAttributes);
    };

    const handleRemoveAttribute = (index: number) => {
      setAttributes(attributes.filter((_, i) => i !== index));
    };

    return (
      <Dialog open={variantDialogOpen} onClose={() => setVariantDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingVariant ? 'Edit Variant' : 'Add New Variant'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Variant Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
            />
            
            <TextField
              label="SKU"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              fullWidth
              required
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                fullWidth
              />
              
              <TextField
                label="Stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                inputProps={{ min: 0 }}
                fullWidth
              />
            </Box>
            
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                label="Status"
              >
                <MenuItem value={ProductStatus.ACTIVE}>Active</MenuItem>
                <MenuItem value={ProductStatus.INACTIVE}>Inactive</MenuItem>
                <MenuItem value={ProductStatus.DRAFT}>Draft</MenuItem>
                <MenuItem value={ProductStatus.ARCHIVED}>Archived</MenuItem>
              </Select>
            </FormControl>
            
            {/* Attributes */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">Attributes</Typography>
                <Button size="small" onClick={handleAddAttribute} startIcon={<AddIcon />}>
                  Add Attribute
                </Button>
              </Box>
              
              {attributes.map((attr, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    label="Name"
                    value={attr.name}
                    onChange={(e) => handleAttributeChange(index, 'name', e.target.value)}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Value"
                    value={attr.value}
                    onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                    size="small"
                    fullWidth
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveAttribute(index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVariantDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!name || !sku}
          >
            {editingVariant ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1">
            Product Variants ({variants.length})
          </Typography>
          {variants.length > 0 && (
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </Box>
        
        {!readOnly && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {variants.length > 1 && (
              <Button
                size="small"
                onClick={() => setBulkEditMode(!bulkEditMode)}
                variant={bulkEditMode ? "contained" : "outlined"}
              >
                Bulk Edit
              </Button>
            )}
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingVariant(null);
                setVariantDialogOpen(true);
              }}
              variant="contained"
            >
              Add Variant
            </Button>
          </Box>
        )}
      </Box>

      {variants.length === 0 ? (
        <Alert severity="info">
          No variants defined for this product. Variants allow you to manage different versions (size, color, etc.) of the same product.
        </Alert>
      ) : (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <TableContainer component={Paper} elevation={1}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Attributes</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Stock</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Shops</TableCell>
                  {!readOnly && <TableCell align="center">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {variants.map((variant, index) => (
                  <TableRow key={variant.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {variant.name}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {variant.sku}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {variant.attributes.map((attr, attrIndex) => (
                          <Chip
                            key={attrIndex}
                            label={`${attr.name}: ${attr.value}`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </TableCell>
                    
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(variant.price)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Typography variant="body2">
                          {variant.stock}
                        </Typography>
                        {variant.stock < 10 && (
                          <Tooltip title="Low stock">
                            <WarningIcon fontSize="small" color="warning" />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={variant.status}
                        color={getStatusColor(variant.status)}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {variant.shopSpecificData.map((shop, shopIndex) => (
                          <Tooltip key={shopIndex} title={`Shop ${shop.shopId}`}>
                            <Badge
                              badgeContent={shop.isActive ? null : '!'}
                              color="error"
                            >
                              <Chip
                                label={shop.shopId.slice(0, 3).toUpperCase()}
                                size="small"
                                color={shop.isActive ? "success" : "default"}
                                variant="outlined"
                              />
                            </Badge>
                          </Tooltip>
                        ))}
                      </Box>
                    </TableCell>
                    
                    {!readOnly && (
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingVariant(variant);
                              setVariantDialogOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteVariant(index)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Collapse>
      )}

      {/* Bulk Edit Mode */}
      {bulkEditMode && variants.length > 0 && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: 'primary.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Bulk Edit Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button size="small" startIcon={<MoneyIcon />}>
              Update Prices
            </Button>
            <Button size="small" startIcon={<InventoryIcon />}>
              Update Stock
            </Button>
            <Button size="small" startIcon={<StoreIcon />}>
              Assign to Shops
            </Button>
          </Box>
        </Box>
      )}

      {/* Summary */}
      {variants.length > 0 && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Variant Summary
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2">
              Total Stock: {variants.reduce((sum, v) => sum + v.stock, 0)}
            </Typography>
            <Typography variant="body2">
              Price Range: {formatCurrency(Math.min(...variants.map(v => v.price)))} - {formatCurrency(Math.max(...variants.map(v => v.price)))}
            </Typography>
            <Typography variant="body2">
              Active: {variants.filter(v => v.status === ProductStatus.ACTIVE).length}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Variant Dialog */}
      <VariantDialog />
    </Box>
  );
};

export default VariantsManager;