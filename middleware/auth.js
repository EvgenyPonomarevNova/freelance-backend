// middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    console.log('Authorization header:', req.headers.authorization);
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Не авторизован'
      });
    }

    console.log('Token:', token);
    
    // 🔥 ИСПРАВЛЕНИЕ: используем правильное поле из токена
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    // 🔥 ИСПРАВЛЕНИЕ: используем userId вместо id
    const user = await User.findByPk(decoded.userId || decoded.id);
    
    if (!user) {
      return res.status(401).json({
        status: 'error', 
        message: 'Пользователь не найден'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Error:', error.message);
    return res.status(401).json({
      status: 'error',
      message: 'Невалидный токен'
    });
  }
};