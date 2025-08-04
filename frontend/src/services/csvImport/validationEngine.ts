import {
  CSVData,
  FieldMapping,
  ValidationResult,
  ValidationIssue,
  ValidationSummary,
  ProductRow,
  AutoFixSuggestion,
  BulkAutoFix
} from '../../types/csvImport.types';
import { PPM_FIELDS } from '../../config/csvImportFields';

export class ValidationEngine {
  private csvData: CSVData;
  private mappings: FieldMapping[];
  private existingSKUs: Set<string> = new Set(); // In real app, this would come from API

  constructor(csvData: CSVData, mappings: FieldMapping[]) {
    this.csvData = csvData;
    this.mappings = mappings;
    // Mock existing SKUs for demonstration
    this.existingSKUs = new Set(['EXISTING-001', 'EXISTING-002', 'HP-001']);
  }

  async validateData(): Promise<ValidationResult> {
    const validRows: ProductRow[] = [];
    const allIssues: ValidationIssue[] = [];
    const processedSKUs = new Set<string>();

    // Process each row
    for (let rowIndex = 0; rowIndex < this.csvData.rows.length; rowIndex++) {
      const row = this.csvData.rows[rowIndex];
      const productRow = this.validateRow(row, rowIndex, processedSKUs);
      
      validRows.push(productRow);
      allIssues.push(...productRow.issues);
    }

    const summary = this.generateSummary(validRows, allIssues);
    
    return {
      isValid: summary.errorCount === 0,
      validRows,
      issues: allIssues,
      summary
    };
  }

  private validateRow(row: string[], rowIndex: number, processedSKUs: Set<string>): ProductRow {
    const issues: ValidationIssue[] = [];
    const data: Record<string, any> = {};

    // Map CSV row to data object
    this.mappings.forEach(mapping => {
      const columnIndex = this.csvData.headers.indexOf(mapping.csvColumn);
      if (columnIndex !== -1 && columnIndex < row.length) {
        data[mapping.ppmField] = row[columnIndex];
      }
    });

    // Validate each mapped field
    this.mappings.forEach(mapping => {
      const value = data[mapping.ppmField];
      const fieldConfig = PPM_FIELDS.find(f => f.key === mapping.ppmField);
      
      if (!fieldConfig) return;

      const fieldIssues = this.validateField(
        mapping.ppmField,
        value,
        fieldConfig,
        rowIndex,
        mapping.csvColumn,
        processedSKUs
      );
      
      issues.push(...fieldIssues);
    });

    // Check for required fields
    const requiredFields = PPM_FIELDS.filter(f => f.required);
    requiredFields.forEach(field => {
      const hasMapping = this.mappings.some(m => m.ppmField === field.key);
      if (!hasMapping) {
        issues.push({
          row: rowIndex,
          column: field.key,
          type: 'error',
          message: `Required field "${field.label}" is not mapped`,
          value: '',
          suggestion: `Map a CSV column to ${field.label}`
        });
      }
    });

    const isValid = !issues.some(issue => issue.type === 'error');

    return {
      rowIndex,
      data,
      isValid,
      issues
    };
  }

  private validateField(
    fieldKey: string,
    value: string,
    fieldConfig: any,
    rowIndex: number,
    csvColumn: string,
    processedSKUs: Set<string>
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const trimmedValue = value?.toString().trim() || '';

    // Required field validation
    if (fieldConfig.required && !trimmedValue) {
      issues.push({
        row: rowIndex,
        column: csvColumn,
        type: 'error',
        message: `Required field "${fieldConfig.label}" is empty`,
        value: trimmedValue,
        suggestion: 'Provide a value for this required field'
      });
      return issues; // Skip other validations if required field is empty
    }

    // Skip validation if field is empty and not required
    if (!trimmedValue && !fieldConfig.required) {
      return issues;
    }

    // Type-specific validation
    switch (fieldConfig.type) {
      case 'number':
        this.validateNumber(fieldKey, trimmedValue, fieldConfig, rowIndex, csvColumn, issues);
        break;
      case 'integer':
        this.validateInteger(fieldKey, trimmedValue, fieldConfig, rowIndex, csvColumn, issues);
        break;
      case 'text':
        this.validateText(fieldKey, trimmedValue, fieldConfig, rowIndex, csvColumn, issues);
        break;
      case 'enum':
        this.validateEnum(fieldKey, trimmedValue, fieldConfig, rowIndex, csvColumn, issues);
        break;
      case 'date':
        this.validateDate(fieldKey, trimmedValue, fieldConfig, rowIndex, csvColumn, issues);
        break;
      case 'array':
        this.validateArray(fieldKey, trimmedValue, fieldConfig, rowIndex, csvColumn, issues);
        break;
    }

    // Field-specific business logic validation
    if (fieldKey === 'sku') {
      this.validateSKU(trimmedValue, rowIndex, csvColumn, issues, processedSKUs);
    } else if (fieldKey === 'price') {
      this.validatePrice(trimmedValue, rowIndex, csvColumn, issues);
    } else if (fieldKey === 'email') {
      this.validateEmail(trimmedValue, rowIndex, csvColumn, issues);
    }

    return issues;
  }

