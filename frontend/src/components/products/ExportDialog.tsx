import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Box,
  Divider,
  Alert,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  FileDownload as ExportIcon,
  Description as CsvIcon,
  TableChart as ExcelIcon,
  Code as JsonIcon,
} from '@mui/icons-material';
import { SKUSearchResult } from './MultiSKUSearch';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  searchResults: SKUSearchResult[];
  summary?: {
    total: number;
    found: number;
    notFound: number;
    partialMatches: number;
    successRate: number;
  } | null;
}

type ExportFormat = 'csv' | 'excel' | 'json';
type ExportFilter = 'all' | 'found' | 'not_found' | 'partial_match';

interface ExportField {
  key: string;
  label: string;
  description: string;
  category: 'basic' | 'product' | 'search' | 'shop';
  enabled: boolean;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onClose,
  searchResults,
  summary,
}) => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [exportFilter, setExportFilter] = useState<ExportFilter>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Available export fields
  const [exportFields, setExportFields] = useState<ExportField[]>([
    // Basic fields
    { key: 'sku', label: 'SKU', description: 'Product SKU', category: 'basic', enabled: true },
    { key: 'status', label: 'Search Status', description: 'Found/Not Found/Partial', category: 'basic', enabled: true },
    { key: 'searchQuery', label: 'Search Query', description: 'Original search term', category: 'search', enabled: false },
    { key: 'timestamp', label: 'Search Time', description: 'When search was performed', category: 'search', enabled: false },
    { key: 'matchScore', label: 'Match Score', description: 'Relevance score (0-100%)', category: 'search', enabled: false },
    
    // Product fields
    { key: 'productName', label: 'Product Name', description: 'Product display name', category: 'product', enabled: true },
    { key: 'productSku', label: 'Product SKU', description: 'Actual product SKU (if different)', category: 'product', enabled: false },
    { key: 'description', label: 'Description', description: 'Product description', category: 'product', enabled: false },
    { key: 'price', label: 'Price', description: 'Product price', category: 'product', enabled: true },
    { key: 'stock', label: 'Stock Status', description: 'In stock/Out of stock', category: 'product', enabled: true },
    { key: 'categories', label: 'Categories', description: 'Product categories', category: 'product', enabled: false },
    { key: 'variants', label: 'Variants', description: 'Product variants count', category: 'product', enabled: false },
    
    // Shop fields
    { key: 'shops', label: 'Assigned Shops', description: 'Shops where product is assigned', category: 'shop', enabled: true },
    { key: 'syncStatus', label: 'Sync Status', description: 'Synchronization status', category: 'shop', enabled: false },
  ]);

  // Filter results based on selected filter
  const filteredResults = useMemo(() => {
    if (exportFilter === 'all') return searchResults;
    return searchResults.filter(result => result.status === exportFilter);
  }, [searchResults, exportFilter]);

  // Handle field selection
  const handleFieldToggle = (fieldKey: string) => {
    setExportFields(prev => prev.map(field => 
      field.key === fieldKey 
        ? { ...field, enabled: !field.enabled }
        : field
    ));
  };

  // Select all fields in category
  const handleCategoryToggle = (category: string, enabled: boolean) => {
    setExportFields(prev => prev.map(field => 
      field.category === category 
        ? { ...field, enabled }
        : field
    ));
  };

  // Generate export data
  const generateExportData = () => {
    const enabledFields = exportFields.filter(field => field.enabled);
    
    return filteredResults.map(result => {
      const row: Record<string, any> = {};
      
      enabledFields.forEach(field => {
        switch (field.key) {
          case 'sku':
            row[field.label] = result.sku;
            break;
          case 'status':
            row[field.label] = result.status === 'found' ? 'Found' : 
                              result.status === 'not_found' ? 'Not Found' :
                              result.status === 'partial_match' ? 'Partial Match' : 'Searching';
            break;
          case 'searchQuery':
            row[field.label] = result.searchQuery;
            break;
          case 'timestamp':
            row[field.label] = result.timestamp.toISOString();
            break;
          case 'matchScore':
            row[field.label] = result.matchScore ? `${Math.round(result.matchScore * 100)}%` : '';
            break;
          case 'productName':
            row[field.label] = result.product?.name || '';
            break;
          case 'productSku':
            row[field.label] = result.product?.sku || '';
            break;
          case 'description':
            row[field.label] = result.product?.description || '';
            break;
          case 'price':
            row[field.label] = result.product?.variants?.[0]?.price || '';
            break;
          case 'stock':
            row[field.label] = result.product?.variants?.[0]?.stock_quantity || '';
            break;
          case 'categories':
            row[field.label] = result.product?.categories?.map(cat => cat.name).join(', ') || '';
            break;
          case 'variants':
            row[field.label] = result.product?.variants?.length || '';
            break;
          case 'shops':
            row[field.label] = result.product?.shops?.map(shop => shop.name).join(', ') || '';
            break;
          case 'syncStatus':
            row[field.label] = result.product?.syncStatus?.status || '';
            break;
        }
      });
      
      return row;
    });
  };

  // Export to CSV
  const exportToCSV = (data: Record<string, any>[]) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma
        const escapedValue = String(value).replace(/"/g, '""');
        return escapedValue.includes(',') ? `"${escapedValue}"` : escapedValue;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sku-search-results-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export to JSON
  const exportToJSON = (data: Record<string, any>[]) => {
    const jsonData = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        format: 'json',
        filter: exportFilter,
        totalResults: filteredResults.length,
        summary: summary || null,
      },
      results: data,
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sku-search-results-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      // Simulate progress for demo
      for (let i = 0; i <= 100; i += 25) {
        setExportProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const data = generateExportData();
      
      switch (exportFormat) {
        case 'csv':
          exportToCSV(data);
          break;
        case 'json':
          exportToJSON(data);
          break;
        case 'excel':
          // For now, export as CSV - could integrate with SheetJS for real Excel export
          exportToCSV(data);
          break;
      }
      
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Group fields by category
  const fieldsByCategory = exportFields.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, ExportField[]>);

  const categoryLabels = {
    basic: 'Basic Information',
    product: 'Product Details',
    search: 'Search Metadata',
    shop: 'Shop & Sync Data',
  };

  const formatIcons = {
    csv: <CsvIcon />,
    excel: <ExcelIcon />,
    json: <JsonIcon />,
  };

  const enabledFieldsCount = exportFields.filter(f => f.enabled).length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ExportIcon />
          Export Search Results
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Export Summary */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Export Summary
          </Typography>
          <Typography variant="body2">
            Ready to export <strong>{filteredResults.length}</strong> results 
            {summary && ` (${summary.found} found, ${summary.notFound} not found)`}
          </Typography>
        </Alert>

        {/* Export Format */}
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <FormLabel component="legend">Export Format</FormLabel>
          <RadioGroup
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
            row
          >
            <FormControlLabel
              value="csv"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {formatIcons.csv}
                  CSV
                </Box>
              }
            />
            <FormControlLabel
              value="excel"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {formatIcons.excel}
                  Excel
                </Box>
              }
            />
            <FormControlLabel
              value="json"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {formatIcons.json}
                  JSON
                </Box>
              }
            />
          </RadioGroup>
        </FormControl>

        {/* Export Filter */}
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <FormLabel component="legend">Results to Export</FormLabel>
          <RadioGroup
            value={exportFilter}
            onChange={(e) => setExportFilter(e.target.value as ExportFilter)}
          >
            <FormControlLabel
              value="all"
              control={<Radio />}
              label={`All Results (${searchResults.length})`}
            />
            <FormControlLabel
              value="found"
              control={<Radio />}
              label={`Found Only (${searchResults.filter(r => r.status === 'found').length})`}
            />
            <FormControlLabel
              value="not_found"
              control={<Radio />}
              label={`Not Found Only (${searchResults.filter(r => r.status === 'not_found').length})`}
            />
            <FormControlLabel
              value="partial_match"
              control={<Radio />}
              label={`Partial Matches Only (${searchResults.filter(r => r.status === 'partial_match').length})`}
            />
          </RadioGroup>
        </FormControl>

        <Divider sx={{ my: 2 }} />

        {/* Field Selection */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Export Fields ({enabledFieldsCount} selected)
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Choose which fields to include in your export
          </Typography>
        </Box>

        {Object.entries(fieldsByCategory).map(([category, fields]) => (
          <Box key={category} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                {categoryLabels[category as keyof typeof categoryLabels]}
              </Typography>
              <Box>
                <Button
                  size="small"
                  onClick={() => handleCategoryToggle(category, true)}
                  sx={{ mr: 1 }}
                >
                  Select All
                </Button>
                <Button
                  size="small"
                  onClick={() => handleCategoryToggle(category, false)}
                >
                  None
                </Button>
              </Box>
            </Box>
            
            <FormGroup>
              {fields.map(field => (
                <FormControlLabel
                  key={field.key}
                  control={
                    <Checkbox
                      checked={field.enabled}
                      onChange={() => handleFieldToggle(field.key)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {field.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {field.description}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          </Box>
        ))}

        {/* Export Progress */}
        {isExporting && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={exportProgress} sx={{ mb: 1 }} />
            <Typography variant="body2" color="text.secondary" align="center">
              Preparing export... {exportProgress}%
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isExporting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={enabledFieldsCount === 0 || filteredResults.length === 0 || isExporting}
          startIcon={<ExportIcon />}
        >
          {isExporting ? 'Exporting...' : `Export ${filteredResults.length} Results`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;