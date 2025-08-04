import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  TextField,
  Typography,
  Chip,
  Tooltip,
  Alert,
  IconButton,
  Collapse,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Help as HelpIcon,
  ContentPaste as PasteIcon,
  FormatListBulleted as ListIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';

interface SKUInputProps {
  value: string;
  parsedSKUs: string[];
  onChange: (input: string, parsed: string[]) => void;
  disabled?: boolean;
}

type InputMode = 'single' | 'multiline' | 'comma';

const SKUInput: React.FC<SKUInputProps> = ({
  value,
  parsedSKUs,
  onChange,
  disabled = false,
}) => {
  const [inputMode, setInputMode] = useState<InputMode>('multiline');
  const [showHelp, setShowHelp] = useState(false);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Intelligent SKU parsing function
  const parseSKUs = useCallback((input: string): { skus: string[], warnings: string[] } => {
    if (!input.trim()) {
      return { skus: [], warnings: [] };
    }

    const warnings: string[] = [];
    let skus: string[] = [];

    // Auto-detect format and parse accordingly
    const lines = input.split('\n').filter(line => line.trim());
    
    if (lines.length === 1) {
      // Single line - check for comma or space separation
      const singleLine = lines[0];
      
      if (singleLine.includes(',')) {
        // Comma-separated
        skus = singleLine
          .split(',')
          .map(sku => sku.trim())
          .filter(sku => sku.length > 0);
        
        if (inputMode !== 'comma') {
          warnings.push('Auto-detected comma-separated format');
        }
      } else if (singleLine.includes(' ') && !singleLine.includes('-')) {
        // Space-separated (but not if it looks like a single SKU with spaces)
        skus = singleLine
          .split(/\s+/)
          .map(sku => sku.trim())
          .filter(sku => sku.length > 0);
        
        warnings.push('Auto-detected space-separated format');
      } else {
        // Single SKU
        skus = [singleLine.trim()];
      }
    } else {
      // Multi-line input
      skus = [];
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        if (trimmedLine.includes(',')) {
          // Line contains commas - split by comma
          const lineSKUs = trimmedLine
            .split(',')
            .map(sku => sku.trim())
            .filter(sku => sku.length > 0);
          skus.push(...lineSKUs);
        } else if (trimmedLine.includes(' ') && trimmedLine.split(/\s+/).length > 2) {
          // Line contains multiple space-separated items
          const lineSKUs = trimmedLine
            .split(/\s+/)
            .map(sku => sku.trim())
            .filter(sku => sku.length > 0);
          skus.push(...lineSKUs);
        } else {
          // Single SKU per line
          skus.push(trimmedLine);
        }
      });
    }

    // Clean and validate SKUs
    const cleanedSKUs = skus
      .map(sku => sku.trim().toUpperCase())
      .filter(sku => {
        // Basic SKU validation - alphanumeric with hyphens/underscores
        const isValid = /^[A-Z0-9\-_]+$/.test(sku) && sku.length > 0;
        if (!isValid && sku.length > 0) {
          warnings.push(`Invalid SKU format: "${sku}"`);
        }
        return isValid;
      });

    // Remove duplicates
    const uniqueSKUs = Array.from(new Set(cleanedSKUs));
    if (uniqueSKUs.length !== cleanedSKUs.length) {
      const duplicateCount = cleanedSKUs.length - uniqueSKUs.length;
      warnings.push(`Removed ${duplicateCount} duplicate SKU${duplicateCount > 1 ? 's' : ''}`);
    }

    // Check for empty results
    if (input.trim() && uniqueSKUs.length === 0) {
      warnings.push('No valid SKUs found in input');
    }

    return { skus: uniqueSKUs, warnings };
  }, [inputMode]);

  // Parse SKUs when input changes
  const { skus: currentParsedSKUs, warnings } = useMemo(() => {
    return parseSKUs(value);
  }, [value, parseSKUs]);

  // Update parent when parsed SKUs change
  useEffect(() => {
    setParseWarnings(warnings);
    // Only trigger onChange if the parsed result actually changed
    if (JSON.stringify(currentParsedSKUs) !== JSON.stringify(parsedSKUs)) {
      onChange(value, currentParsedSKUs);
    }
  }, [currentParsedSKUs, warnings, value, onChange, parsedSKUs]);

  // Handle input change with debouncing
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Immediate update for UI responsiveness
    onChange(newValue, currentParsedSKUs);
    
    // Debounced parsing for large inputs
    if (newValue.length > 100) {
      debounceTimeoutRef.current = setTimeout(() => {
        const { skus } = parseSKUs(newValue);
        onChange(newValue, skus);
      }, 300);
    }
  }, [onChange, currentParsedSKUs, parseSKUs]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Handle paste from clipboard
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const newValue = value ? `${value}\n${text}` : text;
      onChange(newValue, parseSKUs(newValue).skus);
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  }, [value, onChange, parseSKUs]);

  // Handle input mode change
  const handleInputModeChange = useCallback((
    event: React.MouseEvent<HTMLElement>,
    newMode: InputMode | null,
  ) => {
    if (newMode) {
      setInputMode(newMode);
    }
  }, []);

  // Get example text based on input mode
  const getPlaceholderText = useCallback(() => {
    switch (inputMode) {
      case 'single':
        return 'Enter a single SKU (e.g., DEMO-001)';
      case 'comma':
        return 'Enter comma-separated SKUs (e.g., DEMO-001, DEMO-002, DEMO-003)';
      case 'multiline':
      default:
        return 'Enter SKUs (one per line or comma-separated):\nDEMO-001\nDEMO-002, DEMO-003\nDEMO-004';
    }
  }, [inputMode]);

  // Calculate rows for textarea
  const textFieldRows = inputMode === 'single' ? 1 : Math.min(Math.max(value.split('\n').length, 4), 10);

  return (
    <Box>
      {/* Input Mode Selector */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Input Method:
        </Typography>
        
        <ToggleButtonGroup
          value={inputMode}
          exclusive
          onChange={handleInputModeChange}
          aria-label="SKU input method"
          size="small"
        >
          <ToggleButton value="single" aria-label="Single SKU">
            <NotesIcon sx={{ mr: 1 }} />
            Single
          </ToggleButton>
          <ToggleButton value="multiline" aria-label="Multiple lines">
            <ListIcon sx={{ mr: 1 }} />
            Multiple Lines
          </ToggleButton>
          <ToggleButton value="comma" aria-label="Comma separated">
            Comma Separated
          </ToggleButton>
        </ToggleButtonGroup>

        <Tooltip title="Show input format help">
          <IconButton
            size="small"
            onClick={() => setShowHelp(!showHelp)}
            color={showHelp ? 'primary' : 'default'}
          >
            <HelpIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Paste from clipboard">
          <IconButton
            size="small"
            onClick={handlePaste}
            disabled={disabled}
          >
            <PasteIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Help Section */}
      <Collapse in={showHelp}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            SKU Input Formats:
          </Typography>
          <Box component="ul" sx={{ mt: 1, mb: 1, pl: 2 }}>
            <li><strong>Single:</strong> DEMO-001</li>
            <li><strong>Multiple Lines:</strong> One SKU per line</li>
            <li><strong>Comma Separated:</strong> DEMO-001, DEMO-002, DEMO-003</li>
            <li><strong>Mixed:</strong> Combination of formats (auto-detected)</li>
          </Box>
          <Typography variant="body2" color="text.secondary">
            The system automatically detects and parses different formats. Duplicates are removed automatically.
          </Typography>
        </Alert>
      </Collapse>

      {/* SKU Input Field */}
      <TextField
        fullWidth
        multiline={inputMode !== 'single'}
        rows={textFieldRows}
        placeholder={getPlaceholderText()}
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        variant="outlined"
        sx={{
          '& .MuiInputBase-input': {
            fontFamily: 'monospace',
            fontSize: '0.9rem',
          },
        }}
        InputProps={{
          sx: {
            backgroundColor: disabled ? 'action.disabledBackground' : 'background.paper',
          },
        }}
      />

      {/* Parsed SKUs Preview */}
      {currentParsedSKUs.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Parsed SKUs ({currentParsedSKUs.length}):
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              maxHeight: 120,
              overflow: 'auto',
              backgroundColor: 'grey.50',
            }}
          >
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {currentParsedSKUs.map((sku, index) => (
                <Chip
                  key={`${sku}-${index}`}
                  label={sku}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                  }}
                />
              ))}
            </Box>
          </Paper>
        </Box>
      )}

      {/* Parse Warnings */}
      {parseWarnings.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {parseWarnings.map((warning, index) => (
            <Alert
              key={index}
              severity="warning"
              sx={{ mb: 1 }}
              variant="outlined"
            >
              <Typography variant="body2">
                {warning}
              </Typography>
            </Alert>
          ))}
        </Box>
      )}

      {/* Input Stats */}
      {value && (
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {value.length} characters, {value.split('\n').length} lines
          </Typography>
          {currentParsedSKUs.length > 0 && (
            <Typography variant="caption" color="primary" fontWeight="medium">
              {currentParsedSKUs.length} valid SKUs ready
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default SKUInput;