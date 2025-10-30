// routes/users.js
const express = require('express');
const router = express.Router();

// 🔥 КОРНЕВОЙ РОУТ ДЛЯ /api/users
router.get('/', (req, res) => {
  res.json({ 
    message: 'Users API is working!',
    availableEndpoints: [
      'GET /api/users/',
      'GET /api/users/freelancers',
      'GET /api/users/:id',
      'PATCH /api/users/profile'
    ]
  });
});

// Остальные роуты...
router.get('/freelancers', (req, res) => {
  res.json({ message: 'Freelancers list would be here' });
});

router.get('/test', (req, res) => {
  res.json({ message: 'Users routes are working!', timestamp: new Date() });
});

module.exports = router;