// CSV Import System Types
export interface CSVData {
  headers: string[];
  rows: string[][];
  totalRows: number;
  fileName: string;
  fileSize: number;
}

export interface FieldMapping {
  csvColumn: string;
  ppmField: string;
  fieldType: FieldType;
  isRequired: boolean;
  defaultValue?: string;
  transformFunction?: (value: string) => any;
}

export type FieldType = 'text' | 'number' | 'integer' | 'boolean' | 'date' | 'enum' | 'array';

export interface PPMField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  description: string;
  validation?: ValidationRule;
  options?: string[]; // for enum types
  placeholder?: string;
}

export interface ValidationRule {
  pattern?: RegExp;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  enum?: string[];
  unique?: boolean;
  custom?: (value: any) => boolean | string;
}

export interface ValidationIssue {
  row: number;
  column: string;
  type: 'error' | 'warning';
  message: string;
  value: string;
  suggestion?: string;
  autoFixable?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  validRows: ProductRow[];
  issues: ValidationIssue[];
  summary: ValidationSummary;
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  errorCount: number;
  warningCount: number;
  errorRows: number[];
  warningRows: number[];
}

export interface ProductRow {
  rowIndex: number;
  data: Record<string, any>;
  isValid: boolean;
  issues: ValidationIssue[];
}

export interface ImportOptions {
  skipErrorRows: boolean;
  autoFixWarnings: boolean;
  createBackup: boolean;
  updateExisting: boolean;
  sendNotification: boolean;
  chunkSize: number;
  dryRun?: boolean;
}

export interface ImportProgress {
  phase: ImportPhase;
  currentChunk: number;
  totalChunks: number;
  processedRows: number;
  totalRows: number;
  successCount: number;
  errorCount: number;
  warningCount: number;
  estimatedTimeLeft: number;
  startTime: Date;
}

export type ImportPhase = 'preparing' | 'validating' | 'importing' | 'finalizing' | 'completed' | 'error' | 'cancelled';

export interface ImportResult {
  importId: string;
  status: 'success' | 'partial' | 'failed';
  totalRows: number;
  successCount: number;
  errorCount: number;
  warningCount: number;
  duration: number;
  createdProducts: string[];
  updatedProducts: string[];
  failedRows: FailedRow[];
  summary: string;
  downloadUrls: {
    successReport?: string;
    errorReport?: string;
    fullReport: string;
  };
}

export interface FailedRow {
  rowIndex: number;
  data: Record<string, any>;
  errors: string[];
  skipped: boolean;
}

export interface ImportTemplate {
  id: string;
  name: string;
  description: string;
  fields: PPMField[];
  sampleData: Record<string, any>[];
  version: string;
  category: 'basic' | 'advanced' | 'custom';
}

export interface ImportHistory {
  id: string;
  fileName: string;
  importDate: Date;
  status: ImportResult['status'];
  totalRows: number;
  successCount: number;
  errorCount: number;
  duration: number;
  userId: string;
  template?: string;
}

// CSV Import Wizard Steps
export type ImportStep = 'upload' | 'mapping' | 'validation' | 'execution';

export interface ImportWizardState {
  currentStep: ImportStep;
  csvData: CSVData | null;
  fieldMappings: FieldMapping[];
  validationResult: ValidationResult | null;
  importOptions: ImportOptions;
  importProgress: ImportProgress | null;
  importResult: ImportResult | null;
  isProcessing: boolean;
  error: string | null;
}

// File Upload
export interface FileUploadState {
  isDragActive: boolean;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  file: File | null;
  preview: CSVPreview | null;
}

export interface CSVPreview {
  headers: string[];
  sampleRows: string[][];
  totalRows: number;
  detectedEncoding: string;
  hasHeaders: boolean;
}

// Field Detection
export interface FieldDetectionResult {
  suggestedMappings: FieldMapping[];
  confidence: number;
  ambiguousFields: string[];
  unmappedColumns: string[];
}

// Auto-fix suggestions
export interface AutoFixSuggestion {
  issueId: string;
  description: string;
  preview: {
    before: string;
    after: string;
  };
  confidence: number;
  applies: boolean;
}

export interface BulkAutoFix {
  suggestions: AutoFixSuggestion[];
  totalAffectedRows: number;
  estimatedTime: number;
}