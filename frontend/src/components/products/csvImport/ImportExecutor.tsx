import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Stack,
  Button,
  Alert,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  Refresh as RestartIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import {
  ImportProgress,
  ImportResult,
  ImportOptions,
  ValidationResult,
  ImportPhase
} from '../../../types/csvImport.types';

interface ImportExecutorProps {
  validationResult: ValidationResult;
  importOptions: ImportOptions;
  onImportComplete: (result: ImportResult) => void;
  onBack: () => void;
  csvData: any;
  mappings: any[];
}

const ImportExecutor: React.FC<ImportExecutorProps> = ({
  validationResult,
  importOptions,
  onImportComplete,
  onBack,
  csvData,
  mappings
}) => {
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [realTimeStats, setRealTimeStats] = useState({
    rowsPerSecond: 0,
    averageTime: 0,
    estimatedCompletion: null as Date | null
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Mock import service - in real app this would be an API call
  const executeImport = async (): Promise<ImportResult> => {
    const totalRows = validationResult.validRows.length;
    const chunkSize = importOptions.chunkSize;
    const totalChunks = Math.ceil(totalRows / chunkSize);
    
    setIsImporting(true);
    setImportProgress({
      phase: 'preparing',
      currentChunk: 0,
      totalChunks,
      processedRows: 0,
      totalRows,
      successCount: 0,
      errorCount: 0,
      warningCount: 0,
      estimatedTimeLeft: 0,
      startTime: new Date()
    });

    startTimeRef.current = new Date();
    addLog('Import process started');
    addLog(`Processing ${totalRows} valid rows in ${totalChunks} chunks`);

    // Simulate import process with realistic timing
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      if (isPaused) {
        // Wait for resume
        await new Promise(resolve => {
          const checkResume = () => {
            if (!isPaused) {
              resolve(void 0);
            } else {
              setTimeout(checkResume, 100);
            }
          };
          checkResume();
        });
      }

      const chunkStart = chunkIndex * chunkSize;
      const chunkEnd = Math.min(chunkStart + chunkSize, totalRows);
      const chunkRows = chunkEnd - chunkStart;

      setImportProgress(prev => prev ? {
        ...prev,
        phase: 'importing',
        currentChunk: chunkIndex + 1
      } : null);

      addLog(`Processing chunk ${chunkIndex + 1}/${totalChunks} (rows ${chunkStart + 1}-${chunkEnd})`);

      // Simulate processing time (50-200ms per row)
      const processingTime = chunkRows * (50 + Math.random() * 150);
      
      // Process chunk with progress updates
      for (let i = 0; i < chunkRows; i++) {
        await new Promise(resolve => setTimeout(resolve, processingTime / chunkRows));
        
        const processedRows = chunkStart + i + 1;
        const successRate = 0.95 + Math.random() * 0.04; // 95-99% success rate
        const isSuccess = Math.random() < successRate;
        
        setImportProgress(prev => prev ? {
          ...prev,
          processedRows,
          successCount: isSuccess ? prev.successCount + 1 : prev.successCount,
          errorCount: !isSuccess ? prev.errorCount + 1 : prev.errorCount,
          estimatedTimeLeft: calculateETA(processedRows, totalRows, startTimeRef.current!)
        } : null);

        // Update real-time statistics
        updateRealTimeStats(processedRows, startTimeRef.current!);
      }

      addLog(`Chunk ${chunkIndex + 1} completed: ${chunkRows} rows processed`);
    }

    setImportProgress(prev => prev ? { ...prev, phase: 'finalizing' } : null);
    addLog('Finalizing import...');
    
    // Simulate finalization
    await new Promise(resolve => setTimeout(resolve, 1000));

    const endTime = new Date();
    const duration = endTime.getTime() - startTimeRef.current!.getTime();
    
    const result: ImportResult = {
      importId: `import_${Date.now()}`,
      status: 'success',
      totalRows,
      successCount: Math.floor(totalRows * 0.97), // 97% success rate
      errorCount: Math.floor(totalRows * 0.02), // 2% error rate
      warningCount: Math.floor(totalRows * 0.01), // 1% warning rate
      duration,
      createdProducts: Array.from({ length: Math.floor(totalRows * 0.97) }, (_, i) => `PROD_${i + 1}`),
      updatedProducts: [],
      failedRows: [],
      summary: `Successfully imported ${Math.floor(totalRows * 0.97)} products`,
      downloadUrls: {
        successReport: '#success-report',
        errorReport: '#error-report',
        fullReport: '#full-report'
      }
    };

    setImportProgress(prev => prev ? { ...prev, phase: 'completed' } : null);
    setImportResult(result);
    setIsImporting(false);
    addLog(`Import completed successfully in ${Math.round(duration / 1000)}s`);
    
    return result;
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const calculateETA = (processed: number, total: number, startTime: Date): number => {
    const elapsed = Date.now() - startTime.getTime();
    const rate = processed / elapsed; // rows per ms
    const remaining = total - processed;
    return remaining / rate;
  };

  const updateRealTimeStats = (processed: number, startTime: Date) => {
    const elapsed = (Date.now() - startTime.getTime()) / 1000; // seconds
    const rowsPerSecond = processed / elapsed;
    const averageTime = elapsed / processed * 1000; // ms per row
    const estimatedCompletion = new Date(Date.now() + calculateETA(processed, validationResult.validRows.length, startTime));

    setRealTimeStats({
      rowsPerSecond: Math.round(rowsPerSecond * 10) / 10,
      averageTime: Math.round(averageTime),
      estimatedCompletion
    });
  };

  const handleStart = async () => {
    try {
      const result = await executeImport();
      onImportComplete(result);
      setShowResultDialog(true);
    } catch (error) {
      console.error('Import failed:', error);
      addLog(`Import failed: ${error}`);
      setIsImporting(false);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    addLog('Import paused by user');
  };

  const handleResume = () => {
    setIsPaused(false);
    addLog('Import resumed');
  };

  const handleStop = () => {
    setIsImporting(false);
    setIsPaused(false);
    setImportProgress(null);
    addLog('Import stopped by user');
  };

  const handleRestart = () => {
    setImportProgress(null);
    setImportResult(null);
    setIsImporting(false);
    setIsPaused(false);
    setLogs([]);
    setRealTimeStats({
      rowsPerSecond: 0,
      averageTime: 0,
      estimatedCompletion: null
    });
    addLog('Import reset');
  };

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getPhaseDescription = (phase: ImportPhase): string => {
    switch (phase) {
      case 'preparing': return 'Preparing import...';
      case 'validating': return 'Validating data...';
      case 'importing': return 'Importing products...';
      case 'finalizing': return 'Finalizing import...';
      case 'completed': return 'Import completed';
      case 'error': return 'Import failed';
      case 'cancelled': return 'Import cancelled';
      default: return 'Unknown phase';
    }
  };

  const getProgressPercentage = (): number => {
    if (!importProgress) return 0;
    return (importProgress.processedRows / importProgress.totalRows) * 100;
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2">
          STEP 4: Import Execution
        </Typography>
        <Stack direction="row" spacing={1}>
          <IconButton 
            size="small" 
            onClick={() => setShowDetails(!showDetails)}
            color={showDetails ? 'primary' : 'default'}
          >
            {showDetails ? <CollapseIcon /> : <ExpandIcon />}
          </IconButton>
        </Stack>
      </Box>

      {/* Import Summary */}
      <Paper sx={{ p: 3, mb: 2 }} variant="outlined">
        <Typography variant="h6" gutterBottom>
          Import Summary
        </Typography>
        <Stack direction="row" spacing={4}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Valid Rows
            </Typography>
            <Typography variant="h4" color="success.main">
              {validationResult.summary.validRows}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Chunk Size
            </Typography>
            <Typography variant="h6">
              {importOptions.chunkSize}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Total Chunks
            </Typography>
            <Typography variant="h6">
              {Math.ceil(validationResult.summary.validRows / importOptions.chunkSize)}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} mt={2}>
          {importOptions.skipErrorRows && <Chip label="Skip errors" color="warning" size="small" />}
          {importOptions.autoFixWarnings && <Chip label="Auto-fix warnings" color="info" size="small" />}
          {importOptions.createBackup && <Chip label="Create backup" color="primary" size="small" />}
          {importOptions.updateExisting && <Chip label="Update existing" color="secondary" size="small" />}
        </Stack>
      </Paper>

      {/* Progress Section */}
      {importProgress && (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Stack spacing={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                {getPhaseDescription(importProgress.phase)}
              </Typography>
              <Chip 
                label={importProgress.phase} 
                color={importProgress.phase === 'completed' ? 'success' : 'primary'}
                size="small"
              />
            </Box>

            <LinearProgress 
              variant="determinate" 
              value={getProgressPercentage()} 
              sx={{ height: 8, borderRadius: 4 }}
            />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">
                {importProgress.processedRows} / {importProgress.totalRows} rows
                ({Math.round(getProgressPercentage())}%)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Chunk {importProgress.currentChunk} / {importProgress.totalChunks}
              </Typography>
            </Stack>

            {/* Real-time Statistics */}
            <Stack direction="row" spacing={4}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <SpeedIcon color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Speed
                  </Typography>
                  <Typography variant="body1">
                    {realTimeStats.rowsPerSecond} rows/sec
                  </Typography>
                </Box>
              </Stack>
              
              <Stack direction="row" alignItems="center" spacing={1}>
                <TimelineIcon color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Avg Time
                  </Typography>
                  <Typography variant="body1">
                    {realTimeStats.averageTime}ms/row
                  </Typography>
                </Box>
              </Stack>
              
              {realTimeStats.estimatedCompletion && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <StorageIcon color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      ETA
                    </Typography>
                    <Typography variant="body1">
                      {realTimeStats.estimatedCompletion.toLocaleTimeString()}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Stack>

            {/* Progress Details */}
            <Stack direction="row" spacing={3}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <SuccessIcon color="success" />
                <Typography variant="body2">
                  {importProgress.successCount} success
                </Typography>
              </Stack>
              
              <Stack direction="row" alignItems="center" spacing={1}>
                <ErrorIcon color="error" />
                <Typography variant="body2">
                  {importProgress.errorCount} errors
                </Typography>
              </Stack>
              
              <Stack direction="row" alignItems="center" spacing={1}>
                <WarningIcon color="warning" />
                <Typography variant="body2">
                  {importProgress.warningCount} warnings
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Control Buttons */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} justifyContent="center">
          {!isImporting && !importResult ? (
            <Button
              variant="contained"
              size="large"
              startIcon={<StartIcon />}
              onClick={handleStart}
              color="success"
            >
              Start Import
            </Button>
          ) : isImporting ? (
            <>
              {isPaused ? (
                <Button
                  variant="contained"
                  startIcon={<StartIcon />}
                  onClick={handleResume}
                  color="success"
                >
                  Resume
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<PauseIcon />}
                  onClick={handlePause}
                  color="warning"
                >
                  Pause
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<StopIcon />}
                onClick={handleStop}
                color="error"
              >
                Stop
              </Button>
            </>
          ) : (
            <Button
              variant="outlined"
              startIcon={<RestartIcon />}
              onClick={handleRestart}
            >
              Start New Import
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Detailed Logs */}
      <Collapse in={showDetails}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Import Logs
          </Typography>
          <Box sx={{ 
            maxHeight: 200, 
            overflow: 'auto', 
            bgcolor: 'grey.100', 
            p: 1, 
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.875rem'
          }}>
            {logs.map((log, index) => (
              <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                {log}
              </Typography>
            ))}
          </Box>
        </Paper>
      </Collapse>

      {/* Import Result */}
      {importResult && (
        <Paper sx={{ p: 3, mb: 2 }} variant="outlined">
          <Alert severity="success" sx={{ mb: 2 }}>
            Import completed successfully!
          </Alert>
          
          <Stack spacing={2}>
            <Typography variant="h6">
              Import Results
            </Typography>
            
            <Stack direction="row" spacing={4}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Processed
                </Typography>
                <Typography variant="h5">
                  {importResult.totalRows}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Successful
                </Typography>
                <Typography variant="h5" color="success.main">
                  {importResult.successCount}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Errors
                </Typography>
                <Typography variant="h5" color="error.main">
                  {importResult.errorCount}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="h6">
                  {formatTime(importResult.duration)}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                size="small"
              >
                Success Report
              </Button>
              {importResult.errorCount > 0 && (
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  size="small"
                >
                  Error Report
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                size="small"
              >
                Full Report
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Action Buttons */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Button variant="outlined" onClick={onBack} disabled={isImporting}>
          Back to Validation
        </Button>
        
        {importResult && (
          <Button 
            variant="contained" 
            onClick={() => window.location.href = '/products'}
            size="large"
          >
            View Products
          </Button>
        )}
      </Box>

      {/* Result Summary Dialog */}
      <Dialog 
        open={showResultDialog} 
        onClose={() => setShowResultDialog(false)}
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Import Completed Successfully</DialogTitle>
        <DialogContent>
          {importResult && (
            <Stack spacing={3}>
              <Alert severity="success">
                {importResult.summary}
              </Alert>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Total Rows</TableCell>
                      <TableCell align="right">{importResult.totalRows}</TableCell>
                      <TableCell align="right">100%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Successful</TableCell>
                      <TableCell align="right">{importResult.successCount}</TableCell>
                      <TableCell align="right">
                        {Math.round((importResult.successCount / importResult.totalRows) * 100)}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Errors</TableCell>
                      <TableCell align="right">{importResult.errorCount}</TableCell>
                      <TableCell align="right">
                        {Math.round((importResult.errorCount / importResult.totalRows) * 100)}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Warnings</TableCell>
                      <TableCell align="right">{importResult.warningCount}</TableCell>
                      <TableCell align="right">
                        {Math.round((importResult.warningCount / importResult.totalRows) * 100)}%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResultDialog(false)}>Close</Button>
          <Button variant="contained" onClick={() => window.location.href = '/products'}>
            View Products
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImportExecutor;