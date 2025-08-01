/**
 * TypeScript Compatibility Analysis
 * Analyzes TypeScript compilation errors and suggests fixes
 * Author: Debugger Agent - Kamil Wilinski
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TypeScriptAnalyzer {
  constructor() {
    this.backendPath = path.join(__dirname, '..');
    this.errors = [];
    this.analysis = {
      total_errors: 0,
      by_category: {},
      by_file: {},
      severity: 'critical'
    };
  }

  runTypeCheck() {
    console.log('🔍 RUNNING TYPESCRIPT TYPE CHECK...');
    
    try {
      execSync('npm run type-check', { 
        cwd: this.backendPath, 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      console.log('✅ TypeScript compilation successful');
      return [];
    } catch (error) {
      const output = error.stdout || error.stderr || '';
      console.log('❌ TypeScript compilation failed');
      return this.parseTypeScriptErrors(output);
    }
  }

  parseTypeScriptErrors(output) {
    const lines = output.split('\n');
    const errors = [];
    
    for (const line of lines) {
      const errorMatch = line.match(/^(.+?)\((\d+),(\d+)\):\s*error\s+(TS\d+):\s*(.+)$/);
      if (errorMatch) {
        const [, file, lineNum, column, errorCode, message] = errorMatch;
        errors.push({
          file: file.replace(this.backendPath + path.sep, ''),
          line: parseInt(lineNum),
          column: parseInt(column),
          code: errorCode,
          message: message.trim()
        });
      }
    }
    
    return errors;
  }

  categorizeErrors(errors) {
    const categories = {
      'property_not_found': [],
      'enum_case_mismatch': [],
      'type_mismatch': [],
      'invalid_config': [],
      'validation_errors': [],
      'other': []
    };
    
    for (const error of errors) {
      if (error.message.includes("Property") && error.message.includes("does not exist")) {
        categories.property_not_found.push(error);
      } else if (error.message.includes("is not assignable to type") && error.message.includes("Did you mean")) {
        categories.enum_case_mismatch.push(error);
      } else if (error.message.includes("Type") && error.message.includes("is not assignable")) {
        categories.type_mismatch.push(error);
      } else if (error.message.includes("invalid configuration") || error.message.includes("does not exist in type")) {
        categories.invalid_config.push(error);
      } else if (error.message.includes("ValidationError")) {
        categories.validation_errors.push(error);
      } else {
        categories.other.push(error);
      }
    }
    
    return categories;
  }

  generateFixSuggestions(categorizedErrors) {
    const suggestions = [];
    
    // Property not found errors
    if (categorizedErrors.property_not_found.length > 0) {
      suggestions.push({
        category: 'Property Not Found',
        count: categorizedErrors.property_not_found.length,
        description: 'Old code references properties that no longer exist in new Prisma schema',
        examples: categorizedErrors.property_not_found.slice(0, 3).map(e => `${e.file}:${e.line} - ${e.message}`),
        fixes: [
          'Update User model references to use correct field names',
          'Remove references to password_hash, first_name, active, domain fields',
          'Use new Prisma generated types consistently'
        ]
      });
    }
    
    // Enum case mismatch
    if (categorizedErrors.enum_case_mismatch.length > 0) {
      suggestions.push({
        category: 'Enum Case Mismatch',
        count: categorizedErrors.enum_case_mismatch.length,
        description: 'Code uses lowercase enum values, but Prisma schema defines UPPERCASE',
        examples: categorizedErrors.enum_case_mismatch.slice(0, 3).map(e => `${e.file}:${e.line} - ${e.message}`),
        fixes: [
          'Change "admin" to "ADMIN", "manager" to "MANAGER", "user" to "USER"',
          'Change "google" to "GOOGLE", "microsoft" to "MICROSOFT"',
          'Update all enum references to use UPPERCASE values'
        ]
      });
    }
    
    // Type mismatch
    if (categorizedErrors.type_mismatch.length > 0) {
      suggestions.push({
        category: 'Type Mismatch',
        count: categorizedErrors.type_mismatch.length,
        description: 'Function signatures and types are incompatible',
        examples: categorizedErrors.type_mismatch.slice(0, 3).map(e => `${e.file}:${e.line} - ${e.message}`),
        fixes: [
          'Fix JWT service type annotations',
          'Fix Redis configuration options',
          'Update function return types to match Prisma client'
        ]
      });
    }
    
    // Validation errors
    if (categorizedErrors.validation_errors.length > 0) {
      suggestions.push({
        category: 'Validation Errors',
        count: categorizedErrors.validation_errors.length,
        description: 'Validation middleware has type compatibility issues',
        examples: categorizedErrors.validation_errors.slice(0, 3).map(e => `${e.file}:${e.line} - ${e.message}`),
        fixes: [
          'Update validation middleware to use correct Joi types',
          'Fix ValidationError property access',
          'Ensure proper typing for validation responses'
        ]
      });
    }
    
    return suggestions;
  }

  generateDetailedReport(errors, categorizedErrors, suggestions) {
    const report = {
      summary: {
        total_errors: errors.length,
        unique_files: new Set(errors.map(e => e.file)).size,
        categories: Object.keys(categorizedErrors).filter(cat => categorizedErrors[cat].length > 0),
        severity: errors.length > 50 ? 'critical' : errors.length > 20 ? 'high' : 'medium'
      },
      
      by_file: {},
      
      by_category: {},
      
      suggestions: suggestions,
      
      action_plan: this.generateActionPlan(suggestions)
    };
    
    // Group by file
    for (const error of errors) {
      if (!report.by_file[error.file]) {
        report.by_file[error.file] = [];
      }
      report.by_file[error.file].push(error);
    }
    
    // Group by category
    for (const [category, categoryErrors] of Object.entries(categorizedErrors)) {
      if (categoryErrors.length > 0) {
        report.by_category[category] = {
          count: categoryErrors.length,
          files: new Set(categoryErrors.map(e => e.file)).size,
          errors: categoryErrors
        };
      }
    }
    
    return report;
  }

  generateActionPlan(suggestions) {
    const plan = [
      {
        priority: 1,
        title: 'Fix Enum Case Mismatches',
        description: 'Quick wins - simple find/replace operations',
        estimated_time: '15 minutes',
        files_affected: 'user.service.ts, auth.controller.ts'
      },
      {
        priority: 2,
        title: 'Update User Model References',
        description: 'Remove references to non-existent User properties',
        estimated_time: '30 minutes',
        files_affected: 'user.service.ts, auth.controller.ts, auth.middleware.ts'
      },
      {
        priority: 3,
        title: 'Fix Service Type Configurations',
        description: 'Update JWT and Redis service configurations',
        estimated_time: '20 minutes',
        files_affected: 'jwt.service.ts, redis.service.ts'
      },
      {
        priority: 4,
        title: 'Fix Validation Middleware',
        description: 'Update validation types and error handling',
        estimated_time: '25 minutes',
        files_affected: 'validation.middleware.ts'
      }
    ];
    
    return plan;
  }

  async runAnalysis() {
    console.log('🚀 STARTING TYPESCRIPT COMPATIBILITY ANALYSIS...');
    console.log('=' .repeat(70));
    
    // Run type check
    const errors = this.runTypeCheck();
    
    if (errors.length === 0) {
      console.log('\n🎉 NO TYPESCRIPT ERRORS FOUND!');
      return { status: 'success', errors: 0 };
    }
    
    console.log(`\n📊 FOUND ${errors.length} TYPESCRIPT ERRORS`);
    
    // Categorize errors
    const categorizedErrors = this.categorizeErrors(errors);
    
    // Generate suggestions
    const suggestions = this.generateFixSuggestions(categorizedErrors);
    
    // Generate detailed report
    const report = this.generateDetailedReport(errors, categorizedErrors, suggestions);
    
    // Display report
    console.log('\n📋 ERROR BREAKDOWN BY CATEGORY:');
    console.log('-' .repeat(50));
    
    for (const [category, data] of Object.entries(report.by_category)) {
      console.log(`\n${category.toUpperCase().replace(/_/g, ' ')}: ${data.count} errors`);
      console.log(`  Affected files: ${data.files}`);
      
      // Show some examples
      const examples = data.errors.slice(0, 2);
      for (const example of examples) {
        console.log(`  Example: ${example.file}:${example.line} - ${example.message.substring(0, 60)}...`);
      }
    }
    
    console.log('\n🔧 FIX SUGGESTIONS:');
    console.log('-' .repeat(50));
    
    for (const suggestion of suggestions) {
      console.log(`\n${suggestion.category}: ${suggestion.count} errors`);
      console.log(`  ${suggestion.description}`);
      console.log('  Fixes:');
      for (const fix of suggestion.fixes) {
        console.log(`    - ${fix}`);
      }
    }
    
    console.log('\n📅 ACTION PLAN:');
    console.log('-' .repeat(50));
    
    for (const action of report.action_plan) {
      console.log(`\n${action.priority}. ${action.title} (${action.estimated_time})`);
      console.log(`   ${action.description}`);
      console.log(`   Files: ${action.files_affected}`);
    }
    
    const totalTime = report.action_plan.reduce((sum, action) => {
      const minutes = parseInt(action.estimated_time.match(/\d+/)[0]);
      return sum + minutes;
    }, 0);
    
    console.log(`\n⏱️ TOTAL ESTIMATED FIX TIME: ${totalTime} minutes (${Math.round(totalTime/60)} hours)`);
    console.log(`🔥 SEVERITY: ${report.summary.severity.toUpperCase()}`);
    
    return report;
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new TypeScriptAnalyzer();
  analyzer.runAnalysis()
    .then(report => {
      if (report.status === 'success') {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Analysis failed:', error);
      process.exit(1);
    });
}

module.exports = TypeScriptAnalyzer;