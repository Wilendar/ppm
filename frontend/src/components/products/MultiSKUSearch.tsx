import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Collapse,
  IconButton,
  Alert,
  LinearProgress,
  Divider,
  Paper,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FileDownload as ExportIcon,
  Clear as ClearIcon,
  Upload as ImportIcon,
} from '@mui/icons-material';
import SKUInput from './SKUInput';
import SearchResults from './SearchResults';
import SearchSummary from './SearchSummary';
import ExportDialog from './ExportDialog';
import { EnhancedProduct } from '../../types/api.types';
import { useBulkSKUSearch } from '../../hooks/useBulkSKUSearch';

export interface SKUSearchResult {
  sku: string;
  status: 'found' | 'not_found' | 'partial_match' | 'searching';
  product?: EnhancedProduct;
  searchQuery: string;
  timestamp: Date;
  matchScore?: number;
}

export interface BulkSearchResponse {
  results: SKUSearchResult[];
  summary: {
    total: number;
    found: number;
    notFound: number;
    partialMatches: number;
    processingTime: number;
  };
  searchId: string;
}

interface MultiSKUSearchProps {
  onViewProduct?: (product: EnhancedProduct) => void;
  onEditProduct?: (product: EnhancedProduct) => void;
}

const MultiSKUSearch: React.FC<MultiSKUSearchProps> = ({
  onViewProduct,
  onEditProduct,
}) => {
  // State management
  const [isExpanded, setIsExpanded] = useState(false);
  const [skuInput, setSKUInput] = useState('');
  const [parsedSKUs, setParsedSKUs] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SKUSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);

  // Custom hook for bulk search API
  const { bulkSearch, isLoading } = useBulkSKUSearch();

  // Handle SKU input change with parsing
  const handleSKUInputChange = useCallback((input: string, parsed: string[]) => {
    setSKUInput(input);
    setParsedSKUs(parsed);
  }, []);

  // Execute bulk search
  const handleBulkSearch = useCallback(async () => {
    if (parsedSKUs.length === 0) return;

    setIsSearching(true);
    setSearchProgress(0);
    
    try {
      // Initialize results with searching status
      const initialResults: SKUSearchResult[] = parsedSKUs.map(sku => ({
        sku,
        status: 'searching' as const,
        searchQuery: sku,
        timestamp: new Date(),
      }));
      setSearchResults(initialResults);

      // Execute bulk search with progress tracking
      const response = await bulkSearch(parsedSKUs, (progress) => {
        setSearchProgress(progress);
      });

      setSearchResults(response.results);
      
    } catch (error) {
      console.error('Bulk search failed:', error);
      // Set all to not found on error
      const errorResults: SKUSearchResult[] = parsedSKUs.map(sku => ({
        sku,
        status: 'not_found' as const,
        searchQuery: sku,
        timestamp: new Date(),
      }));
      setSearchResults(errorResults);
    } finally {
      setIsSearching(false);
      setSearchProgress(0);
    }
  }, [parsedSKUs, bulkSearch]);

  // Clear search results and input
  const handleClear = useCallback(() => {
    setSKUInput('');
    setParsedSKUs([]);
    setSearchResults([]);
    setSearchProgress(0);
  }, []);

  // Calculate search summary
  const searchSummary = useMemo(() => {
    if (searchResults.length === 0) return null;

    const found = searchResults.filter(r => r.status === 'found').length;
    const notFound = searchResults.filter(r => r.status === 'not_found').length;
    const partialMatches = searchResults.filter(r => r.status === 'partial_match').length;
    const searching = searchResults.filter(r => r.status === 'searching').length;

    return {
      total: searchResults.length,
      found,
      notFound,
      partialMatches,
      searching,
      successRate: searchResults.length > 0 ? Math.round((found / searchResults.length) * 100) : 0,
    };
  }, [searchResults]);

  // Handle export
  const handleExport = useCallback(() => {
    setExportDialogOpen(true);
  }, []);

  // Import CSV template
  const handleImportTemplate = useCallback(() => {
    // Create and download CSV template
    const csvContent = 'SKU,Expected Product Name\nDEMO-001,Sample Product 1\nDEMO-002,Sample Product 2\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-sku-search-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, []);

  return (
    <Box sx={{ mb: 3 }}>
      {/* Multi-SKU Search Header */}
      <Card elevation={2}>
        <CardContent sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SearchIcon color="primary" />
              <Typography variant="h6" component="h2">
                Multi-SKU Search
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bulk search for multiple products
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {parsedSKUs.length > 0 && (
                <Typography variant="body2" color="primary" fontWeight="medium">
                  {parsedSKUs.length} SKUs ready
                </Typography>
              )}
              
              <IconButton
                onClick={() => setIsExpanded(!isExpanded)}
                size="small"
                sx={{ 
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              >
                <ExpandMoreIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Quick Summary when collapsed */}
          {!isExpanded && searchSummary && (
            <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Last search: {searchSummary.total} SKUs, {searchSummary.found} found ({searchSummary.successRate}%)
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={() => setIsExpanded(true)}
              >
                View Results
              </Button>
            </Box>
          )}
        </CardContent>

        {/* Expandable Search Interface */}
        <Collapse in={isExpanded}>
          <Divider />
          <CardContent sx={{ pt: 3 }}>
            {/* SKU Input Interface */}
            <SKUInput
              value={skuInput}
              parsedSKUs={parsedSKUs}
              onChange={handleSKUInputChange}
              disabled={isSearching}
            />

            {/* Action Buttons - Responsive Layout */}
            <Box sx={{ 
              mt: 3, 
              display: 'flex', 
              gap: 2, 
              alignItems: 'center', 
              flexWrap: 'wrap',
              '& .MuiButton-root': {
                minWidth: { xs: '100%', sm: 'auto' }
              }
            }}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleBulkSearch}
                disabled={parsedSKUs.length === 0 || isSearching}
                size="large"
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
              >
                {isSearching ? 'Searching...' : `Search ${parsedSKUs.length} SKUs`}
              </Button>

              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                flexWrap: 'wrap',
                flexGrow: { xs: 1, sm: 0 },
                '& .MuiButton-root': {
                  minWidth: { xs: 'auto', sm: 'auto' }
                }
              }}>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleClear}
                  disabled={isSearching}
                  size="medium"
                >
                  Clear
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<ImportIcon />}
                  onClick={handleImportTemplate}
                  size="medium"
                  sx={{ display: { xs: 'none', sm: 'flex' } }}
                >
                  Template
                </Button>

                {searchResults.length > 0 && (
                  <Button
                    variant="outlined"
                    startIcon={<ExportIcon />}
                    onClick={handleExport}
                    disabled={isSearching}
                    size="medium"
                  >
                    Export
                  </Button>
                )}
              </Box>
            </Box>

            {/* Search Progress */}
            {isSearching && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={searchProgress} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Searching... {Math.round(searchProgress)}% complete
                </Typography>
              </Box>
            )}

            {/* Search Summary */}
            {searchSummary && (
              <SearchSummary
                summary={searchSummary}
                isSearching={isSearching}
                sx={{ mt: 3 }}
              />
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Paper elevation={1} sx={{ mt: 3 }}>
                <SearchResults
                  results={searchResults}
                  onViewProduct={onViewProduct}
                  onEditProduct={onEditProduct}
                  isSearching={isSearching}
                />
              </Paper>
            )}

            {/* No results message */}
            {!isSearching && parsedSKUs.length > 0 && searchResults.length === 0 && (
              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="subtitle2">
                  Ready to search {parsedSKUs.length} SKUs
                </Typography>
                <Typography variant="body2">
                  Click "Search" to find products matching your SKU list.
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Collapse>
      </Card>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        searchResults={searchResults}
        summary={searchSummary}
      />
    </Box>
  );
};

export default MultiSKUSearch;