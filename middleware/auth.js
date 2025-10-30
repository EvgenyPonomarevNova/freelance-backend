// middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

class AuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.status = status;
    this.name = 'AuthError';
  }
}

exports.protect = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      throw new AuthError('Требуется авторизация');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      throw new AuthError('Пользователь не найден');
    }

    if (!user.isActive) {
      throw new AuthError('Аккаунт деактивирован', 403);
    }

    req.user = user;
    next();
    
  } catch (error) {
    const status = error.status || 401;
    const message = error.name === 'JsonWebTokenError' ? 'Невалидный токен' : error.message;
    
    res.status(status).json({
      success: false,
      error: message
    });
  }
};

exports.optional = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Недостаточно прав'
      });
    }
    next();
  };
};

function extractToken(req) {
  const authHeader = req.headers.authorization;
  return authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
}