  private validateNumber(
    fieldKey: string,
    value: string,
    fieldConfig: any,
    rowIndex: number,
    csvColumn: string,
    issues: ValidationIssue[]
  ): void {
    const numValue = parseFloat(value.replace(',', '.'));
    
    if (isNaN(numValue)) {
      issues.push({
        row: rowIndex,
        column: csvColumn,
        type: 'error',
        message: 'Must be a valid number',
        value,
        suggestion: 'Use format like "123.45" or "123,45"',
        autoFixable: value.includes(',')
      });
      return;
    }

    if (fieldConfig.validation?.min !== undefined && numValue < fieldConfig.validation.min) {
      issues.push({
        row: rowIndex,
        column: csvColumn,
        type: 'error',
        message: `Value must be at least ${fieldConfig.validation.min}`,
        value,
        suggestion: `Use a value >= ${fieldConfig.validation.min}`
      });
    }

    if (fieldConfig.validation?.max !== undefined && numValue > fieldConfig.validation.max) {
      issues.push({
        row: rowIndex,
        column: csvColumn,
        type: 'error',
        message: `Value must be at most ${fieldConfig.validation.max}`,
        value,
        suggestion: `Use a value <= ${fieldConfig.validation.max}`
      });
    }
  }

  private validateInteger(
    fieldKey: string,
    value: string,
    fieldConfig: any,
    rowIndex: number,
    csvColumn: string,
    issues: ValidationIssue[]
  ): void {
    const intValue = parseInt(value, 10);
    
    if (isNaN(intValue) || !Number.isInteger(parseFloat(value))) {
      issues.push({
        row: rowIndex,
        column: csvColumn,
        type: 'error',
        message: 'Must be a whole number',
        value,
        suggestion: 'Use format like "123" (no decimals)',
        autoFixable: value.includes('.')
      });
      return;
    }

    if (fieldConfig.validation?.min !== undefined && intValue < fieldConfig.validation.min) {
      issues.push({
        row: rowIndex,
        column: csvColumn,
        type: 'error',
        message: `Value must be at least ${fieldConfig.validation.min}`,
        value,
        suggestion: `Use a value >= ${fieldConfig.validation.min}`
      });
    }

    if (fieldConfig.validation?.max !== undefined && intValue > fieldConfig.validation.max) {
      issues.push({
        row: rowIndex,
        column: csvColumn,
        type: 'error',
        message: `Value must be at most ${fieldConfig.validation.max}`,
        value,
        suggestion: `Use a value <= ${fieldConfig.validation.max}`
      });
    }
  }

  private validateText(
    fieldKey: string,
    value: string,
    fieldConfig: any,
    rowIndex: number,
    csvColumn: string,
    issues: ValidationIssue[]
  ): void {
    if (fieldConfig.validation?.minLength && value.length < fieldConfig.validation.minLength) {
      issues.push({
        row: rowIndex,
        column: csvColumn,
        type: 'error',
        message: `Must be at least ${fieldConfig.validation.minLength} characters long`,
        value,
        suggestion: `Add more characters (current: ${value.length})`
      });
    }

    if (fieldConfig.validation?.maxLength && value.length > fieldConfig.validation.maxLength) {
      issues.push({
        row: rowIndex,
        column: csvColumn,
        type: 'warning',
        message: `Exceeds maximum length of ${fieldConfig.validation.maxLength} characters`,
        value,
        suggestion: `Shorten text (current: ${value.length})`,
        autoFixable: true
      });
    }

    if (fieldConfig.validation?.pattern && !fieldConfig.validation.pattern.test(value)) {
      issues.push({
        row: rowIndex,
        column: csvColumn,
        type: 'error',
        message: 'Invalid format',
        value,
        suggestion: this.getPatternSuggestion(fieldKey, fieldConfig.validation.pattern)
      });
    }
  }

