/**
 * Simple PPM Backend API for testing
 * Basic Express.js server to test authentication system
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');

const app = express();
const port = process.env.PORT || 3001;

// Trust proxy for correct IP addresses
app.set('trust proxy', 1);

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Initialize passport
app.use(passport.initialize());

// Basic logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'PPM Backend API',
      version: '1.0.0',
      description: 'Prestashop Product Manager - Backend API',
      endpoints: {
        health: '/health',
        api_info: '/api',
        auth: '/api/v1/auth',
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Authentication routes placeholder
app.get('/api/v1/auth', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication system ready',
    data: {
      providers: ['google', 'microsoft'],
      endpoints: {
        google: '/api/v1/auth/google',
        microsoft: '/api/v1/auth/microsoft',
        refresh: '/api/v1/auth/refresh',
        me: '/api/v1/auth/me',
        logout: '/api/v1/auth/logout'
      }
    }
  });
});

// OAuth URLs endpoint
app.get('/api/v1/auth/urls', (req, res) => {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
  
  res.json({
    success: true,
    data: {
      google: `${baseUrl}/api/v1/auth/google`,
      microsoft: `${baseUrl}/api/v1/auth/microsoft`
    },
    message: 'OAuth URLs generated successfully'
  });
});

// Mock OAuth endpoints
app.get('/api/v1/auth/google', (req, res) => {
  res.json({
    success: false,
    message: 'OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file',
    redirect_to: 'https://console.cloud.google.com/'
  });
});

app.get('/api/v1/auth/microsoft', (req, res) => {
  res.json({
    success: false,
    message: 'OAuth not configured. Please set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in .env file',
    redirect_to: 'https://portal.azure.com/'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR: ${error.message}`);
  
  res.status(error.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  console.log('🚀 PPM Backend API (Simple) started successfully!');
  console.log(`📡 Server running on: http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`📖 API info: http://localhost:${port}/api`);
  console.log(`🔐 Auth endpoints: http://localhost:${port}/api/v1/auth`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  console.log('\n🔧 Available endpoints:');
  console.log('  GET  /health                    - Health check');
  console.log('  GET  /api                       - API information');
  console.log('  GET  /api/v1/auth               - Auth system info');
  console.log('  GET  /api/v1/auth/urls          - OAuth URLs');
  console.log('  GET  /api/v1/auth/google        - Google OAuth (placeholder)');
  console.log('  GET  /api/v1/auth/microsoft     - Microsoft OAuth (placeholder)');
  console.log('\n💡 Ready to accept requests!');
  console.log('\n⚠️  Note: This is a simplified version for testing.');
  console.log('    Full TypeScript version is available but needs OAuth configuration.');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

module.exports = app;