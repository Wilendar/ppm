import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Stack,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  AccountTree as MappingIcon,
  CheckCircle as ValidationIcon,
  PlayArrow as ExecuteIcon,
  Close as CloseIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import {
  CSVData,
  FieldMapping,
  ValidationResult,
  ImportOptions,
  ImportResult,
  ImportWizardState,
  ImportStep
} from '../../../types/csvImport.types';
import { createValidationEngine } from '../../../services/csvImport/validationEngine';
import FileUploader from './FileUploader';
import FieldMapper from './FieldMapper';
import ValidationResults from './ValidationResults';
import ImportExecutor from './ImportExecutor';

interface CSVImportWizardProps {
  onClose: () => void;
  onImportComplete?: (result: ImportResult) => void;
}

const STEPS: { key: ImportStep; label: string; icon: React.ReactNode; description: string }[] = [
  {
    key: 'upload',
    label: 'File Upload',
    icon: <UploadIcon />,
    description: 'Upload your CSV file with product data'
  },
  {
    key: 'mapping',
    label: 'Field Mapping',
    icon: <MappingIcon />,
    description: 'Map CSV columns to PPM product fields'
  },
  {
    key: 'validation',
    label: 'Validation',
    icon: <ValidationIcon />,
    description: 'Review and fix any data issues'
  },
  {
    key: 'execution',
    label: 'Import',
    icon: <ExecuteIcon />,
    description: 'Execute the import process'
  }
];

