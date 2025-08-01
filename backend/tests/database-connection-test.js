/**
 * Database Connection Test Script
 * Comprehensive testing of all database connections for PPM
 * Author: Debugger Agent - Kamil Wilinski
 */

const { Pool } = require('pg');
const mysql = require('mysql2/promise');
const Redis = require('ioredis');

// Test configurations (from docker-compose.yml)
const testConfigs = {
  postgres: {
    host: 'localhost',
    port: 5432,
    database: 'ppm_db',
    user: 'ppm_user',
    password: 'ppm_password',
    application_name: 'ppm-connection-test',
    statement_timeout: 10000,
    query_timeout: 10000,
    connectionTimeoutMillis: 5000
  },
  
  mysql: {
    host: 'localhost',
    port: 3306,
    user: 'ppm_mysql_user',
    password: 'ppm_mysql_password',
    database: 'ppm_prestashop',
    charset: 'utf8mb4',
    timezone: '+00:00',
    // Fixed: removed invalid options for mysql2 Connection
    connectionLimit: 10,
    queueLimit: 0
  },
  
  redis: {
    host: 'localhost',
    port: 6379,
    password: 'redis_password',
    db: 0,
    connectTimeout: 5000,
    commandTimeout: 3000,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true
  }
};

class DatabaseTester {
  constructor() {
    this.results = {
      postgres: { status: 'not_tested', errors: [], details: {} },
      mysql: { status: 'not_tested', errors: [], details: {} },
      redis: { status: 'not_tested', errors: [], details: {} }
    };
  }

