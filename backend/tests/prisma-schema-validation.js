/**
 * Prisma Schema Validation Script
 * Validates schema structure, relations, enums, and constraints
 * Author: Debugger Agent - Kamil Wilinski
 */

const fs = require('fs');
const path = require('path');

class PrismaSchemaValidator {
  constructor() {
    this.schemaPath = path.join(__dirname, '../prisma/schema.prisma');
    this.schema = fs.readFileSync(this.schemaPath, 'utf8');
    this.results = {
      structure: { status: 'not_tested', errors: [], details: {} },
      models: { status: 'not_tested', errors: [], details: {} },
      relations: { status: 'not_tested', errors: [], details: {} },
      enums: { status: 'not_tested', errors: [], details: {} },
      indexes: { status: 'not_tested', errors: [], details: {} }
    };
  }

  validateBasicStructure() {
    console.log('\n🔍 VALIDATING BASIC SCHEMA STRUCTURE...');
    
    const errors = [];
    const details = {};
    
    try {
      // Check generator
      const generatorMatch = this.schema.match(/generator\s+client\s*\{([^}]+)\}/);
      if (!generatorMatch) {
        errors.push('Generator client not found');
      } else {
        details.generator = generatorMatch[1].trim();
        console.log('✅ Generator client found');
      }
      
      // Check datasource
      const datasourceMatch = this.schema.match(/datasource\s+db\s*\{([^}]+)\}/);
      if (!datasourceMatch) {
        errors.push('Datasource db not found');
      } else {
        details.datasource = datasourceMatch[1].trim();
        console.log('✅ Datasource db found');
        
        // Check for PostgreSQL provider
        if (details.datasource.includes('provider = "postgresql"')) {
          console.log('✅ PostgreSQL provider configured');
        } else {
          errors.push('PostgreSQL provider not configured');
        }
        
        // Check for connection pooling
        if (details.datasource.includes('directUrl')) {
          console.log('✅ Connection pooling configured (directUrl found)');
        } else {
          console.log('⚠️ Connection pooling not configured (directUrl missing)');
        }
      }
      
