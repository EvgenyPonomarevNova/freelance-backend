const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Импортируем роуты
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// Отладочный middleware
app.use((req, res, next) => {
  console.log('📨 Incoming request:', req.method, req.url);
  next();
});

// Подключение к MongoDB
console.log('🔄 Attempting to connect to MongoDB...');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ SUCCESS: Connected to MongoDB');
  console.log('📊 Database:', mongoose.connection.db.databaseName);
})
.catch((err) => {
  console.log('❌ FAILED to connect to MongoDB');
  console.log('Error:', err.message);
});

// Роуты - ТЕПЕРЬ ПОСЛЕ инициализации app
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);


const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);


// Health check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  
  res.json({
    status: 'OK',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Тестовый endpoint
app.post('/api/simple-register', (req, res) => {
  console.log('✅ Simple register endpoint called');
  res.json({
    message: 'Simple register works!',
    data: req.body
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
  console.log(`💼 Project routes: http://localhost:${PORT}/api/projects`);
});