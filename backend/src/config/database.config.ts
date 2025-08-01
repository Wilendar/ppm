/**
 * Database Configuration for PPM Backend
 * PostgreSQL, MySQL, and Redis connection settings
 */

import { Pool, PoolConfig } from 'pg';
import mysql from 'mysql2/promise';
import Redis from 'ioredis';

// PostgreSQL Configuration
export const postgresConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ppm_db',
  user: process.env.DB_USER || 'ppm_user',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  
  // Connection pool settings
  min: 5,
  max: 20,
  idleTimeoutMillis: 60000,
  
  // Additional settings
  application_name: 'ppm-backend',
  statement_timeout: 30000,
  query_timeout: 30000,
  connectionTimeoutMillis: 10000
};

// MySQL Configuration (for PrestaShop compatibility)
export const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'mysql_user',
  password: process.env.MYSQL_PASSWORD || 'password',
  database: process.env.MYSQL_DATABASE || 'prestashop_db',
  
  // Connection pool settings
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  connectionLimit: 10,
  queueLimit: 0,
  
  // Additional settings
  charset: 'utf8mb4',
  timezone: '+00:00',
  supportBigNumbers: true,
  bigNumberStrings: true,
  dateStrings: false
};

// Redis Configuration
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
  db: parseInt(process.env.REDIS_DB || '0'),
  
  // Connection settings
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  
  // Retry strategy
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  
  // Reconnect on error
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY';
    return err.message.includes(targetError);
  }
};

// Database Connection Classes
export class DatabaseManager {
  private static instance: DatabaseManager;
  private pgPool: Pool | null = null;
  private mysqlPool: mysql.Pool | null = null;
  private redisClient: Redis | null = null;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // PostgreSQL Connection
  public async getPostgresPool(): Promise<Pool> {
    if (!this.pgPool) {
      this.pgPool = new Pool(postgresConfig);
      
      // Test connection
      try {
        const client = await this.pgPool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('✅ PostgreSQL connected successfully');
      } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error);
        throw error;
      }

      // Handle pool errors
      this.pgPool.on('error', (err) => {
        console.error('PostgreSQL pool error:', err);
      });
    }
    
    return this.pgPool;
  }

  // MySQL Connection
  public async getMysqlPool(): Promise<mysql.Pool> {
    if (!this.mysqlPool) {
      this.mysqlPool = mysql.createPool(mysqlConfig);
      
      // Test connection
      try {
        const connection = await this.mysqlPool.getConnection();
        await connection.execute('SELECT 1');
        connection.release();
        console.log('✅ MySQL connected successfully');
      } catch (error) {
        console.error('❌ MySQL connection failed:', error);
        throw error;
      }
    }
    
    return this.mysqlPool;
  }

  // Redis Connection
  public async getRedisClient(): Promise<Redis> {
    if (!this.redisClient) {
      this.redisClient = new Redis(redisConfig);
      
      // Event handlers
      this.redisClient.on('connect', () => {
        console.log('✅ Redis connected successfully');
      });

      this.redisClient.on('ready', () => {
        console.log('✅ Redis ready for commands');
      });

      this.redisClient.on('error', (error) => {
        console.error('❌ Redis connection error:', error);
      });

      this.redisClient.on('close', () => {
        console.log('⚠️ Redis connection closed');
      });

      this.redisClient.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
      });

      // Test connection
      try {
        await this.redisClient.ping();
      } catch (error) {
        console.error('❌ Redis ping failed:', error);
        throw error;
      }
    }
    
    return this.redisClient;
  }

  // Health Check Methods
  public async checkPostgresHealth(): Promise<boolean> {
    try {
      if (!this.pgPool) return false;
      
      const client = await this.pgPool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error('PostgreSQL health check failed:', error);
      return false;
    }
  }

  public async checkMysqlHealth(): Promise<boolean> {
    try {
      if (!this.mysqlPool) return false;
      
      const connection = await this.mysqlPool.getConnection();
      await connection.execute('SELECT 1');
      connection.release();
      return true;
    } catch (error) {
      console.error('MySQL health check failed:', error);
      return false;
    }
  }

  public async checkRedisHealth(): Promise<boolean> {
    try {
      if (!this.redisClient) return false;
      
      const result = await this.redisClient.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  // Graceful Shutdown
  public async closeAllConnections(): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.pgPool) {
      promises.push(this.pgPool.end().then(() => {
        console.log('PostgreSQL pool closed');
        this.pgPool = null;
      }) as Promise<void>);
    }

    if (this.mysqlPool) {
      promises.push(this.mysqlPool.end().then(() => {
        console.log('MySQL pool closed');
        this.mysqlPool = null;
      }));
    }

    if (this.redisClient) {
      const disconnectPromise = new Promise<void>((resolve) => {
        this.redisClient!.disconnect();
        console.log('Redis connection closed');
        this.redisClient = null;
        resolve();
      });
      promises.push(disconnectPromise);
    }

    await Promise.all(promises);
  }

  // Connection Info
  public async getConnectionInfo() {
    const pgInfo = this.pgPool ? await this.getPostgresConnectionInfo() : null;
    const redisInfo = this.redisClient ? await this.getRedisConnectionInfo() : null;

    return {
      postgres: pgInfo,
      redis: redisInfo,
      mysql: this.mysqlPool ? { status: 'connected' } : { status: 'disconnected' }
    };
  }

  private async getPostgresConnectionInfo() {
    try {
      const client = await this.pgPool!.connect();
      const result = await client.query(`
        SELECT 
          count(*) as total_connections,
          count(*) filter (where state = 'active') as active_connections,
          count(*) filter (where state = 'idle') as idle_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);
      client.release();
      
      return {
        status: 'connected',
        pool_size: this.pgPool!.totalCount,
        idle_count: this.pgPool!.idleCount,
        waiting_count: this.pgPool!.waitingCount,
        database_connections: result.rows[0]
      };
    } catch (error) {
      return { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async getRedisConnectionInfo() {
    try {
      const info = await this.redisClient!.info('server');
      const memoryInfo = await this.redisClient!.info('memory');
      
      return {
        status: 'connected',
        server_info: info,
        memory_info: memoryInfo
      };
    } catch (error) {
      return { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Export singleton instance
export const dbManager = DatabaseManager.getInstance();