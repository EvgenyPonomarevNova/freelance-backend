import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Загружаем .env
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexushub';

console.log('🔗 Connecting to MongoDB...');

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('💡 Tip: Make sure MongoDB is running on your system');
  });

// Health check route
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  
  res.json({ 
    status: 'OK', 
    message: 'NexusHub Backend is running!',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    port: process.env.PORT
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working! 🎉',
    version: '1.0.0',
    endpoints: [
      '/api/health',
      '/api/test'
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test route: http://localhost:${PORT}/api/test`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});