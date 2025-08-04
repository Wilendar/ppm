import React, { useState } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Typography,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { ProductVariant, ShopAssignment } from '../../types/api.types';
import ProductThumbnail from './ProductThumbnail';
import ShopBadges from './ShopBadges';

interface VariantDropdownProps {
  variants: ProductVariant[];
  productName: string;
  onToggleExpand?: () => void;
  isExpanded?: boolean;
}

interface VariantRowProps {
  variant: ProductVariant;
  shops?: ShopAssignment[];
  isMain?: boolean;
}

const VariantRow: React.FC<VariantRowProps> = ({ variant, shops = [], isMain = false }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return 'error';
    if (stock < 10) return 'warning';
    return 'success';
  };

  // Filter shops that have this variant
  const variantShops = shops.filter(shop => 
    // Assume variant is available in all active shops for demo
    shop.isActive
  );

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        minHeight: 60,
        px: isMain ? 0 : 5, // Indent variant rows
        borderLeft: isMain ? 'none' : '2px solid',
        borderLeftColor: 'divider',
        ml: isMain ? 0 : 2,
        backgroundColor: isMain ? 'transparent' : 'action.hover',
        borderRadius: isMain ? 0 : 1,
      }}
    >
      {/* Icon for variant row */}
      {!isMain && (
        <Box sx={{ mr: 1, color: 'text.secondary' }}>
          └─
        </Box>
      )}
      
      {/* Thumbnail */}
      <Box sx={{ width: 64, mr: 2 }}>
        <ProductThumbnail
          src={variant.thumbnail || 'https://via.placeholder.com/48x48/607D8B/FFFFFF?text=V'}
          productName={variant.name}
          size={40}
          showZoom={false}
        />
      </Box>

      {/* Product Info */}
      <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
        <Typography variant="subtitle2" fontWeight="medium" noWrap>
          {variant.name}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          fontFamily="monospace" 
          fontSize="0.8em"
        >
          {variant.sku}
        </Typography>
        {variant.attributes.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
            {variant.attributes.slice(0, 2).map((attr, index) => (
              <Chip
                key={index}
                label={`${attr.name}: ${attr.value}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.65em', height: 18 }}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Variants Column (placeholder for variants) */}
      <Box sx={{ width: 140, mr: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Variant
        </Typography>
      </Box>

      {/* Categories Column (empty for variants) */}
      <Box sx={{ width: 200, mr: 2 }}>
        {/* Empty for variant rows */}
      </Box>

      {/* Shops Column */}
      <Box sx={{ width: 200, mr: 2 }}>
        <ShopBadges
          shops={variantShops}
          maxVisible={8}
          size="small"
        />
      </Box>

      {/* Price Range */}
      <Box sx={{ width: 120, textAlign: 'right', mr: 2 }}>
        <Typography variant="body2" fontWeight="medium">
          {formatPrice(variant.price)}
        </Typography>
        <Chip
          label={`Stock: ${variant.stock}`}
          size="small"
          color={getStockColor(variant.stock)}
          variant="filled"
          sx={{ mt: 0.5, fontSize: '0.65em', height: 20 }}
        />
      </Box>

      {/* Sync Status (empty for variants) */}
      <Box sx={{ width: 110, mr: 2 }}>
        {/* Empty for variant rows */}
      </Box>

      {/* Status (empty for variants) */}
      <Box sx={{ width: 100, mr: 2 }}>
        {/* Empty for variant rows */}
      </Box>

      {/* Actions (empty for variants) */}
      <Box sx={{ width: 120 }}>
        {/* Empty for variant rows */}
      </Box>
    </Box>
  );
};

const VariantDropdown: React.FC<VariantDropdownProps> = ({
  variants,
  productName,
  onToggleExpand,
  isExpanded = false,
}) => {
  const [localExpanded, setLocalExpanded] = useState(false);
  const expanded = onToggleExpand ? isExpanded : localExpanded;

  if (!variants || variants.length === 0) {
    return (
      <Tooltip title="No variants available">
        <Chip
          label="No variants"
          size="small"
          color="default"
          variant="outlined"
          icon={<InventoryIcon />}
        />
      </Tooltip>
    );
  }

  const handleToggle = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setLocalExpanded(!localExpanded);
    }
  };

  const getTotalStock = () => {
    return variants.reduce((total, variant) => total + variant.stock, 0);
  };

  const getPriceRange = () => {
    if (variants.length === 0) return '';
    
    const prices = variants.map(v => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    const formatPrice = (price: number) => 
      new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: 0,
      }).format(price);
    
    if (minPrice === maxPrice) {
      return formatPrice(minPrice);
    }
    
    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* Expand/Collapse Button */}
      <IconButton
        size="small"
        onClick={handleToggle}
        sx={{
          width: 24,
          height: 24,
          color: 'primary.main',
          '&:focus': {
            outline: 'none',
            boxShadow: 'none',
          },
          '&:focus-visible': {
            outline: 'none',
          }
        }}
      >
        {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </IconButton>
      
      {/* Variant Summary */}
      <Tooltip 
        title={
          <Box>
            <Typography variant="subtitle2">{productName} Variants</Typography>
            <Typography variant="body2">Total variants: {variants.length}</Typography>
            <Typography variant="body2">Total stock: {getTotalStock()}</Typography>
            <Typography variant="body2">Price range: {getPriceRange()}</Typography>
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              Click {expanded ? 'collapse' : 'expand'} to {expanded ? 'hide' : 'show'} variant details
            </Typography>
          </Box>
        }
        arrow
      >
        <Chip
          label={`${variants.length} variants`}
          size="small"
          color={expanded ? "primary" : "default"}
          variant={expanded ? "filled" : "outlined"}
          icon={<InventoryIcon />}
          onClick={handleToggle}
          sx={{
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: expanded ? 'primary.dark' : 'action.hover',
            },
          }}
        />
      </Tooltip>
    </Box>
  );
};

export default VariantDropdown;
export { VariantRow };