  private validateEnum(
    fieldKey: string,
    value: string,
    fieldConfig: any,
    rowIndex: number,
    csvColumn: string,
    issues: ValidationIssue[]
  ): void {
    const allowedValues = fieldConfig.validation?.enum || fieldConfig.options || [];
    const normalizedValue = value.toLowerCase();
    const allowedLower = allowedValues.map((v: string) => v.toLowerCase());

    if (!allowedLower.includes(normalizedValue)) {
      const closestMatch = this.findClosestMatch(normalizedValue, allowedValues);
      issues.push({
        row: rowIndex,
        column: csvColumn,
        type: 'error',
        message: `Invalid value. Allowed: ${allowedValues.join(', ')}`,
        value,
        suggestion: closestMatch ? `Did you mean "${closestMatch}"?` : `Use one of: ${allowedValues.join(', ')}`,
        autoFixable: !!closestMatch
      });
    }
  }

  private validateDate(
    fieldKey: string,
    value: string,
    fieldConfig: any,
    rowIndex: number,
    csvColumn: string,
    issues: ValidationIssue[]
  ): void {
    const dateValue = new Date(value);
    
    if (isNaN(dateValue.getTime())) {
      issues.push({
        row: rowIndex,
        column: csvColumn,
        type: 'error',
        message: 'Invalid date format',
        value,
        suggestion: 'Use format YYYY-MM-DD (e.g., 2024-01-15)',
        autoFixable: this.isDateAutoFixable(value)
      });
    }
  }

  private validateArray(
    fieldKey: string,
    value: string,
    fieldConfig: any,
    rowIndex: number,
    csvColumn: string,
    issues: ValidationIssue[]
  ): void {
    // Arrays are expected to be comma-separated
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    
    if (items.length === 0) {
      issues.push({
        row: rowIndex,
        column: csvColumn,
        type: 'warning',
        message: 'Empty array - no items found',
        value,
        suggestion: 'Use comma-separated values like "item1, item2, item3"'
      });
    }

    // Check for duplicates
    const uniqueItems = new Set(items);
    if (uniqueItems.size !== items.length) {
      issues.push({
        row: rowIndex,
        column: csvColumn,
        type: 'warning',
        message: 'Duplicate items found in list',
        value,
        suggestion: 'Remove duplicate items',
        autoFixable: true
      });
    }
  }

  private validateSKU(
    value: string,
    rowIndex: number,
    csvColumn: string,
    issues: ValidationIssue[],
    processedSKUs: Set<string>
  ): void {
    // Check if SKU already exists in database
    if (this.existingSKUs.has(value)) {
      issues.push({
        row: rowIndex,
        column: csvColumn,
        type: 'error',
        message: 'SKU already exists in database',
        value,
        suggestion: `Try "${value}-V2" or "${value}-NEW"`
      });
    }

    // Check for duplicates within current import
    if (processedSKUs.has(value)) {
      issues.push({
        row: rowIndex,
        column: csvColumn,
        type: 'error',
        message: 'Duplicate SKU in this import',
        value,
        suggestion: 'Each SKU must be unique'
      });
    } else {
      processedSKUs.add(value);
    }

    // SKU format validation (already handled by text validation with pattern)
  }

  private validatePrice(
    value: string,
    rowIndex: number,
    csvColumn: string,
    issues: ValidationIssue[]
  ): void {
    const numValue = parseFloat(value.replace(',', '.'));
    
    if (!isNaN(numValue)) {
      // Warning for suspiciously low prices
      if (numValue < 1.0) {
        issues.push({
          row: rowIndex,
          column: csvColumn,
          type: 'warning',
          message: 'Price seems unusually low',
          value,
          suggestion: 'Please verify this price is correct'
        });
      }

      // Warning for very high prices
      if (numValue > 10000) {
        issues.push({
          row: rowIndex,
          column: csvColumn,
          type: 'warning',
          message: 'Price seems unusually high',
          value,
          suggestion: 'Please verify this price is correct'
        });
      }
    }
  }

