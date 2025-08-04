import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  Chip,
  Alert,
  Button,
  Stack,
  Tooltip,
  IconButton,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  AutoAwesome as AutoIcon,
  Add as AddIcon,
  Help as HelpIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { CSVData, FieldMapping, FieldDetectionResult } from '../../../types/csvImport.types';
import { PPM_FIELDS, COMMON_FIELD_MAPPINGS, FIELD_GROUPS } from '../../../config/csvImportFields';

interface FieldMapperProps {
  csvData: CSVData;
  onMappingComplete: (mappings: FieldMapping[]) => void;
  onError: (error: string) => void;
}

const FieldMapper: React.FC<FieldMapperProps> = ({
  csvData,
  onMappingComplete,
  onError
}) => {
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [autoDetectionResult, setAutoDetectionResult] = useState<FieldDetectionResult | null>(null);
  const [showCustomFieldDialog, setShowCustomFieldDialog] = useState(false);
  const [customFieldName, setCustomFieldName] = useState('');

  // Auto-detect field mappings on mount
  useEffect(() => {
    const detectFields = (): FieldDetectionResult => {
      const suggestedMappings: FieldMapping[] = [];
      const ambiguousFields: string[] = [];
      const unmappedColumns: string[] = [];

      csvData.headers.forEach(csvColumn => {
        const normalizedColumn = csvColumn.toLowerCase().trim();
        let bestMatch: string | null = null;
        let confidence = 0;

        // Try to find exact or close matches
        for (const [ppmField, variations] of Object.entries(COMMON_FIELD_MAPPINGS)) {
          for (const variation of variations) {
            if (normalizedColumn === variation.toLowerCase()) {
              bestMatch = ppmField;
              confidence = 1.0;
              break;
            } else if (normalizedColumn.includes(variation.toLowerCase()) || 
                      variation.toLowerCase().includes(normalizedColumn)) {
              if (confidence < 0.8) {
                bestMatch = ppmField;
                confidence = 0.8;
              }
            }
          }
          if (confidence === 1.0) break;
        }

        if (bestMatch) {
          const ppmFieldConfig = PPM_FIELDS.find(f => f.key === bestMatch);
          if (ppmFieldConfig) {
            suggestedMappings.push({
              csvColumn,
              ppmField: bestMatch,
              fieldType: ppmFieldConfig.type,
              isRequired: ppmFieldConfig.required
            });
          }
        } else {
          unmappedColumns.push(csvColumn);
        }

        if (confidence > 0 && confidence < 0.8) {
          ambiguousFields.push(csvColumn);
        }
      });

      return {
        suggestedMappings,
        confidence: suggestedMappings.length / csvData.headers.length,
        ambiguousFields,
        unmappedColumns
      };
    };

    const result = detectFields();
    setAutoDetectionResult(result);
    setMappings(result.suggestedMappings);
  }, [csvData]);

  // Validation of current mappings
  const validationStatus = useMemo(() => {
    const requiredFields = PPM_FIELDS.filter(f => f.required);
    const mappedRequiredFields = mappings.filter(m => 
      requiredFields.some(rf => rf.key === m.ppmField)
    );
    
    const duplicateMappings = mappings.reduce((acc, mapping, index) => {
      const duplicates = mappings.filter((m, i) => 
        i !== index && m.ppmField === mapping.ppmField && m.ppmField !== ''
      );
      if (duplicates.length > 0) {
        acc.push(mapping.csvColumn);
      }
      return acc;
    }, [] as string[]);

    const missingRequired = requiredFields.filter(rf => 
      !mappings.some(m => m.ppmField === rf.key)
    );

    return {
      isValid: missingRequired.length === 0 && duplicateMappings.length === 0,
      missingRequired,
      duplicateMappings,
      mappedFields: mappings.filter(m => m.ppmField).length,
      totalColumns: csvData.headers.length
    };
  }, [mappings]);

  const handleMappingChange = (csvColumn: string, ppmField: string) => {
    setMappings(prev => {
      const existing = prev.find(m => m.csvColumn === csvColumn);
      const ppmFieldConfig = PPM_FIELDS.find(f => f.key === ppmField);
      
      if (existing) {
        return prev.map(m => 
          m.csvColumn === csvColumn 
            ? {
                ...m,
                ppmField,
                fieldType: ppmFieldConfig?.type || 'text',
                isRequired: ppmFieldConfig?.required || false
              }
            : m
        );
      } else {
        return [...prev, {
          csvColumn,
          ppmField,
          fieldType: ppmFieldConfig?.type || 'text',
          isRequired: ppmFieldConfig?.required || false
        }];
      }
    });
  };

  const handleAutoApply = () => {
    if (autoDetectionResult) {
      setMappings(autoDetectionResult.suggestedMappings);
    }
  };

  const handleRefreshDetection = () => {
    // Re-run auto-detection
    const detectFields = (): FieldDetectionResult => {
      // Same logic as in useEffect
      const suggestedMappings: FieldMapping[] = [];
      const ambiguousFields: string[] = [];
      const unmappedColumns: string[] = [];

      csvData.headers.forEach(csvColumn => {
        const normalizedColumn = csvColumn.toLowerCase().trim();
        let bestMatch: string | null = null;

        for (const [ppmField, variations] of Object.entries(COMMON_FIELD_MAPPINGS)) {
          if (variations.some(v => normalizedColumn.includes(v.toLowerCase()))) {
            bestMatch = ppmField;
            break;
          }
        }

        if (bestMatch) {
          const ppmFieldConfig = PPM_FIELDS.find(f => f.key === bestMatch);
          if (ppmFieldConfig) {
            suggestedMappings.push({
              csvColumn,
              ppmField: bestMatch,
              fieldType: ppmFieldConfig.type,
              isRequired: ppmFieldConfig.required
            });
          }
        } else {
          unmappedColumns.push(csvColumn);
        }
      });

      return {
        suggestedMappings,
        confidence: suggestedMappings.length / csvData.headers.length,
        ambiguousFields,
        unmappedColumns
      };
    };

    const result = detectFields();
    setAutoDetectionResult(result);
  };

  const handleAddCustomField = () => {
    if (customFieldName.trim()) {
      // Add custom field to available fields (in practice, this would be handled by the backend)
      setCustomFieldName('');
      setShowCustomFieldDialog(false);
    }
  };

  const getCurrentMapping = (csvColumn: string): string => {
    const mapping = mappings.find(m => m.csvColumn === csvColumn);
    return mapping?.ppmField || '';
  };

  const getAvailableFields = (currentCsvColumn: string) => {
    const currentMapping = getCurrentMapping(currentCsvColumn);
    const usedFields = mappings
      .filter(m => m.csvColumn !== currentCsvColumn && m.ppmField)
      .map(m => m.ppmField);
    
    return PPM_FIELDS.filter(field => 
      !usedFields.includes(field.key) || field.key === currentMapping
    );
  };

  const getSampleData = (csvColumn: string): string => {
    const columnIndex = csvData.headers.indexOf(csvColumn);
    if (columnIndex === -1 || csvData.rows.length === 0) return '';
    
    const sampleValue = csvData.rows[0][columnIndex];
    return sampleValue ? `"${sampleValue}"` : '';
  };

  const getFieldStatus = (csvColumn: string) => {
    const mapping = mappings.find(m => m.csvColumn === csvColumn);
    const isDuplicate = validationStatus.duplicateMappings.includes(csvColumn);
    
    if (!mapping || !mapping.ppmField) {
      return { icon: <WarningIcon color="warning" />, status: 'unmapped' };
    }
    if (isDuplicate) {
      return { icon: <ErrorIcon color="error" />, status: 'duplicate' };
    }
    if (mapping.isRequired) {
      return { icon: <CheckIcon color="success" />, status: 'required' };
    }
    return { icon: <CheckIcon color="success" />, status: 'mapped' };
  };

  const handleComplete = () => {
    if (!validationStatus.isValid) {
      const errors = [];
      if (validationStatus.missingRequired.length > 0) {
        errors.push(`Missing required fields: ${validationStatus.missingRequired.map(f => f.label).join(', ')}`);
      }
      if (validationStatus.duplicateMappings.length > 0) {
        errors.push(`Duplicate mappings found for columns: ${validationStatus.duplicateMappings.join(', ')}`);
      }
      onError(errors.join('. '));
      return;
    }

    const completeMappings = mappings.filter(m => m.ppmField);
    onMappingComplete(completeMappings);
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2">
          STEP 2: Field Mapping
        </Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh auto-detection">
            <IconButton size="small" onClick={handleRefreshDetection}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Badge badgeContent={autoDetectionResult?.suggestedMappings.length || 0} color="primary">
            <Button
              variant="outlined"
              size="small"
              startIcon={<AutoIcon />}
              onClick={handleAutoApply}
              disabled={!autoDetectionResult?.suggestedMappings.length}
            >
              Auto-Map
            </Button>
          </Badge>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setShowCustomFieldDialog(true)}
          >
            Custom Field
          </Button>
        </Stack>
      </Box>

      {/* Status Alert */}
      {autoDetectionResult && (
        <Alert 
          severity={validationStatus.isValid ? "success" : "warning"} 
          sx={{ mb: 2 }}
          action={
            autoDetectionResult.confidence < 0.5 && (
              <Tooltip title="Low confidence in auto-detection. Please review mappings carefully.">
                <IconButton size="small">
                  <HelpIcon />
                </IconButton>
              </Tooltip>
            )
          }
        >
          Auto-detection: {(autoDetectionResult.confidence * 100).toFixed(0)}% confidence. 
          {validationStatus.mappedFields} of {validationStatus.totalColumns} columns mapped.
          {validationStatus.missingRequired.length > 0 && (
            <> Missing required: {validationStatus.missingRequired.map(f => f.label).join(', ')}</>
          )}
        </Alert>
      )}

      {/* Mapping Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 40 }}>Status</TableCell>
              <TableCell sx={{ minWidth: 200 }}>CSV Column</TableCell>
              <TableCell sx={{ minWidth: 250 }}>PPM Field</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Format</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Required</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Sample</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {csvData.headers.map((csvColumn, index) => {
              const fieldStatus = getFieldStatus(csvColumn);
              const currentMapping = getCurrentMapping(csvColumn);
              const availableFields = getAvailableFields(csvColumn);
              const ppmField = PPM_FIELDS.find(f => f.key === currentMapping);
              const sampleData = getSampleData(csvColumn);

              return (
                <TableRow key={index} hover>
                  <TableCell>
                    <Tooltip title={`Field is ${fieldStatus.status}`}>
                      {fieldStatus.icon}
                    </Tooltip>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {csvColumn}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <FormControl fullWidth size="small">
                      <Select
                        value={currentMapping}
                        onChange={(e) => handleMappingChange(csvColumn, e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="">
                          <em>Skip this column</em>
                        </MenuItem>
                        {Object.entries(FIELD_GROUPS).map(([groupKey, group]) => {
                          const groupFields = availableFields.filter(f => 
                            group.fields.includes(f.key)
                          );
                          
                          if (groupFields.length === 0) return null;
                          
                          return [
                            <Typography 
                              key={`${groupKey}-header`}
                              variant="caption"
                              sx={{ 
                                px: 2, 
                                py: 1, 
                                fontWeight: 'bold',
                                color: 'primary.main',
                                display: 'block'
                              }}
                            >
                              {group.label}
                            </Typography>,
                            ...groupFields.map(field => (
                              <MenuItem key={field.key} value={field.key} sx={{ pl: 3 }}>
                                {field.label}
                                {field.required && (
                                  <Chip 
                                    label="Required" 
                                    size="small" 
                                    color="error" 
                                    sx={{ ml: 1, height: 16 }}
                                  />
                                )}
                              </MenuItem>
                            ))
                          ];
                        })}
                      </Select>
                    </FormControl>
                  </TableCell>
                  
                  <TableCell>
                    <Chip 
                      label={ppmField?.type || 'text'} 
                      size="small" 
                      variant="outlined"
                      color={ppmField?.type === 'number' ? 'primary' : 
                            ppmField?.type === 'enum' ? 'secondary' : 'default'}
                    />
                  </TableCell>
                  
                  <TableCell>
                    {ppmField?.required ? (
                      <Chip label="Yes" size="small" color="error" />
                    ) : (
                      <Chip label="No" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace',
                        maxWidth: 150,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {sampleData}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Buttons */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
        <Typography variant="body2" color="text.secondary">
          {validationStatus.mappedFields} columns mapped, {validationStatus.missingRequired.length} required fields missing
        </Typography>
        
        <Stack direction="row" spacing={2}>
          <Button variant="outlined">
            Save Mapping Template
          </Button>
          <Button 
            variant="contained" 
            onClick={handleComplete}
            disabled={!validationStatus.isValid}
          >
            Continue to Validation
          </Button>
        </Stack>
      </Box>

      {/* Custom Field Dialog */}
      <Dialog open={showCustomFieldDialog} onClose={() => setShowCustomFieldDialog(false)}>
        <DialogTitle>Add Custom Field</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Field Name"
            fullWidth
            variant="outlined"
            value={customFieldName}
            onChange={(e) => setCustomFieldName(e.target.value)}
            placeholder="e.g., Custom Attribute"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCustomFieldDialog(false)}>Cancel</Button>
          <Button onClick={handleAddCustomField} variant="contained">Add Field</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FieldMapper;