      this.results.structure = {
        status: errors.length === 0 ? 'success' : 'failed',
        errors,
        details
      };
      
    } catch (error) {
      this.results.structure = {
        status: 'failed',
        errors: [error.message],
        details: {}
      };
    }
  }

  validateModels() {
    console.log('\n🔍 VALIDATING MODELS...');
    
    const errors = [];
    const details = {};
    
    try {
      // Extract all models
      const modelMatches = this.schema.matchAll(/model\s+(\w+)\s*\{([^}]+)\}/g);
      const models = [];
      
      for (const match of modelMatches) {
        const modelName = match[1];
        const modelBody = match[2];
        models.push({ name: modelName, body: modelBody });
      }
      
      details.total_models = models.length;
      details.models = models.map(m => m.name);
      
      console.log(`✅ Found ${models.length} models: ${models.map(m => m.name).join(', ')}`);
      
      // Expected models from design.md
      const expectedModels = [
        'User', 'Shop', 'UserShop', 'Product', 'ProductShopData',
        'Category', 'ProductCategory', 'ProductImage', 'SyncHistory',
        'ImageShopData', 'Job'
      ];
      
      const missingModels = expectedModels.filter(expected => 
        !models.some(model => model.name === expected)
      );
      
      if (missingModels.length > 0) {
        errors.push(`Missing models: ${missingModels.join(', ')}`);
      } else {
        console.log('✅ All expected models found');
      }
      
      // Validate model structure
      for (const model of models) {
        const modelErrors = this.validateModelStructure(model);
        if (modelErrors.length > 0) {
          errors.push(`${model.name}: ${modelErrors.join(', ')}`);
        }
      }
      
      this.results.models = {
        status: errors.length === 0 ? 'success' : 'failed',
        errors,
        details
      };
      
    } catch (error) {
      this.results.models = {
        status: 'failed',
        errors: [error.message],
        details: {}
      };
    }
  }

  validateModelStructure(model) {
    const errors = [];
    const { name, body } = model;
    
    // Check for required fields
    if (name !== 'UserShop' && name !== 'ProductCategory') {
      if (!body.includes('@id')) {
        errors.push('Missing @id field');
      }
      
      if (!body.includes('created_at') && name !== 'Job') {
        errors.push('Missing created_at field');
      }
      
      if (!body.includes('updated_at') && !['Job', 'SyncHistory', 'ProductImage'].includes(name)) {
        errors.push('Missing updated_at field');
      }
    }
    
    // Check for proper field types
    const idField = body.match(/(\w+)\s+Int\s+@id\s+@default\(autoincrement\(\)\)/);
    if (idField && idField[1] !== 'id') {
      errors.push(`ID field should be named 'id', found '${idField[1]}'`);
    }
    
    return errors;
  }

  validateRelations() {
    console.log('\n🔍 VALIDATING RELATIONS...');
    
    const errors = [];
    const details = {};
    
    try {
      // Extract all relations
      const relationMatches = this.schema.matchAll(/(\w+)\s+(\w+)(\[\])?\s+@relation\(([^)]+)\)/g);
      const relations = [];
      
      for (const match of relationMatches) {
        const field = match[1];
        const type = match[2];
        const isArray = match[3] === '[]';
        const relationConfig = match[4];
        
        relations.push({
          field,
          type,
          isArray,
          config: relationConfig
        });
      }
      
      details.total_relations = relations.length;
      console.log(`✅ Found ${relations.length} relations`);
      
      // Expected critical relations
      const expectedRelations = [
        { from: 'User', to: 'Product', via: 'created_products' },
        { from: 'User', to: 'Shop', via: 'created_shops' },
        { from: 'Product', to: 'ProductShopData', via: 'shop_data' },
        { from: 'Shop', to: 'ProductShopData', via: 'product_data' },
        { from: 'Product', to: 'ProductImage', via: 'images' },
        { from: 'ProductImage', to: 'ImageShopData', via: 'shop_data' },
      ];
      
      for (const expected of expectedRelations) {
        const found = this.schema.includes(`${expected.via}`) && 
                     this.schema.includes(`@relation`) &&
                     this.schema.includes(expected.to);
        
        if (!found) {
          errors.push(`Missing relation: ${expected.from}.${expected.via} -> ${expected.to}`);
        }
      }
      
      // Check for foreign key constraints
      const foreignKeyMatches = this.schema.matchAll(/fields:\s*\[([^\]]+)\],\s*references:\s*\[([^\]]+)\]/g);
      const foreignKeys = [];
      
      for (const match of foreignKeyMatches) {
        const fields = match[1].trim();
        const references = match[2].trim();
        foreignKeys.push({ fields, references });
      }
      
      details.foreign_keys = foreignKeys.length;
      console.log(`✅ Found ${foreignKeys.length} foreign key constraints`);
      
      // Check for cascade delete where appropriate
      const cascadeDeletes = (this.schema.match(/onDelete: Cascade/g) || []).length;
      details.cascade_deletes = cascadeDeletes;
      console.log(`✅ Found ${cascadeDeletes} cascade delete constraints`);
      
      this.results.relations = {
        status: errors.length === 0 ? 'success' : 'failed',
        errors,
        details
      };
      
    } catch (error) {
      this.results.relations = {
        status: 'failed',
        errors: [error.message],
        details: {}
      };
    }
  }

  validateEnums() {
    console.log('\n🔍 VALIDATING ENUMS...');
    
    const errors = [];
    const details = {};
    
    try {
      // Extract all enums
      const enumMatches = this.schema.matchAll(/enum\s+(\w+)\s*\{([^}]+)\}/g);
      const enums = [];
      
      for (const match of enumMatches) {
        const enumName = match[1];
        const enumBody = match[2];
        const values = enumBody.trim().split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));
        
        enums.push({ name: enumName, values });
      }
      
      details.total_enums = enums.length;
      details.enums = enums.map(e => ({ name: e.name, value_count: e.values.length }));
      
      console.log(`✅ Found ${enums.length} enums`);
      
      // Expected enums
      const expectedEnums = [
        'Role', 'OAuthProvider', 'ShopStatus', 'ProductStatus',
        'ProductShopStatus', 'SyncStatus', 'SyncAction', 'SyncResult',
        'JobType', 'JobStatus'
      ];
      
      const missingEnums = expectedEnums.filter(expected => 
        !enums.some(enumItem => enumItem.name === expected)
      );
      
      if (missingEnums.length > 0) {
        errors.push(`Missing enums: ${missingEnums.join(', ')}`);
      } else {
        console.log('✅ All expected enums found');
      }
      
      // Validate enum values
      for (const enumItem of enums) {
        console.log(`✅ ${enumItem.name}: ${enumItem.values.join(', ')}`);
        
        // Check for proper case (should be UPPERCASE)
        const invalidValues = enumItem.values.filter(value => value !== value.toUpperCase());
        if (invalidValues.length > 0) {
          errors.push(`${enumItem.name} has non-uppercase values: ${invalidValues.join(', ')}`);
        }
      }
      
      this.results.enums = {
        status: errors.length === 0 ? 'success' : 'failed',
        errors,
        details
      };
      
    } catch (error) {
      this.results.enums = {
        status: 'failed',
        errors: [error.message],
        details: {}
      };
    }
  }

  validateIndexes() {
    console.log('\n🔍 VALIDATING INDEXES...');
    
    const errors = [];
    const details = {};
    
    try {
      // Extract @@index declarations
      const indexMatches = this.schema.matchAll(/@@index\(\[([^\]]+)\](?:,\s*([^)]+))?\)/g);
      const indexes = [];
      
      for (const match of indexMatches) {
        const fields = match[1].trim();
        const options = match[2] || '';
        indexes.push({ fields, options });
      }
      
      details.total_indexes = indexes.length;
      console.log(`✅ Found ${indexes.length} indexes`);
      
      // Expected performance-critical indexes
      const expectedIndexes = [
        '[sku]', '[status]', '[product_id, shop_id]', '[sync_status]',
        '[shop_id, product_id]', '[shop_id, parent_id]', '[product_id, position]'
      ];
      
      for (const expected of expectedIndexes) {
        const found = indexes.some(index => index.fields.includes(expected.replace(/[\[\]]/g, '')));
        if (!found) {
          errors.push(`Missing critical index: ${expected}`);
        }
      }
      
      // Check for composite indexes
      const compositeIndexes = indexes.filter(index => index.fields.includes(','));
      details.composite_indexes = compositeIndexes.length;
      console.log(`✅ Found ${compositeIndexes.length} composite indexes`);
      
      // Check for unique constraints
      const uniqueMatches = this.schema.matchAll(/@@unique\(\[([^\]]+)\]\)/g);
      const uniqueConstraints = [];
      
      for (const match of uniqueMatches) {
        uniqueConstraints.push(match[1].trim());
      }
      
      details.unique_constraints = uniqueConstraints.length;
      console.log(`✅ Found ${uniqueConstraints.length} unique constraints`);
      
      this.results.indexes = {
        status: errors.length === 0 ? 'success' : 'failed',
        errors,
        details
      };
      
    } catch (error) {
      this.results.indexes = {
        status: 'failed',
        errors: [error.message],
        details: {}
      };
    }
  }

  async runAllValidations() {
    console.log('🚀 STARTING PRISMA SCHEMA VALIDATION...');
    console.log('=' .repeat(60));
    
    this.validateBasicStructure();
    this.validateModels();
    this.validateRelations();
    this.validateEnums();
    this.validateIndexes();
    
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('=' .repeat(60));
    
    const categories = Object.keys(this.results);
    const totalCategories = categories.length;
    const successfulCategories = categories.filter(cat => this.results[cat].status === 'success').length;
    const failedCategories = totalCategories - successfulCategories;
    
    console.log(`✅ Successful: ${successfulCategories}/${totalCategories}`);
    console.log(`❌ Failed: ${failedCategories}/${totalCategories}`);
    
    if (failedCategories > 0) {
      console.log('\n🔍 FAILED VALIDATIONS:');
      categories.forEach(category => {
        const result = this.results[category];
        if (result.status === 'failed') {
          console.log(`\n❌ ${category.toUpperCase()}:`);
          result.errors.forEach(error => console.log(`   - ${error}`));
        }
      });
    } else {
      console.log('\n🎉 ALL VALIDATIONS PASSED!');
    }
    
    return this.results;
  }
}

// Run validations if called directly
if (require.main === module) {
  const validator = new PrismaSchemaValidator();
  validator.runAllValidations()
    .then(results => {
      const allPassed = Object.values(results).every(r => r.status === 'success');
      process.exit(allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation runner failed:', error);
      process.exit(1);
    });
}

module.exports = PrismaSchemaValidator;