  private validateEmail(
    value: string,
    rowIndex: number,
    csvColumn: string,
    issues: ValidationIssue[]
  ): void {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      issues.push({
        row: rowIndex,
        column: csvColumn,
        type: 'error',
        message: 'Invalid email format',
        value,
        suggestion: 'Use format like "user@example.com"'
      });
    }
  }

  private generateSummary(validRows: ProductRow[], allIssues: ValidationIssue[]): ValidationSummary {
    const errorCount = allIssues.filter(issue => issue.type === 'error').length;
    const warningCount = allIssues.filter(issue => issue.type === 'warning').length;
    const errorRows = [...new Set(allIssues.filter(issue => issue.type === 'error').map(issue => issue.row))];
    const warningRows = [...new Set(allIssues.filter(issue => issue.type === 'warning').map(issue => issue.row))];
    const validRowCount = validRows.filter(row => row.isValid).length;

    return {
      totalRows: validRows.length,
      validRows: validRowCount,
      errorCount,
      warningCount,
      errorRows,
      warningRows
    };
  }

  // Auto-fix functionality
  async generateAutoFixSuggestions(): Promise<BulkAutoFix> {
    const suggestions: AutoFixSuggestion[] = [];
    let totalAffectedRows = 0;

    // Find auto-fixable issues
    const validationResult = await this.validateData();
    const autoFixableIssues = validationResult.issues.filter(issue => issue.autoFixable);

    autoFixableIssues.forEach((issue, index) => {
      const suggestion = this.generateAutoFixSuggestion(issue, index.toString());
      if (suggestion) {
        suggestions.push(suggestion);
        totalAffectedRows++;
      }
    });

    return {
      suggestions,
      totalAffectedRows,
      estimatedTime: Math.ceil(totalAffectedRows / 100) // Rough estimate: 100 fixes per second
    };
  }

  private generateAutoFixSuggestion(issue: ValidationIssue, id: string): AutoFixSuggestion | null {
    let fixedValue = issue.value;
    let description = '';
    let confidence = 0.8;

    switch (true) {
      case issue.message.includes('comma') && issue.value.includes(','):
        fixedValue = issue.value.replace(',', '.');
        description = 'Replace comma with dot in number';
        confidence = 0.9;
        break;

      case issue.message.includes('decimal') && issue.value.includes('.'):
        fixedValue = Math.floor(parseFloat(issue.value)).toString();
        description = 'Remove decimal places';
        confidence = 0.8;
        break;

      case issue.message.includes('maximum length'):
        const maxLength = parseInt(issue.message.match(/\d+/)?.[0] || '255');
        fixedValue = issue.value.substring(0, maxLength);
        description = `Truncate to ${maxLength} characters`;
        confidence = 0.7;
        break;

      case issue.message.includes('duplicate items'):
        const items = issue.value.split(',').map(item => item.trim());
        fixedValue = [...new Set(items)].join(', ');
        description = 'Remove duplicate items';
        confidence = 0.95;
        break;

      default:
        return null;
    }

    return {
      issueId: id,
      description,
      preview: {
        before: issue.value,
        after: fixedValue
      },
      confidence,
      applies: true
    };
  }

  // Helper methods
  private getPatternSuggestion(fieldKey: string, pattern: RegExp): string {
    const suggestions: Record<string, string> = {
      sku: 'Use alphanumeric characters, hyphens, and underscores (e.g., "HP-001")',
      ean: 'Use 8-14 digits (e.g., "1234567890123")',
      phone: 'Use format like "+1-555-123-4567"',
      url: 'Use format like "https://example.com"'
    };

    return suggestions[fieldKey] || 'Check the required format';
  }

  private findClosestMatch(value: string, options: string[]): string | null {
    let bestMatch = null;
    let bestScore = 0;

    options.forEach(option => {
      const score = this.calculateSimilarity(value.toLowerCase(), option.toLowerCase());
      if (score > bestScore && score > 0.6) {
        bestScore = score;
        bestMatch = option;
      }
    });

    return bestMatch;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);
    
    if (maxLen === 0) return 1;
    
    const distance = this.levenshteinDistance(str1, str2);
    return (maxLen - distance) / maxLen;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private isDateAutoFixable(value: string): boolean {
    // Check if it's in DD/MM/YYYY or MM/DD/YYYY format
    const datePatterns = [
      /^\d{1,2}\/\d{1,2}\/\d{4}$/,
      /^\d{1,2}-\d{1,2}-\d{4}$/,
      /^\d{4}\/\d{1,2}\/\d{1,2}$/
    ];

    return datePatterns.some(pattern => pattern.test(value));
  }
}

// Export default validation engine factory
export const createValidationEngine = (csvData: CSVData, mappings: FieldMapping[]): ValidationEngine => {
  return new ValidationEngine(csvData, mappings);
};