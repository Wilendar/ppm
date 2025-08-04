import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
  Badge,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Edit as EditIcon,
  AutoFixHigh as AutoFixIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  ValidationResult,
  ValidationIssue,
  ImportOptions,
  BulkAutoFix,
  AutoFixSuggestion
} from '../../../types/csvImport.types';
import { createValidationEngine } from '../../../services/csvImport/validationEngine';

interface ValidationResultsProps {
  validationResult: ValidationResult;
  onOptionsChange: (options: ImportOptions) => void;
  onProceedToImport: () => void;
  onBack: () => void;
  csvData: any;
  mappings: any[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const ValidationResults: React.FC<ValidationResultsProps> = ({
  validationResult,
  onOptionsChange,
  onProceedToImport,
  onBack,
  csvData,
  mappings
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<ValidationIssue | null>(null);
  const [editValue, setEditValue] = useState('');
  const [autoFixSuggestions, setAutoFixSuggestions] = useState<BulkAutoFix | null>(null);
  const [isGeneratingAutoFix, setIsGeneratingAutoFix] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [filterType, setFilterType] = useState<'all' | 'errors' | 'warnings'>('all');
  
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    skipErrorRows: true,
    autoFixWarnings: true,
    createBackup: true,
    updateExisting: false,
    sendNotification: true,
    chunkSize: 100
  });

  // Filter issues based on selected filter
  const filteredIssues = useMemo(() => {
    switch (filterType) {
      case 'errors':
        return validationResult.issues.filter(issue => issue.type === 'error');
      case 'warnings':
        return validationResult.issues.filter(issue => issue.type === 'warning');
      default:
        return validationResult.issues;
    }
  }, [validationResult.issues, filterType]);

  // Group issues by row for better display
  const issuesByRow = useMemo(() => {
    const grouped: Record<number, ValidationIssue[]> = {};
    filteredIssues.forEach(issue => {
      if (!grouped[issue.row]) {
        grouped[issue.row] = [];
      }
      grouped[issue.row].push(issue);
    });
    return grouped;
  }, [filteredIssues]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleRowToggle = (rowIndex: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowIndex)) {
        newSet.delete(rowIndex);
      } else {
        newSet.add(rowIndex);
      }
      return newSet;
    });
  };

  const handleEditIssue = (issue: ValidationIssue) => {
    setSelectedIssue(issue);
    setEditValue(issue.value);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (selectedIssue) {
      // In a real app, this would update the CSV data
      console.log(`Updating row ${selectedIssue.row}, column ${selectedIssue.column} to: ${editValue}`);
      setEditDialogOpen(false);
      setSelectedIssue(null);
      setEditValue('');
    }
  };

  const handleGenerateAutoFix = async () => {
    setIsGeneratingAutoFix(true);
    try {
      const engine = createValidationEngine(csvData, mappings);
      const suggestions = await engine.generateAutoFixSuggestions();
      setAutoFixSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to generate auto-fix suggestions:', error);
    } finally {
      setIsGeneratingAutoFix(false);
    }
  };

  const handleApplyAutoFix = () => {
    if (autoFixSuggestions) {
      // In a real app, this would apply the auto-fixes to the CSV data
      console.log('Applying auto-fixes:', autoFixSuggestions);
      setAutoFixSuggestions(null);
    }
  };

  const handleOptionChange = (key: keyof ImportOptions, value: any) => {
    const newOptions = { ...importOptions, [key]: value };
    setImportOptions(newOptions);
    onOptionsChange(newOptions);
  };

  const exportErrorReport = () => {
    const errorData = validationResult.issues.map(issue => ({
      row: issue.row + 1,
      column: issue.column,
      type: issue.type,
      message: issue.message,
      value: issue.value,
      suggestion: issue.suggestion || ''
    }));

    const csvContent = [
      'Row,Column,Type,Message,Value,Suggestion',
      ...errorData.map(row => 
        Object.values(row).map(value => `"${value}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'validation-errors.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (type: 'error' | 'warning') => {
    return type === 'error' ? 'error' : 'warning';
  };

  const getSeverityIcon = (type: 'error' | 'warning') => {
    return type === 'error' ? <ErrorIcon /> : <WarningIcon />;
  };

  const canProceed = validationResult.summary.errorCount === 0 || importOptions.skipErrorRows;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2">
          STEP 3: Validation & Preview
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterIcon />}
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
          >
            Filter
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={exportErrorReport}
            disabled={validationResult.issues.length === 0}
          >
            Export Report
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()} // In real app, re-run validation
          >
            Re-validate
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Stack direction="row" spacing={2} mb={3}>
        <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
            <CheckIcon color="success" />
            <Typography variant="h4" color="success.main">
              {validationResult.summary.validRows}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Valid Rows
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
            <WarningIcon color="warning" />
            <Typography variant="h4" color="warning.main">
              {validationResult.summary.warningCount}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Warnings
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
            <ErrorIcon color="error" />
            <Typography variant="h4" color="error.main">
              {validationResult.summary.errorCount}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Errors
          </Typography>
        </Paper>
      </Stack>

      {/* Overall Status */}
      <Alert 
        severity={validationResult.summary.errorCount === 0 ? "success" : "warning"}
        sx={{ mb: 2 }}
      >
        {validationResult.summary.errorCount === 0 ? (
          <>All {validationResult.summary.totalRows} rows passed validation! Ready to import.</>
        ) : (
          <>
            {validationResult.summary.errorCount} errors found in {validationResult.summary.errorRows.length} rows. 
            {importOptions.skipErrorRows && (
              <> {validationResult.summary.validRows} valid rows can still be imported.</>
            )}
          </>
        )}
      </Alert>

      {/* Auto-fix Section */}
      {validationResult.issues.some(issue => issue.autoFixable) && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.light' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="subtitle1" fontWeight="medium">
                Auto-fix Available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Some issues can be automatically fixed
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              {autoFixSuggestions && (
                <Button
                  variant="contained"
                  startIcon={<AutoFixIcon />}
                  onClick={handleApplyAutoFix}
                  color="info"
                >
                  Apply {autoFixSuggestions.suggestions.length} Fixes
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<AutoFixIcon />}
                onClick={handleGenerateAutoFix}
                disabled={isGeneratingAutoFix}
              >
                {isGeneratingAutoFix ? 'Generating...' : 'Generate Fixes'}
              </Button>
            </Stack>
          </Stack>
          {isGeneratingAutoFix && (
            <LinearProgress sx={{ mt: 1 }} />
          )}
        </Paper>
      )}

      {/* Tabs for different views */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab 
            label={
              <Badge badgeContent={filteredIssues.length} color="error">
                Issues
              </Badge>
            } 
          />
          <Tab label="Valid Rows Preview" />
          <Tab label="Import Options" />
        </Tabs>

        <TabPanel value={selectedTab} index={0}>
          {/* Issues Table */}
          {filteredIssues.length === 0 ? (
            <Alert severity="success">
              No issues found! All data is valid and ready for import.
            </Alert>
          ) : (
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={50}>Row</TableCell>
                    <TableCell width={80}>Type</TableCell>
                    <TableCell width={120}>Column</TableCell>
                    <TableCell>Issue</TableCell>
                    <TableCell width={150}>Value</TableCell>
                    <TableCell>Suggestion</TableCell>
                    <TableCell width={100}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(issuesByRow).map(([rowIndex, issues]) => (
                    <React.Fragment key={rowIndex}>
                      <TableRow 
                        hover 
                        sx={{ 
                          cursor: 'pointer',
                          bgcolor: issues.some(i => i.type === 'error') ? 'error.light' : 'warning.light'
                        }}
                        onClick={() => handleRowToggle(parseInt(rowIndex))}
                      >
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2" fontWeight="medium">
                              {parseInt(rowIndex) + 1}
                            </Typography>
                            {expandedRows.has(parseInt(rowIndex)) ? <CollapseIcon /> : <ExpandIcon />}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            {issues.some(i => i.type === 'error') && (
                              <Chip size="small" label="Error" color="error" />
                            )}
                            {issues.some(i => i.type === 'warning') && (
                              <Chip size="small" label="Warning" color="warning" />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell colSpan={5}>
                          <Typography variant="body2">
                            {issues.length} issue{issues.length > 1 ? 's' : ''} in this row
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={7} sx={{ p: 0 }}>
                          <Collapse in={expandedRows.has(parseInt(rowIndex))}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                              {issues.map((issue, issueIndex) => (
                                <Paper key={issueIndex} sx={{ p: 2, mb: 1 }} variant="outlined">
                                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Box flex={1}>
                                      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                        {getSeverityIcon(issue.type)}
                                        <Typography variant="subtitle2">
                                          {issue.column}
                                        </Typography>
                                        <Chip 
                                          size="small" 
                                          label={issue.type} 
                                          color={getSeverityColor(issue.type)}
                                        />
                                      </Stack>
                                      <Typography variant="body2" color="text.primary">
                                        {issue.message}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        Value: "{issue.value}"
                                      </Typography>
                                      {issue.suggestion && (
                                        <Typography variant="body2" color="info.main" sx={{ mt: 0.5 }}>
                                          💡 {issue.suggestion}
                                        </Typography>
                                      )}
                                    </Box>
                                    <Stack>
                                      <Tooltip title="Edit value">
                                        <IconButton 
                                          size="small"
                                          onClick={() => handleEditIssue(issue)}
                                        >
                                          <EditIcon />
                                        </IconButton>
                                      </Tooltip>
                                      {issue.autoFixable && (
                                        <Tooltip title="Auto-fixable">
                                          <IconButton size="small" color="info">
                                            <AutoFixIcon />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </Stack>
                                  </Stack>
                                </Paper>
                              ))}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          {/* Valid Rows Preview */}
          <Alert severity="info" sx={{ mb: 2 }}>
            Showing first 10 valid rows that will be imported
          </Alert>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Row</TableCell>
                  {mappings.map(mapping => (
                    <TableCell key={mapping.ppmField}>
                      {mapping.csvColumn}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {validationResult.validRows.slice(0, 10).map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{row.rowIndex + 1}</TableCell>
                    {mappings.map(mapping => (
                      <TableCell key={mapping.ppmField}>
                        {row.data[mapping.ppmField] || ''}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={selectedTab} index={2}>
          {/* Import Options */}
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight="medium">
              Import Behavior
            </Typography>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={importOptions.skipErrorRows}
                  onChange={(e) => handleOptionChange('skipErrorRows', e.target.checked)}
                />
              }
              label="Skip rows with errors"
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={importOptions.autoFixWarnings}
                  onChange={(e) => handleOptionChange('autoFixWarnings', e.target.checked)}
                />
              }
              label="Auto-fix warnings where possible"
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={importOptions.createBackup}
                  onChange={(e) => handleOptionChange('createBackup', e.target.checked)}
                />
              }
              label="Create backup before import"
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={importOptions.updateExisting}
                  onChange={(e) => handleOptionChange('updateExisting', e.target.checked)}
                />
              }
              label="Update existing products (match by SKU)"
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={importOptions.sendNotification}
                  onChange={(e) => handleOptionChange('sendNotification', e.target.checked)}
                />
              }
              label="Send notification when complete"
            />

            <Box>
              <Typography variant="body2" gutterBottom>
                Chunk Size (products per batch)
              </Typography>
              <TextField
                type="number"
                size="small"
                value={importOptions.chunkSize}
                onChange={(e) => handleOptionChange('chunkSize', parseInt(e.target.value) || 100)}
                InputProps={{ inputProps: { min: 10, max: 1000 } }}
                sx={{ width: 120 }}
              />
            </Box>
          </Stack>
        </TabPanel>
      </Paper>

      {/* Action Buttons */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Button variant="outlined" onClick={onBack}>
          Back to Mapping
        </Button>
        
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {canProceed ? (
              <>Ready to import {validationResult.summary.validRows} products</>
            ) : (
              <>Fix {validationResult.summary.errorCount} errors to proceed</>
            )}
          </Typography>
          
          <Button 
            variant="contained" 
            onClick={onProceedToImport}
            disabled={!canProceed}
            size="large"
          >
            🚀 Start Import ({validationResult.summary.validRows} products)
          </Button>
        </Stack>
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
      >
        <MenuItem onClick={() => { setFilterType('all'); setFilterAnchorEl(null); }}>
          All Issues ({validationResult.issues.length})
        </MenuItem>
        <MenuItem onClick={() => { setFilterType('errors'); setFilterAnchorEl(null); }}>
          Errors Only ({validationResult.issues.filter(i => i.type === 'error').length})
        </MenuItem>
        <MenuItem onClick={() => { setFilterType('warnings'); setFilterAnchorEl(null); }}>
          Warnings Only ({validationResult.issues.filter(i => i.type === 'warning').length})
        </MenuItem>
      </Menu>

      {/* Edit Issue Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Edit Value - Row {selectedIssue?.row ? selectedIssue.row + 1 : ''}, Column {selectedIssue?.column}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Value"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            multiline={editValue.length > 50}
            rows={editValue.length > 50 ? 3 : 1}
          />
          {selectedIssue?.suggestion && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Suggestion: {selectedIssue.suggestion}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ValidationResults;