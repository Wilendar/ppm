import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Preview as PreviewIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Undo as UndoIcon,
} from '@mui/icons-material';
import { ProductFeature } from '../../types/api.types';

interface ProductDescriptionsProps {
  descriptions: {
    short: string;
    long: string;
    features: ProductFeature[];
  };
  onChange: (descriptions: {
    short: string;
    long: string;
    features: ProductFeature[];
  }) => void;
  readOnly?: boolean;
}

const ProductDescriptions: React.FC<ProductDescriptionsProps> = ({
  descriptions,
  onChange,
  readOnly = false,
}) => {
  const [shortDescription, setShortDescription] = useState(descriptions.short);
  const [longDescription, setLongDescription] = useState(descriptions.long);
  const [features, setFeatures] = useState<ProductFeature[]>(descriptions.features);
  const [previewMode, setPreviewMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<ProductFeature | null>(null);

  // Track changes
  useEffect(() => {
    const changed = 
      shortDescription !== descriptions.short ||
      longDescription !== descriptions.long ||
      JSON.stringify(features) !== JSON.stringify(descriptions.features);
    setHasChanges(changed);
  }, [shortDescription, longDescription, features, descriptions]);

  const handleSave = useCallback(() => {
    onChange({
      short: shortDescription,
      long: longDescription,
      features,
    });
    setHasChanges(false);
  }, [shortDescription, longDescription, features, onChange]);

  const handleReset = useCallback(() => {
    setShortDescription(descriptions.short);
    setLongDescription(descriptions.long);
    setFeatures(descriptions.features);
    setHasChanges(false);
  }, [descriptions]);

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    if (hasChanges && !readOnly) {
      const timeoutId = setTimeout(() => {
        handleSave();
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [hasChanges, handleSave, readOnly]);

  const handleAddFeature = (feature: ProductFeature) => {
    setFeatures(prev => [...prev, feature]);
    setFeatureDialogOpen(false);
    setEditingFeature(null);
  };

  const handleEditFeature = (index: number, feature: ProductFeature) => {
    const newFeatures = [...features];
    newFeatures[index] = feature;
    setFeatures(newFeatures);
    setFeatureDialogOpen(false);
    setEditingFeature(null);
  };

  const handleDeleteFeature = (index: number) => {
    setFeatures(prev => prev.filter((_, i) => i !== index));
  };

  const getFeatureValueDisplay = (feature: ProductFeature) => {
    switch (feature.type) {
      case 'boolean':
        return feature.value === 'true' ? 'Yes' : 'No';
      case 'list':
        return feature.value.split(',').join(', ');
      default:
        return feature.value;
    }
  };

  // Feature Dialog Component
  const FeatureDialog = () => {
    const [featureName, setFeatureName] = useState(editingFeature?.name || '');
    const [featureValue, setFeatureValue] = useState(editingFeature?.value || '');
    const [featureType, setFeatureType] = useState<'text' | 'number' | 'boolean' | 'list'>(
      editingFeature?.type || 'text'
    );
    const [featureCategory, setFeatureCategory] = useState(editingFeature?.category || '');

    const handleSubmit = () => {
      const feature: ProductFeature = {
        name: featureName,
        value: featureValue,
        type: featureType,
        category: featureCategory || undefined,
      };

      if (editingFeature) {
        const index = features.findIndex(f => f === editingFeature);
        handleEditFeature(index, feature);
      } else {
        handleAddFeature(feature);
      }
    };

    return (
      <Dialog open={featureDialogOpen} onClose={() => setFeatureDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingFeature ? 'Edit Feature' : 'Add New Feature'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Feature Name"
              value={featureName}
              onChange={(e) => setFeatureName(e.target.value)}
              fullWidth
              required
            />
            
            <TextField
              label="Category (optional)"
              value={featureCategory}
              onChange={(e) => setFeatureCategory(e.target.value)}
              fullWidth
              placeholder="e.g., Technical Specs, Dimensions"
            />
            
            <TextField
              select
              label="Type"
              value={featureType}
              onChange={(e) => setFeatureType(e.target.value as any)}
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="boolean">Yes/No</option>
              <option value="list">List (comma-separated)</option>
            </TextField>
            
            {featureType === 'boolean' ? (
              <TextField
                select
                label="Value"
                value={featureValue}
                onChange={(e) => setFeatureValue(e.target.value)}
                SelectProps={{ native: true }}
                fullWidth
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </TextField>
            ) : (
              <TextField
                label="Value"
                value={featureValue}
                onChange={(e) => setFeatureValue(e.target.value)}
                fullWidth
                multiline={featureType === 'list'}
                rows={featureType === 'list' ? 3 : 1}
                placeholder={
                  featureType === 'list' 
                    ? 'Enter values separated by commas'
                    : featureType === 'number'
                    ? 'Enter a number'
                    : 'Enter text value'
                }
                required
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeatureDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!featureName || !featureValue}
          >
            {editingFeature ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      {/* Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={previewMode}
              onChange={(e) => setPreviewMode(e.target.checked)}
              disabled={readOnly}
            />
          }
          label="Preview Mode"
        />
        
        {hasChanges && !readOnly && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<UndoIcon />}
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
            >
              Save
            </Button>
          </Box>
        )}
      </Box>

      {/* Auto-save indicator */}
      {hasChanges && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Changes will be auto-saved in 2 seconds...
        </Alert>
      )}

      {/* Short Description */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Short Description
        </Typography>
        <TextField
          multiline
          rows={3}
          fullWidth
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder="Enter a brief product description (recommended: 150-160 characters for SEO)"
          disabled={readOnly || previewMode}
          helperText={`${shortDescription.length} characters`}
        />
        {previewMode && (
          <Paper elevation={1} sx={{ p: 2, mt: 1, backgroundColor: 'grey.50' }}>
            <Typography variant="body2">
              {shortDescription || 'No short description provided'}
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Long Description */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Long Description
        </Typography>
        <TextField
          multiline
          rows={6}
          fullWidth
          value={longDescription}
          onChange={(e) => setLongDescription(e.target.value)}
          placeholder="Enter detailed product description with HTML formatting if needed..."
          disabled={readOnly || previewMode}
          helperText={`${longDescription.length} characters`}
        />
        {previewMode && (
          <Paper elevation={1} sx={{ p: 2, mt: 1, backgroundColor: 'grey.50' }}>
            <Typography 
              variant="body2" 
              component="div"
              sx={{ whiteSpace: 'pre-wrap' }}
              dangerouslySetInnerHTML={{ 
                __html: longDescription || 'No long description provided' 
              }}
            />
          </Paper>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Product Features */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1">
            Product Features ({features.length})
          </Typography>
          {!readOnly && !previewMode && (
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingFeature(null);
                setFeatureDialogOpen(true);
              }}
            >
              Add Feature
            </Button>
          )}
        </Box>

        {features.length === 0 ? (
          <Alert severity="info">
            No product features defined yet. Features help customers understand key product specifications.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {features.map((feature, index) => (
              <Paper key={index} elevation={1} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {feature.name}
                      </Typography>
                      {feature.category && (
                        <Chip label={feature.category} size="small" variant="outlined" />
                      )}
                      <Chip 
                        label={feature.type} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {getFeatureValueDisplay(feature)}
                    </Typography>
                  </Box>
                  
                  {!readOnly && !previewMode && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingFeature(feature);
                          setFeatureDialogOpen(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteFeature(index)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Box>

      {/* Feature Dialog */}
      <FeatureDialog />
    </Box>
  );
};

export default ProductDescriptions;