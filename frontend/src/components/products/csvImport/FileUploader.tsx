import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import {
  Box,
  Typography,
  Paper,
  Button,
  LinearProgress,
  Alert,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Help as HelpIcon,
  InsertDriveFile as CSVIcon
} from '@mui/icons-material';
import { CSVData, CSVPreview, FileUploadState } from '../../../types/csvImport.types';
import { DEFAULT_TEMPLATE } from '../../../config/csvImportFields';

interface FileUploaderProps {
  onFileProcessed: (csvData: CSVData) => void;
  onError: (error: string) => void;
  maxFileSize?: number; // in bytes
  disabled?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileProcessed,
  onError,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  disabled = false
}) => {
  const [uploadState, setUploadState] = useState<FileUploadState>({
    isDragActive: false,
    isUploading: false,
    uploadProgress: 0,
    error: null,
    file: null,
    preview: null
  });

  const processCSVFile = useCallback(async (file: File) => {
    setUploadState(prev => ({ ...prev, isUploading: true, uploadProgress: 0, error: null }));

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadState(prev => {
          if (prev.uploadProgress >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, uploadProgress: prev.uploadProgress + 10 };
        });
      }, 100);

      // Parse CSV file
      return new Promise<CSVData>((resolve, reject) => {
        Papa.parse(file, {
          complete: (results) => {
            clearInterval(progressInterval);
            
            if (results.errors && results.errors.length > 0) {
              const criticalErrors = results.errors.filter(err => err.type === 'Delimiter');
              if (criticalErrors.length > 0) {
                reject(new Error(`CSV parsing error: ${criticalErrors[0].message}`));
                return;
              }
            }

            const data = results.data as string[][];
            if (data.length === 0) {
              reject(new Error('File is empty or contains no readable data'));
              return;
            }

            // Extract headers and rows
            const headers = data[0] || [];
            const rows = data.slice(1).filter(row => row.some(cell => cell.trim()));

            if (headers.length === 0) {
              reject(new Error('No headers found in CSV file'));
              return;
            }

            if (rows.length === 0) {
              reject(new Error('No data rows found in CSV file'));
              return;
            }

            const csvData: CSVData = {
              headers,
              rows,
              totalRows: rows.length,
              fileName: file.name,
              fileSize: file.size
            };

            // Create preview
            const preview: CSVPreview = {
              headers,
              sampleRows: rows.slice(0, 5), // First 5 rows for preview
              totalRows: rows.length,
              detectedEncoding: 'UTF-8',
              hasHeaders: true
            };

            setUploadState(prev => ({
              ...prev,
              isUploading: false,
              uploadProgress: 100,
              file,
              preview,
              error: null
            }));

            resolve(csvData);
          },
          error: (error) => {
            clearInterval(progressInterval);
            reject(new Error(`Failed to parse CSV: ${error.message}`));
          },
          header: false,
          skipEmptyLines: true,
          encoding: 'UTF-8'
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        uploadProgress: 0,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    // Validate file size
    if (file.size > maxFileSize) {
      const errorMsg = `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size (${(maxFileSize / 1024 / 1024).toFixed(0)}MB)`;
      setUploadState(prev => ({ ...prev, error: errorMsg }));
      onError(errorMsg);
      return;
    }

    try {
      const csvData = await processCSVFile(file);
      onFileProcessed(csvData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      setUploadState(prev => ({ ...prev, error: errorMessage }));
      onError(errorMessage);
    }
  }, [maxFileSize, onFileProcessed, onError, processCSVFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false,
    disabled: disabled || uploadState.isUploading
  });

  const handleClearFile = () => {
    setUploadState({
      isDragActive: false,
      isUploading: false,
      uploadProgress: 0,
      error: null,
      file: null,
      preview: null
    });
  };

  const downloadTemplate = () => {
    const csvContent = [
      DEFAULT_TEMPLATE.fields.map(field => field.label).join(','),
      ...DEFAULT_TEMPLATE.sampleData.map(row => 
        DEFAULT_TEMPLATE.fields.map(field => row[field.key] || '').join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'ppm-product-import-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      {/* Header with help and template download */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2">
          STEP 1: File Upload
        </Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Download CSV template with sample data">
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={downloadTemplate}
            >
              Template
            </Button>
          </Tooltip>
          <Tooltip title="View import guide and documentation">
            <IconButton size="small">
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Upload Area */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: uploadState.error ? 'error.main' : 
                     isDragActive ? 'primary.main' : 
                     uploadState.file ? 'success.main' : 'grey.300',
          bgcolor: uploadState.error ? 'error.light' : 
                  isDragActive ? 'primary.light' : 
                  uploadState.file ? 'success.light' : 'background.default',
          cursor: disabled || uploadState.isUploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: disabled || uploadState.isUploading ? undefined : 'primary.main',
            bgcolor: disabled || uploadState.isUploading ? undefined : 'primary.light'
          }
        }}
      >
        <input {...getInputProps()} />
        
        {uploadState.isUploading ? (
          <Box>
            <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Processing file...
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={uploadState.uploadProgress} 
              sx={{ mb: 2, maxWidth: 300, mx: 'auto' }}
            />
            <Typography variant="body2" color="text.secondary">
              {uploadState.uploadProgress}% complete
            </Typography>
          </Box>
        ) : uploadState.file ? (
          <Box>
            <CSVIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom color="success.main">
              File uploaded successfully!
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
              <Chip 
                icon={<FileIcon />}
                label={uploadState.file.name}
                color="success"
                variant="outlined"
              />
              <Chip 
                label={formatFileSize(uploadState.file.size)}
                size="small"
                variant="outlined"
              />
              <IconButton size="small" onClick={handleClearFile}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </Box>
        ) : (
          <Box>
            <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop CSV file here' : 'Drag & Drop CSV file here'}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              or click to browse
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Supported: .csv, .xlsx, .xls
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Max size: {(maxFileSize / 1024 / 1024).toFixed(0)}MB (~50,000 products)
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Error Display */}
      {uploadState.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {uploadState.error}
        </Alert>
      )}

      {/* File Preview */}
      {uploadState.preview && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            File Preview
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Showing first 5 rows of {uploadState.preview.totalRows} total rows
          </Alert>
          
          <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 50, bgcolor: 'grey.100' }}>
                    <strong>Row</strong>
                  </TableCell>
                  {uploadState.preview.headers.map((header, index) => (
                    <TableCell key={index} sx={{ minWidth: 120, bgcolor: 'grey.100' }}>
                      <strong>{header}</strong>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {uploadState.preview.sampleRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex} hover>
                    <TableCell sx={{ bgcolor: 'grey.50' }}>
                      {rowIndex + 1}
                    </TableCell>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex} sx={{ maxWidth: 200 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {cell}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

export default FileUploader;