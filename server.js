const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./config/database');
const { User, Project, Message } = require('./models');

const app = express();

// 🔥 ВАЖНО: Эти middleware должны быть ПЕРВЫМИ!
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🔧 ОБНОВЛЕННЫЙ CORS - добавьте PATCH в методы
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // ДОБАВЬТЕ PATCH
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Явно обрабатываем preflight запросы
app.options('*', cors());

// Остальной код без изменений...
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Импорт роутов
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const userRoutes = require('./routes/users');

// Роуты API
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
// Health check
app.get('/api/health', async (req, res) => {
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
});

// Тестовый роут для проверки body
app.post('/api/test-body', (req, res) => {
  console.log('Test body received:', req.body);
  res.json({
    received: true,
    body: req.body,
    message: 'Body parsing is working!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('🚨 Error:', err.stack);
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});