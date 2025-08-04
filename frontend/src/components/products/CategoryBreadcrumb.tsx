import React from 'react';
import {
  Box,
  Breadcrumbs,
  Chip,
  Link,
  Typography,
  Tooltip,
} from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  Category as CategoryIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { CategoryPath, CategoryNode } from '../../types/api.types';

interface CategoryBreadcrumbProps {
  categories: CategoryPath[];
  maxWidth?: number;
  onCategoryClick?: (categoryId: string, categoryName: string) => void;
  showAsChip?: boolean;
  size?: 'small' | 'medium';
  allowWrap?: boolean;
}

const CategoryBreadcrumb: React.FC<CategoryBreadcrumbProps> = ({
  categories,
  maxWidth = 200,
  onCategoryClick,
  showAsChip = false,
  size = 'small',
  allowWrap = false,
}) => {
  if (!categories || categories.length === 0) {
    return (
      <Tooltip title="No category assigned">
        <Chip
          label="No category"
          size={size}
          color="default"
          variant="outlined"
          icon={<CategoryIcon />}
        />
      </Tooltip>
    );
  }

  // For now, show the first category path (products can have multiple category assignments)
  const primaryCategory = categories[0];
  const hasMultipleCategories = categories.length > 1;

  const handleCategoryClick = (category: CategoryNode) => {
    if (onCategoryClick) {
      onCategoryClick(category.id, category.name);
    }
  };

  const truncateBreadcrumbFromStart = (breadcrumb: string, maxWidth: number) => {
    const parts = breadcrumb.split(' > ');
    
    // If 2 or fewer parts, show everything
    if (parts.length <= 2) {
      return breadcrumb;
    }
    
    // ALWAYS show last 2 categories in full
    const lastTwo = parts.slice(-2);
    const lastTwoPath = lastTwo.join(' > ');
    
    // For more than 2 parts, add ellipsis prefix
    return `... > ${lastTwoPath}`;
  };

  // const truncateText = (text: string, maxLength: number) => {
  //   if (text.length <= maxLength) return text;
  //   return text.substring(0, maxLength - 3) + '...';
  // };

  if (showAsChip) {
    return (
      <Box sx={{
        maxWidth: maxWidth,
        wordWrap: allowWrap ? 'break-word' : 'normal',
        whiteSpace: allowWrap ? 'normal' : 'nowrap',
        lineHeight: 1.3,
        padding: '4px 0'
      }}>
        <Tooltip
          title={
            <Box>
              <Typography variant="subtitle2">Category Path:</Typography>
              <Typography variant="body2">{primaryCategory.breadcrumb}</Typography>
              {hasMultipleCategories && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  +{categories.length - 1} additional categories
                </Typography>
              )}
            </Box>
          }
          arrow
        >
          {allowWrap ? (
            <Typography
              variant="body2"
              sx={{
                fontSize: size === 'small' ? '0.75rem' : '0.875rem',
                wordWrap: 'break-word',
                whiteSpace: 'normal',
                lineHeight: 1.2,
                color: 'text.primary',
                cursor: onCategoryClick ? 'pointer' : 'default',
              }}
              onClick={onCategoryClick ? () => handleCategoryClick(primaryCategory.path[0]) : undefined}
            >
              {primaryCategory.breadcrumb}
            </Typography>
          ) : (
            <Chip
              label={truncateBreadcrumbFromStart(primaryCategory.breadcrumb, maxWidth - 40)}
              size={size}
              color="info"
              variant="outlined"
              icon={<CategoryIcon />}
              onClick={onCategoryClick ? () => handleCategoryClick(primaryCategory.path[0]) : undefined}
              sx={{
                cursor: onCategoryClick ? 'pointer' : 'default',
                maxWidth: maxWidth,
                '& .MuiChip-label': {
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                },
              }}
            />
          )}
        </Tooltip>
        
        {hasMultipleCategories && !allowWrap && (
          <Chip
            label={`+${categories.length - 1}`}
            size={size}
            color="info"
            variant="filled"
            sx={{
              ml: 0.5,
              minWidth: 'auto',
              height: size === 'small' ? 24 : 32,
            }}
          />
        )}
        
        {hasMultipleCategories && allowWrap && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block', mt: 0.5 }}>
            +{categories.length - 1} more categories
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ 
      maxWidth,
      wordWrap: allowWrap ? 'break-word' : 'normal',
      whiteSpace: allowWrap ? 'normal' : 'nowrap'
    }}>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="category breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-ol': {
            flexWrap: allowWrap ? 'wrap' : 'nowrap',
          },
          '& .MuiBreadcrumbs-li': {
            minWidth: 0, // Allow items to shrink
          },
        }}
      >
        {primaryCategory.path.map((category, index) => {
          const isLast = index === primaryCategory.path.length - 1;
          const isClickable = onCategoryClick && !isLast; // Don't make the last item clickable
          
          return (
            <Tooltip
              key={category.id}
              title={`${category.name} - Level ${category.level}`}
              arrow
            >
              {isClickable ? (
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => handleCategoryClick(category)}
                  sx={{
                    textDecoration: 'none',
                    color: 'primary.main',
                    cursor: 'pointer',
                    fontSize: size === 'small' ? '0.8em' : '0.9em',
                    fontWeight: index === 0 ? 'medium' : 'normal',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 80,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {category.name}
                </Link>
              ) : (
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: size === 'small' ? '0.8em' : '0.9em',
                    fontWeight: isLast ? 'medium' : 'normal',
                    color: isLast ? 'text.primary' : 'text.secondary',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 80,
                  }}
                >
                  {category.name}
                </Typography>
              )}
            </Tooltip>
          );
        })}
      </Breadcrumbs>
      
      {hasMultipleCategories && (
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            mt: 0.5,
            fontSize: '0.7em',
            flexWrap: allowWrap ? 'wrap' : 'nowrap'
          }}
        >
          <FilterIcon sx={{ fontSize: '1em' }} />
          +{categories.length - 1} more categories
        </Typography>
      )}
    </Box>
  );
};

export default CategoryBreadcrumb;