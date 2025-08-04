import React, { useState, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Checkbox,
  FormControlLabel,
  TextField,
  InputAdornment,
  Collapse,
  Alert,
  CircularProgress,
  Avatar,
} from '@mui/material';
import {
  CheckCircle as FoundIcon,
  Cancel as NotFoundIcon,
  Warning as PartialIcon,
  Search as SearchingIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { SKUSearchResult } from './MultiSKUSearch';
import { EnhancedProduct } from '../../types/api.types';
import ProductThumbnail from './ProductThumbnail';
import ShopBadges from './ShopBadges';

interface SearchResultsProps {
  results: SKUSearchResult[];
  onViewProduct?: (product: EnhancedProduct) => void;
  onEditProduct?: (product: EnhancedProduct) => void;
  isSearching?: boolean;
  maxHeight?: number;
}

type ResultFilter = 'all' | 'found' | 'not_found' | 'partial_match' | 'searching';

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  onViewProduct,
  onEditProduct,
  isSearching = false,
  maxHeight = 600,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<ResultFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [virtualizedRows, setVirtualizedRows] = useState(25); // For virtual scrolling

  // Filter and search results
  const filteredResults = useMemo(() => {
    let filtered = results;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(result => result.status === filter);
    }

    // Apply search filter
    if (searchFilter.trim()) {
      const searchTerm = searchFilter.toLowerCase();
      filtered = filtered.filter(result => 
        result.sku.toLowerCase().includes(searchTerm) ||
        result.product?.name.toLowerCase().includes(searchTerm) ||
        result.searchQuery.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }, [results, filter, searchFilter]);

  // Paginated results with performance optimization for large datasets
  const paginatedResults = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    
    // For very large datasets (>1000), use virtual scrolling approach
    if (filteredResults.length > 1000) {
      const visibleResults = filteredResults.slice(startIndex, Math.min(endIndex, startIndex + virtualizedRows));
      return visibleResults;
    }
    
    return filteredResults.slice(startIndex, endIndex);
  }, [filteredResults, page, rowsPerPage, virtualizedRows]);

  // Status configuration
  const getStatusConfig = (status: SKUSearchResult['status']) => {
    switch (status) {
      case 'found':
        return {
          icon: <FoundIcon sx={{ color: 'success.main' }} />,
          color: 'success' as const,
          label: 'Found',
          bgColor: 'success.light',
        };
      case 'not_found':
        return {
          icon: <NotFoundIcon sx={{ color: 'error.main' }} />,
          color: 'error' as const,
          label: 'Not Found',
          bgColor: 'error.light',
        };
      case 'partial_match':
        return {
          icon: <PartialIcon sx={{ color: 'warning.main' }} />,
          color: 'warning' as const,
          label: 'Partial Match',
          bgColor: 'warning.light',
        };
      case 'searching':
        return {
          icon: <CircularProgress size={16} />,
          color: 'info' as const,
          label: 'Searching...',
          bgColor: 'info.light',
        };
      default:
        return {
          icon: <SearchingIcon />,
          color: 'default' as const,
          label: 'Unknown',
          bgColor: 'grey.200',
        };
    }
  };

  // Handle selection
  const handleSelectResult = (sku: string, checked: boolean) => {
    const newSelected = new Set(selectedResults);
    if (checked) {
      newSelected.add(sku);
    } else {
      newSelected.delete(sku);
    }
    setSelectedResults(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allSKUs = new Set(filteredResults.map(r => r.sku));
      setSelectedResults(allSKUs);
    } else {
      setSelectedResults(new Set());
    }
  };

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Count results by status
  const statusCounts = useMemo(() => {
    const counts = {
      all: results.length,
      found: 0,
      not_found: 0,
      partial_match: 0,
      searching: 0,
    };

    results.forEach(result => {
      counts[result.status] = (counts[result.status] || 0) + 1;
    });

    return counts;
  }, [results]);

  const isAllSelected = selectedResults.size === filteredResults.length && filteredResults.length > 0;
  const isIndeterminate = selectedResults.size > 0 && selectedResults.size < filteredResults.length;

  return (
    <Box>
      {/* Results Header with Filters */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Search Results
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {filteredResults.length} of {results.length} results
            </Typography>
            
            <IconButton
              size="small"
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters ? 'primary' : 'default'}
            >
              <FilterIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Status Filter Chips */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Chip
            label={`All (${statusCounts.all})`}
            onClick={() => setFilter('all')}
            color={filter === 'all' ? 'primary' : 'default'}
            variant={filter === 'all' ? 'filled' : 'outlined'}
            size="small"
          />
          <Chip
            label={`Found (${statusCounts.found})`}
            onClick={() => setFilter('found')}
            color={filter === 'found' ? 'success' : 'default'}
            variant={filter === 'found' ? 'filled' : 'outlined'}
            size="small"
            disabled={statusCounts.found === 0}
          />
          <Chip
            label={`Not Found (${statusCounts.not_found})`}
            onClick={() => setFilter('not_found')}
            color={filter === 'not_found' ? 'error' : 'default'}
            variant={filter === 'not_found' ? 'filled' : 'outlined'}
            size="small"
            disabled={statusCounts.not_found === 0}
          />
          <Chip
            label={`Partial (${statusCounts.partial_match})`}
            onClick={() => setFilter('partial_match')}
            color={filter === 'partial_match' ? 'warning' : 'default'}
            variant={filter === 'partial_match' ? 'filled' : 'outlined'}
            size="small"
            disabled={statusCounts.partial_match === 0}
          />
          {statusCounts.searching > 0 && (
            <Chip
              label={`Searching (${statusCounts.searching})`}
              onClick={() => setFilter('searching')}
              color={filter === 'searching' ? 'info' : 'default'}
              variant={filter === 'searching' ? 'filled' : 'outlined'}
              size="small"
            />
          )}
        </Box>

        {/* Advanced Filters */}
        <Collapse in={showFilters}>
          <Box sx={{ mt: 2 }}>
            <TextField
              size="small"
              placeholder="Filter by SKU or product name..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />
          </Box>
        </Collapse>

        {/* Bulk Selection */}
        {filteredResults.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              }
              label={`Select all ${filteredResults.length} results`}
            />
            {selectedResults.size > 0 && (
              <Typography variant="body2" color="primary" sx={{ ml: 4 }}>
                {selectedResults.size} results selected
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* No Results Message */}
      {filteredResults.length === 0 && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {results.length === 0 ? 'No search results yet' : 'No results match the current filter'}
          </Typography>
        </Box>
      )}

      {/* Results Table */}
      {filteredResults.length > 0 && (
        <>
          <TableContainer sx={{ maxHeight }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isIndeterminate}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Shops</TableCell>
                  <TableCell>Match Score</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedResults.map((result, index) => {
                  const statusConfig = getStatusConfig(result.status);
                  const isSelected = selectedResults.has(result.sku);

                  return (
                    <TableRow
                      key={`${result.sku}-${index}`}
                      hover
                      selected={isSelected}
                      sx={{
                        backgroundColor: result.status === 'searching' ? 'action.hover' : undefined,
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={(e) => handleSelectResult(result.sku, e.target.checked)}
                        />
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {statusConfig.icon}
                          <Typography variant="body2" fontWeight="medium">
                            {statusConfig.label}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* SKU */}
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontFamily="monospace"
                          fontWeight="medium"
                        >
                          {result.sku}
                        </Typography>
                        {result.searchQuery !== result.sku && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block' }}
                          >
                            Query: {result.searchQuery}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Product Info */}
                      <TableCell>
                        {result.product ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ProductThumbnail
                              src={result.product.thumbnail}
                              productName={result.product.name}
                              size={32}
                            />
                            <Box>
                              <Typography variant="body2" fontWeight="medium" noWrap>
                                {result.product.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {result.product.sku}
                              </Typography>
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {result.status === 'searching' ? 'Searching...' : 'Not found'}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Shop Assignments */}
                      <TableCell>
                        {result.product?.shops ? (
                          <ShopBadges
                            shops={result.product.shops}
                            maxVisible={2}
                            size="small"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>

                      {/* Match Score */}
                      <TableCell>
                        {result.matchScore !== undefined ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {Math.round(result.matchScore * 100)}%
                            </Typography>
                            {result.matchScore < 1 && (
                              <Tooltip title="Partial match - SKU or name similarity">
                                <PartialIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                              </Tooltip>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {result.status === 'found' ? '100%' : '-'}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        {result.product && (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="View Product Details">
                              <IconButton
                                size="small"
                                onClick={() => onViewProduct?.(result.product!)}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Product">
                              <IconButton
                                size="small"
                                onClick={() => onEditProduct?.(result.product!)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={filteredResults.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Results per page:"
          />
        </>
      )}

      {/* Search Progress Info */}
      {isSearching && (
        <Alert severity="info" sx={{ m: 2 }}>
          <Typography variant="body2">
            Search in progress. Results will appear as products are found.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default SearchResults;