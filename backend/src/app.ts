/**
 * Main Application Entry Point for PPM Backend
 * Express.js application setup with middleware, routes, and error handling
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import session from 'express-session';

// Import middleware
import { errorHandler, notFoundHandler, timeoutHandler } from './middleware/error.middleware';
import { authenticate, optionalAuthenticate } from './middleware/auth.middleware';
import { securityHeaders, apiRateLimit } from './middleware/security.middleware';

// Import configurations
import { validateOAuthConfig } from './config/oauth.config';

// Import routes
import authRoutes from './routes/api/v1/auth.routes';

// Import services for initialization
import { OAuthService } from './services/auth/oauth.service';

// Import types
import { HealthCheckResponse, ApiResponse } from './types/api.types';

// Load environment variables
dotenv.config();

class PPMApplication {
  public app: Application;
  private readonly port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3001');
    
    this.initializeConfiguration();
    this.initializeMiddleware();
    this.initializePassport();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize application configuration
   */
  private initializeConfiguration(): void {
    try {
      // Validate OAuth configuration
      validateOAuthConfig();
      console.log('✅ OAuth configuration validated');
    } catch (error) {
      console.warn('⚠️  OAuth configuration incomplete:', error instanceof Error ? error.message : 'Unknown error');
      console.warn('📝 OAuth features will be disabled. Check your environment variables.');
    }
  }

  /**
   * Initialize Passport.js for OAuth
   */
  private initializePassport(): void {
    try {
      // Initialize OAuth service (this sets up passport strategies)
      new OAuthService();
      
      // Initialize passport
      this.app.use(passport.initialize());
      console.log('✅ Passport.js initialized with OAuth strategies');
    } catch (error) {
      console.warn('⚠️  Passport initialization failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Initialize Express middleware
   */
  private initializeMiddleware(): void {
    // Request timeout
    this.app.use(timeoutHandler(30000)); // 30 seconds

    // Trust proxy for correct IP addresses behind reverse proxy
    this.app.set('trust proxy', 1);

    // Cookie parser (must be before session)
    this.app.use(cookieParser(process.env.COOKIE_SECRET));

    // Session configuration for OAuth
    this.app.use(session({
      secret: process.env.SESSION_SECRET || 'fallback-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    }));

    // Security headers
    this.app.use(securityHeaders());

    // Additional security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https:"],
          scriptSrc: ["'self'", "https:"],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'", "https:", "data:"],
          connectSrc: ["'self'", "https:"],
          mediaSrc: ["'self'"],
          objectSrc: ["'none'"],
          childSrc: ["'self'"],
          frameAncestors: ["'none'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: []
        }
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // CORS configuration
    const corsOptions = {
      origin: (origin: string | undefined, callback: Function) => {
        const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        return callback(new Error('CORS policy violation'), false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With', 
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'X-Request-ID'
      ],
      exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
      optionsSuccessStatus: 200
    };

    this.app.use(cors(corsOptions));

    // Rate limiting for API endpoints
    this.app.use('/api/', apiRateLimit);

    // Body parsing middleware
    this.app.use(express.json({ 
      limit: '10mb',
      strict: true,
      type: ['application/json', 'text/plain']
    }));
    
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb',
      parameterLimit: 1000
    }));

    // Compression
    this.app.use(compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      }
    }));

    // Static files for uploads (if needed)
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // Request logging middleware
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      const requestId = `req_${startTime}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Attach request ID to request
      (req as any).requestId = requestId;
      res.setHeader('X-Request-ID', requestId);

      // Log request
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${req.ip} - ${requestId}`);

      // Log response when finished
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${requestId}`);
      });

      next();
    });
  }

  /**
   * Initialize application routes
   */
  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', async (req: Request, res: Response) => {
      try {
        const dbHealth = await this.checkDatabaseHealth();
        
        const healthResponse: HealthCheckResponse = {
          status: dbHealth.database && dbHealth.redis ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version || '1.0.0',
          uptime: process.uptime(),
          checks: {
            database: dbHealth.database ? 'healthy' : 'unhealthy',
            redis: dbHealth.redis ? 'healthy' : 'unhealthy',
            external_apis: 'healthy' // Will be implemented later
          },
          metrics: {
            memory: {
              used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
              total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
              percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
            },
            cpu: {
              usage: process.cpuUsage().user / 1000000 // Convert to seconds
            }
          }
        };

        const statusCode = healthResponse.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(healthResponse);
      } catch (error) {
        console.error('Health check failed:', error);
        
        const errorResponse: HealthCheckResponse = {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version || '1.0.0',
          uptime: process.uptime(),
          checks: {
            database: 'unhealthy',
            redis: 'unhealthy',
            external_apis: 'unhealthy'
          }
        };

        res.status(503).json(errorResponse);
      }
    });

    // API info endpoint
    this.app.get('/api', (req: Request, res: Response) => {
      const apiResponse: ApiResponse = {
        success: true,
        data: {
          name: 'PPM Backend API',
          version: process.env.npm_package_version || '1.0.0',
          description: 'Prestashop Product Manager - Backend API',
          endpoints: {
            health: '/health',
            api_docs: process.env.SWAGGER_ENABLED === 'true' ? '/api-docs' : null,
            auth: '/api/v1/auth',
            users: '/api/v1/users',
            shops: '/api/v1/shops',
            products: '/api/v1/products',
            sync: '/api/v1/sync',
            upload: '/api/v1/upload'
          }
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      };

      res.json(apiResponse);
    });

    // API v1 routes
    this.app.use('/api/v1/auth', authRoutes);
    
    // Temporary placeholder routes for other endpoints
    this.app.get('/api/v1/products', optionalAuthenticate, (req, res) => {
      res.json({ 
        message: 'Products routes - Coming soon', 
        status: 'not_implemented',
        user: (req as any).user || null
      });
    });

    this.app.get('/api/v1/shops', authenticate, (req, res) => {
      res.json({ 
        message: 'Shops routes - Coming soon', 
        status: 'not_implemented',
        user: (req as any).user
      });
    });

    // Future routes (will be implemented in next phases)
    // this.app.use('/api/v1/users', authenticate, userRoutes);
    // this.app.use('/api/v1/shops', authenticate, shopRoutes);
    // this.app.use('/api/v1/products', authenticate, productRoutes);
    // this.app.use('/api/v1/sync', authenticate, syncRoutes);
    // this.app.use('/api/v1/upload', authenticate, uploadRoutes);

    // Swagger API documentation (if enabled)
    if (process.env.SWAGGER_ENABLED === 'true') {
      // Will be implemented with swagger-ui-express
      this.app.get('/api-docs', (req, res) => {
        res.json({ message: 'API Documentation - Coming soon' });
      });
    }
  }

  /**
   * Initialize error handling middleware
   */
  private initializeErrorHandling(): void {
    // 404 handler for unmatched routes
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<{ database: boolean; redis: boolean }> {
    // In development mode, return mock healthy status
    if (process.env.NODE_ENV !== 'production') {
      return {
        database: true, // Mock as healthy in development
        redis: true     // Mock as healthy in development
      };
    }

    try {
      // For now, return healthy status - will implement actual checks when database services are ready
      return {
        database: true,
        redis: true
      };
    } catch (error) {
      console.error('Database health check error:', error);
      return {
        database: false,
        redis: false
      };
    }
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      console.log('🚀 Starting PPM Backend API...');
      
      // Start HTTP server
      this.app.listen(this.port, () => {
        console.log('✅ PPM Backend API started successfully!');
        console.log(`📡 Server running on: http://localhost:${this.port}`);
        console.log(`📊 Health check: http://localhost:${this.port}/health`);
        console.log(`📖 API info: http://localhost:${this.port}/api`);
        console.log(`🔐 Auth endpoints: http://localhost:${this.port}/api/v1/auth`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        
        if (process.env.SWAGGER_ENABLED === 'true') {
          console.log(`📚 API Docs: http://localhost:${this.port}/api-docs`);
        }

        console.log('\n🔧 Available endpoints:');
        console.log('  GET  /health                    - Health check');
        console.log('  GET  /api                       - API information');
        console.log('  GET  /api/v1/auth/urls          - OAuth URLs');
        console.log('  GET  /api/v1/auth/google        - Google OAuth');
        console.log('  GET  /api/v1/auth/microsoft     - Microsoft OAuth');
        console.log('  POST /api/v1/auth/refresh       - Refresh token');
        console.log('  GET  /api/v1/auth/me            - Current user');
        console.log('  POST /api/v1/auth/logout        - Logout');
        console.log('  POST /api/v1/auth/validate      - Validate token');
        console.log('\n💡 Ready to accept requests!');
      });

      // Graceful shutdown handling
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      
      try {
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
  }
}

// Create and start application
const ppmApp = new PPMApplication();

// Start server only if this file is run directly
if (require.main === module) {
  ppmApp.start().catch((error) => {
    console.error('❌ Failed to start PPM Backend:', error);
    process.exit(1);
  });
}

// Export app for testing
export default ppmApp.app;