  async testPostgresConnection() {
    console.log('\n🔍 TESTING POSTGRESQL CONNECTION...');
    
    try {
      const pool = new Pool(testConfigs.postgres);
      
      // Test basic connection
      const client = await pool.connect();
      console.log('✅ PostgreSQL connection established');
      
      // Test basic query
      const versionResult = await client.query('SELECT version()');
      console.log('✅ PostgreSQL version query successful');
      console.log(`   Version: ${versionResult.rows[0].version.substring(0, 50)}...`);
      
      // Test database exists
      const dbResult = await client.query('SELECT current_database()');
      console.log(`✅ Connected to database: ${dbResult.rows[0].current_database}`);
      
      // Test connection pool info
      const poolInfo = await client.query(`
        SELECT 
          count(*) as total_connections,
          count(*) filter (where state = 'active') as active_connections,
          count(*) filter (where state = 'idle') as idle_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);
      
      console.log('✅ Connection pool information retrieved');
      console.log(`   Total connections: ${poolInfo.rows[0].total_connections}`);
      console.log(`   Active connections: ${poolInfo.rows[0].active_connections}`);
      console.log(`   Idle connections: ${poolInfo.rows[0].idle_connections}`);
      
      // Test encoding and collation
      const encodingResult = await client.query(`
        SELECT 
          pg_encoding_to_char(encoding) as encoding,
          datcollate as collate,
          datctype as ctype
        FROM pg_database 
        WHERE datname = current_database()
      `);
      
      console.log('✅ Database encoding and collation checked');
      console.log(`   Encoding: ${encodingResult.rows[0].encoding}`);
      console.log(`   Collate: ${encodingResult.rows[0].collate}`);
      console.log(`   Ctype: ${encodingResult.rows[0].ctype}`);
      
      client.release();
      await pool.end();
      
      this.results.postgres = {
        status: 'success',
        errors: [],
        details: {
          version: versionResult.rows[0].version,
          database: dbResult.rows[0].current_database,
          encoding: encodingResult.rows[0].encoding,
          collate: encodingResult.rows[0].collate,
          pool_info: poolInfo.rows[0]
        }
      };
      
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error.message);
      this.results.postgres = {
        status: 'failed',
        errors: [error.message],
        details: { error_code: error.code, error_detail: error.detail }
      };
    }
  }

  async testMysqlConnection() {
    console.log('\n🔍 TESTING MYSQL CONNECTION...');
    
    try {
      const pool = mysql.createPool(testConfigs.mysql);
      
      // Test basic connection
      const connection = await pool.getConnection();
      console.log('✅ MySQL connection established');
      
      // Test basic query
      const [versionRows] = await connection.execute('SELECT VERSION() as version');
      console.log('✅ MySQL version query successful');
      console.log(`   Version: ${versionRows[0].version}`);
      
      // Test database and character set
      const [dbRows] = await connection.execute('SELECT DATABASE() as db_name');
      const [charsetRows] = await connection.execute(`
        SELECT 
          @@character_set_database as charset,
          @@collation_database as collation,
          @@sql_mode as sql_mode
      `);
      
      console.log(`✅ Connected to database: ${dbRows[0].db_name}`);
      console.log(`✅ Character set: ${charsetRows[0].charset}`);
      console.log(`✅ Collation: ${charsetRows[0].collation}`);
      console.log(`✅ SQL Mode: ${charsetRows[0].sql_mode}`);
      
      // Test connection limits
      const [processRows] = await connection.execute(`
        SELECT 
          COUNT(*) as total_connections,
          SUM(CASE WHEN COMMAND != 'Sleep' THEN 1 ELSE 0 END) as active_connections,
          @@max_connections as max_connections
        FROM INFORMATION_SCHEMA.PROCESSLIST
      `);
      
      console.log('✅ Connection information retrieved');
      console.log(`   Total connections: ${processRows[0].total_connections}`);
      console.log(`   Active connections: ${processRows[0].active_connections}`);
      console.log(`   Max connections: ${processRows[0].max_connections}`);
      
      // Test Polish characters support
      const [polishTest] = await connection.execute(`
        SELECT 'Testowanie polskich znaków: ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ' as polish_test
      `);
      console.log('✅ Polish characters test successful');
      console.log(`   Polish test: ${polishTest[0].polish_test}`);
      
      connection.release();
      await pool.end();
      
      this.results.mysql = {
        status: 'success',
        errors: [],
        details: {
          version: versionRows[0].version,
          database: dbRows[0].db_name,
          charset: charsetRows[0].charset,
          collation: charsetRows[0].collation,
          sql_mode: charsetRows[0].sql_mode,
          connection_info: processRows[0],
          polish_support: polishTest[0].polish_test
        }
      };
      
    } catch (error) {
      console.error('❌ MySQL connection failed:', error.message);
      this.results.mysql = {
        status: 'failed',
        errors: [error.message],
        details: { error_code: error.code, error_errno: error.errno }
      };
    }
  }

  async testRedisConnection() {
    console.log('\n🔍 TESTING REDIS CONNECTION...');
    
    try {
      const redis = new Redis(testConfigs.redis);
      
      // Test basic connection
      const pong = await redis.ping();
      console.log(`✅ Redis connection established: ${pong}`);
      
      // Test basic operations
      await redis.set('test_key', 'test_value', 'EX', 10);
      const value = await redis.get('test_key');
      console.log(`✅ Redis SET/GET test successful: ${value}`);
      
      // Test server info
      const serverInfo = await redis.info('server');
      const memoryInfo = await redis.info('memory');
      const clientsInfo = await redis.info('clients');
      
      console.log('✅ Redis server information retrieved');
      
      // Parse server info
      const serverLines = serverInfo.split('\r\n');
      const versionLine = serverLines.find(line => line.startsWith('redis_version:'));
      const uptimeLine = serverLines.find(line => line.startsWith('uptime_in_seconds:'));
      
      if (versionLine) console.log(`   Redis version: ${versionLine.split(':')[1]}`);
      if (uptimeLine) console.log(`   Uptime: ${uptimeLine.split(':')[1]} seconds`);
      
      // Parse memory info
      const memoryLines = memoryInfo.split('\r\n');
      const usedMemoryLine = memoryLines.find(line => line.startsWith('used_memory_human:'));
      const maxMemoryLine = memoryLines.find(line => line.startsWith('maxmemory_human:'));
      
      if (usedMemoryLine) console.log(`   Used memory: ${usedMemoryLine.split(':')[1]}`);
      if (maxMemoryLine) console.log(`   Max memory: ${maxMemoryLine.split(':')[1]}`);
      
      // Test Polish characters
      await redis.set('polish_test', 'Testowanie polskich znaków: ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ', 'EX', 10);
      const polishValue = await redis.get('polish_test');
      console.log('✅ Polish characters test successful');
      console.log(`   Polish test: ${polishValue}`);
      
      // Test hash operations
      await redis.hset('test_hash', 'field1', 'value1', 'field2', 'value2');
      const hashValue = await redis.hgetall('test_hash');
      console.log('✅ Redis HASH operations test successful');
      
      // Test list operations
      await redis.lpush('test_list', 'item1', 'item2', 'item3');
      const listLength = await redis.llen('test_list');
      console.log(`✅ Redis LIST operations test successful: ${listLength} items`);
      
      // Clean up test data
      await redis.del('test_key', 'polish_test', 'test_hash', 'test_list');
      console.log('✅ Test data cleaned up');
      
      redis.disconnect();
      
      this.results.redis = {
        status: 'success',
        errors: [],
        details: {
          server_info: serverInfo,
          memory_info: memoryInfo,
          clients_info: clientsInfo,
          polish_support: polishValue,
          operations_tested: ['SET/GET', 'HASH', 'LIST', 'EXPIRE']
        }
      };
      
    } catch (error) {
      console.error('❌ Redis connection failed:', error.message);
      this.results.redis = {
        status: 'failed',
        errors: [error.message],
        details: { error_code: error.code, error_name: error.name }
      };
    }
  }

  async runAllTests() {
    console.log('🚀 STARTING DATABASE CONNECTION TESTS...');
    console.log('=' .repeat(60));
    
    await this.testPostgresConnection();
    await this.testMysqlConnection();
    await this.testRedisConnection();
    
    console.log('\n📊 TEST SUMMARY');
    console.log('=' .repeat(60));
    
    const totalTests = 3;
    const successfulTests = Object.values(this.results).filter(r => r.status === 'success').length;
    const failedTests = totalTests - successfulTests;
    
    console.log(`✅ Successful: ${successfulTests}/${totalTests}`);
    console.log(`❌ Failed: ${failedTests}/${totalTests}`);
    
    if (failedTests > 0) {
      console.log('\n🔍 FAILED TESTS DETAILS:');
      Object.entries(this.results).forEach(([db, result]) => {
        if (result.status === 'failed') {
          console.log(`\n❌ ${db.toUpperCase()}:`);
          result.errors.forEach(error => console.log(`   - ${error}`));
        }
      });
    }
    
    return this.results;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new DatabaseTester();
  tester.runAllTests()
    .then(results => {
      const allPassed = Object.values(results).every(r => r.status === 'success');
      process.exit(allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = DatabaseTester;