const CSVImportWizard: React.FC<CSVImportWizardProps> = ({
  onClose,
  onImportComplete
}) => {
  const [wizardState, setWizardState] = useState<ImportWizardState>({
    currentStep: 'upload',
    csvData: null,
    fieldMappings: [],
    validationResult: null,
    importOptions: {
      skipErrorRows: true,
      autoFixWarnings: true,
      createBackup: true,
      updateExisting: false,
      sendNotification: true,
      chunkSize: 100
    },
    importProgress: null,
    importResult: null,
    isProcessing: false,
    error: null
  });

  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showCloseConfirmDialog, setShowCloseConfirmDialog] = useState(false);

  const getCurrentStepIndex = (): number => {
    return STEPS.findIndex(step => step.key === wizardState.currentStep);
  };

  const canNavigateToStep = (stepKey: ImportStep): boolean => {
    const stepIndex = STEPS.findIndex(s => s.key === stepKey);
    const currentIndex = getCurrentStepIndex();
    
    // Can always go to previous steps
    if (stepIndex < currentIndex) return true;
    
    // Can go to next step only if current step is complete
    switch (wizardState.currentStep) {
      case 'upload':
        return stepKey === 'mapping' && wizardState.csvData !== null;
      case 'mapping':
        return stepKey === 'validation' && wizardState.fieldMappings.length > 0;
      case 'validation':
        return stepKey === 'execution' && wizardState.validationResult !== null;
      case 'execution':
        return false; // Can't navigate away from execution
      default:
        return false;
    }
  };

  const navigateToStep = (stepKey: ImportStep) => {
    if (canNavigateToStep(stepKey)) {
      setWizardState(prev => ({ ...prev, currentStep: stepKey, error: null }));
    }
  };

  // Step 1: File Upload handlers
  const handleFileProcessed = useCallback(async (csvData: CSVData) => {
    setWizardState(prev => ({
      ...prev,
      csvData,
      error: null
    }));
    
    // Auto-advance to mapping step
    setTimeout(() => {
      setWizardState(prev => ({ ...prev, currentStep: 'mapping' }));
    }, 500);
  }, []);

  const handleFileError = useCallback((error: string) => {
    setWizardState(prev => ({
      ...prev,
      error,
      csvData: null
    }));
  }, []);

  // Step 2: Field Mapping handlers
  const handleMappingComplete = useCallback(async (mappings: FieldMapping[]) => {
    if (!wizardState.csvData) return;

    setWizardState(prev => ({
      ...prev,
      fieldMappings: mappings,
      isProcessing: true,
      error: null
    }));

    try {
      // Run validation
      const validationEngine = createValidationEngine(wizardState.csvData, mappings);
      const validationResult = await validationEngine.validateData();
      
      setWizardState(prev => ({
        ...prev,
        validationResult,
        isProcessing: false,
        currentStep: 'validation'
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      setWizardState(prev => ({
        ...prev,
        error: errorMessage,
        isProcessing: false
      }));
    }
  }, [wizardState.csvData]);

  const handleMappingError = useCallback((error: string) => {
    setWizardState(prev => ({
      ...prev,
      error
    }));
  }, []);

  // Step 3: Validation handlers
  const handleValidationOptionsChange = useCallback((options: ImportOptions) => {
    setWizardState(prev => ({
      ...prev,
      importOptions: options
    }));
  }, []);

  const handleProceedToImport = useCallback(() => {
    setWizardState(prev => ({
      ...prev,
      currentStep: 'execution',
      error: null
    }));
  }, []);

  // Step 4: Import handlers
  const handleImportComplete = useCallback((result: ImportResult) => {
    setWizardState(prev => ({
      ...prev,
      importResult: result,
      importProgress: null
    }));
    
    // Notify parent component
    if (onImportComplete) {
      onImportComplete(result);
    }
  }, [onImportComplete]);

  // Navigation handlers
  const handleBack = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      const previousStep = STEPS[currentIndex - 1];
      navigateToStep(previousStep.key);
    }
  };

  const handleClose = () => {
    if (wizardState.isProcessing || wizardState.importProgress) {
      setShowCloseConfirmDialog(true);
    } else {
      onClose();
    }
  };

  const handleForceClose = () => {
    setShowCloseConfirmDialog(false);
    onClose();
  };

  const renderStepContent = () => {
    switch (wizardState.currentStep) {
      case 'upload':
        return (
          <FileUploader
            onFileProcessed={handleFileProcessed}
            onError={handleFileError}
            disabled={wizardState.isProcessing}
          />
        );

      case 'mapping':
        if (!wizardState.csvData) {
          return (
            <Alert severity="error">
              No CSV data available. Please go back and upload a file.
            </Alert>
          );
        }
        return (
          <FieldMapper
            csvData={wizardState.csvData}
            onMappingComplete={handleMappingComplete}
            onError={handleMappingError}
          />
        );

      case 'validation':
        if (!wizardState.validationResult || !wizardState.csvData) {
          return (
            <Alert severity="error">
              No validation data available. Please go back and complete field mapping.
            </Alert>
          );
        }
        return (
          <ValidationResults
            validationResult={wizardState.validationResult}
            onOptionsChange={handleValidationOptionsChange}
            onProceedToImport={handleProceedToImport}
            onBack={handleBack}
            csvData={wizardState.csvData}
            mappings={wizardState.fieldMappings}
          />
        );

      case 'execution':
        if (!wizardState.validationResult || !wizardState.csvData) {
          return (
            <Alert severity="error">
              No validation data available. Please go back and complete validation.
            </Alert>
          );
        }
        return (
          <ImportExecutor
            validationResult={wizardState.validationResult}
            importOptions={wizardState.importOptions}
            onImportComplete={handleImportComplete}
            onBack={handleBack}
            csvData={wizardState.csvData}
            mappings={wizardState.fieldMappings}
          />
        );

      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  const currentStepIndex = getCurrentStepIndex();
  const currentStepInfo = STEPS[currentStepIndex];

  return (
    <Dialog
      open={true}
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          minHeight: '80vh',
          maxHeight: '90vh',
          m: 1
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="h5" component="h1">
                📁 CSV Import System
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Mass Product Import
              </Typography>
            </Stack>
            
            {/* Breadcrumbs */}
            <Breadcrumbs sx={{ mt: 1 }}>
              <Link 
                color="inherit" 
                href="/products" 
                sx={{ textDecoration: 'none' }}
              >
                Products
              </Link>
              <Typography color="text.primary">CSV Import</Typography>
            </Breadcrumbs>
          </Box>

          <Stack direction="row" spacing={1}>
            <IconButton onClick={() => setShowHelpDialog(true)}>
              <HelpIcon />
            </IconButton>
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Progress Stepper */}
        <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
          <Stepper activeStep={currentStepIndex} alternativeLabel>
            {STEPS.map((step, index) => (
              <Step 
                key={step.key}
                completed={index < currentStepIndex}
              >
                <StepLabel
                  icon={step.icon}
                  onClick={() => navigateToStep(step.key)}
                  sx={{
                    cursor: canNavigateToStep(step.key) ? 'pointer' : 'default',
                    '& .MuiStepLabel-label': {
                      cursor: canNavigateToStep(step.key) ? 'pointer' : 'default'
                    }
                  }}
                >
                  <Typography variant="subtitle2">
                    {step.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {step.description}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Current Step Header */}
        <Box mb={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            {currentStepInfo.icon}
            <Box>
              <Typography variant="h6">
                {currentStepInfo.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentStepInfo.description}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Error Display */}
        {wizardState.error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setWizardState(prev => ({ ...prev, error: null }))}>
            {wizardState.error}
          </Alert>
        )}

        {/* Processing Indicator */}
        {wizardState.isProcessing && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Processing... Please wait.
          </Alert>
        )}

        {/* Step Content */}
        <Box sx={{ minHeight: 400 }}>
          {renderStepContent()}
        </Box>
      </DialogContent>

      {/* Help Dialog */}
      <Dialog
        open={showHelpDialog}
        onClose={() => setShowHelpDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>CSV Import Help</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            <Typography variant="h6" gutterBottom>
              How to use the CSV Import System:
            </Typography>
            
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Step 1: File Upload
            </Typography>
            <Typography variant="body2" paragraph>
              • Drag and drop your CSV file or click to browse<br/>
              • Supported formats: .csv, .xlsx, .xls<br/>
              • Maximum file size: 10MB (~50,000 products)<br/>
              • Download the template for correct format
            </Typography>

            <Typography variant="subtitle1" gutterBottom>
              Step 2: Field Mapping
            </Typography>
            <Typography variant="body2" paragraph>
              • Map your CSV columns to PPM product fields<br/>
              • Auto-detection suggests mappings automatically<br/>
              • Required fields must be mapped to proceed<br/>
              • Preview sample data for each column
            </Typography>

            <Typography variant="subtitle1" gutterBottom>
              Step 3: Validation
            </Typography>
            <Typography variant="body2" paragraph>
              • Review validation issues (errors and warnings)<br/>
              • Fix critical errors or choose to skip problem rows<br/>
              • Use auto-fix for common formatting issues<br/>
              • Configure import options
            </Typography>

            <Typography variant="subtitle1" gutterBottom>
              Step 4: Import
            </Typography>
            <Typography variant="body2" paragraph>
              • Monitor import progress in real-time<br/>
              • Pause, resume, or cancel the import<br/>
              • Download detailed reports when complete<br/>
              • View results and created products
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHelpDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Close Confirmation Dialog */}
      <Dialog
        open={showCloseConfirmDialog}
        onClose={() => setShowCloseConfirmDialog(false)}
      >
        <DialogTitle>Confirm Close</DialogTitle>
        <DialogContent>
          <DialogContentText>
            An import process is currently running. Are you sure you want to close?
            This will cancel the import and you may lose progress.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCloseConfirmDialog(false)}>Cancel</Button>
          <Button onClick={handleForceClose} color="error" variant="contained">
            Close Anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default CSVImportWizard;