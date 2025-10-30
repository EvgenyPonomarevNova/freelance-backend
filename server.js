// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sequelize } = require('./models');

class App {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security headers
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        error: 'Слишком много запросов с этого IP, попробуйте позже'
      }
    });
    this.app.use('/api/', limiter);

    // CORS
    this.app.use(cors({
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    this.app.options('*', cors());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    this.app.use(this.requestLogger);
  }

  requestLogger(req, res, next) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
  }

  setupRoutes() {
    // API Routes
    this.app.use('/api/auth', require('./routes/auth'));
    this.app.use('/api/projects', require('./routes/projects'));
    this.app.use('/api/users', require('./routes/users'));

    // Health check (без rate limiting)
    this.app.get('/api/health', this.healthCheck);
    
    // 404 handler
    this.app.use('*', this.notFoundHandler);
  }

  async healthCheck(req, res) {
    try {
      await sequelize.authenticate();
      res.json({
        status: 'OK',
        message: 'NexusHub Backend is running!',
        timestamp: new Date().toISOString(),
        database: 'Connected',
        environment: process.env.NODE_ENV
      });
    } catch (error) {
      res.status(500).json({
        status: 'Error',
        message: 'Database connection failed',
        error: error.message
      });
    }
  }

  notFoundHandler(req, res) {
    res.status(404).json({
      success: false,
      error: 'Route not found',
      path: req.originalUrl,
      method: req.method
    });
  }

  setupErrorHandling() {
    this.app.use(this.errorHandler);
  }

  errorHandler(err, req, res, next) {
    console.error('🚨 Error:', err.stack);

    const isProduction = process.env.NODE_ENV === 'production';
    
    res.status(err.status || 500).json({
      success: false,
      error: isProduction ? 'Internal server error' : err.message,
      ...(!isProduction && { stack: err.stack })
    });
  }

  async start() {
    try {
      await sequelize.authenticate();
      console.log('✅ PostgreSQL connected successfully');
      
      const PORT = process.env.PORT || 3001;
      
      this.app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
        console.log('🔒 Security features:');
        console.log('   - Helmet.js enabled');
        console.log('   - Rate limiting enabled (100 req/15min)');
        console.log('   - CORS configured');
        console.log('\n📡 Available endpoints:');
        console.log('   GET    /api/health');
        console.log('   POST   /api/auth/register');
        console.log('   POST   /api/auth/login');
        console.log('   GET    /api/projects');
        console.log('   POST   /api/projects');
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  console.error('🚨 Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Start the application
const app = new App();
app.start();