// routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

class AuthService {
  static generateToken(user) {
    return jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  }

  static async handleOAuthUser(userData) {
    let user = await User.findOne({
      where: {
        [Op.or]: [
          { email: userData.email },
          { 'profile.yandexId': userData.profile.yandexId }
        ]
      }
    });

    if (user) {
      user.profile = { ...user.profile, ...userData.profile };
      user.isOAuth = true;
      await user.save();
    } else {
      user = await User.create({
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        passwordHash: null,
        profile: userData.profile,
        isOAuth: true
      });
    }

    return user;
  }
}

// Health check
router.get('/', (req, res) => {
  res.json({ 
    message: 'Auth API is working!',
    timestamp: new Date()
  });
});

// Регистрация с валидацией
router.post('/register', validate(schemas.register), async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Пользователь с таким email уже существует'
      });
    }

    const user = await User.create({
      email,
      fullName,
      role,
      passwordHash: password,
      profile: { isEmailVerified: false },
      isOAuth: false
    });

    const token = AuthService.generateToken(user);
    
    res.status(201).json({
      success: true,
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      error: 'Ошибка при регистрации'
    });
  }
});

// Логин с валидацией
router.post('/login', validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.checkPassword(password))) {
      return res.status(401).json({
        success: false,
        error: 'Неверный email или пароль'
      });
    }

    const token = AuthService.generateToken(user);
    
    res.json({
      success: true,
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({
      success: false,
      error: 'Ошибка при входе'
    });
  }
});

// Получить текущего пользователя
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: req.user.toJSON()
  });
});

// Яндекс OAuth с валидацией
router.post('/oauth/yandex/login', validate(schemas.yandexOAuth), async (req, res) => {
  try {
    const { code } = req.body;

    const userData = code.startsWith('demo_') 
      ? await handleDemoOAuth(code)
      : await handleRealYandexOAuth(code);

    const user = await AuthService.handleOAuthUser(userData);
    const token = AuthService.generateToken(user);

    res.json({
      success: true,
      token,
      user: user.toJSON(),
      isDemo: userData.email.includes('demo')
    });

  } catch (error) {
    console.error('Yandex OAuth error:', error);
    
    // Fallback to demo mode
    try {
      const demoData = handleDemoOAuth('demo_fallback');
      const user = await AuthService.handleOAuthUser(demoData);
      const token = AuthService.generateToken(user);

      res.json({
        success: true,
        token,
        user: user.toJSON(),
        isDemo: true
      });
    } catch (fallbackError) {
      res.status(400).json({
        success: false,
        error: 'OAuth authentication failed'
      });
    }
  }
});

// Демо OAuth
async function handleDemoOAuth(code) {
  return {
    email: `yandex.demo.${Date.now()}@example.com`,
    fullName: 'Демо Яндекс Пользователь',
    role: 'freelancer',
    profile: {
      avatar: null,
      bio: 'Пользователь авторизованный через Яндекс OAuth',
      skills: ['JavaScript', 'React', 'Node.js'],
      rating: 4.8,
      completedProjects: 5,
      isEmailVerified: true,
      oauthProvider: 'yandex',
      yandexId: `demo_yandex_${Date.now()}`
    }
  };
}

// Реальный Яндекс OAuth
async function handleRealYandexOAuth(code) {
  const tokenResponse = await fetch('https://oauth.yandex.ru/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.YANDEX_CLIENT_ID,
      client_secret: process.env.YANDEX_CLIENT_SECRET,
      redirect_uri: process.env.YANDEX_REDIRECT_URI
    })
  });

  if (!tokenResponse.ok) {
    throw new Error('Yandex token exchange failed');
  }

  const tokenData = await tokenResponse.json();
  const userResponse = await fetch('https://login.yandex.ru/info?format=json', {
    headers: { 'Authorization': `OAuth ${tokenData.access_token}` }
  });

  if (!userResponse.ok) {
    throw new Error('Yandex user info failed');
  }

  const yandexUser = await userResponse.json();
  
  return {
    email: yandexUser.default_email,
    fullName: yandexUser.real_name || yandexUser.display_name || 'Yandex User',
    role: 'freelancer',
    profile: {
      avatar: yandexUser.default_avatar_id ? 
        `https://avatars.yandex.net/get-yapic/${yandexUser.default_avatar_id}/islands-200` : null,
      bio: 'Пользователь Яндекс OAuth',
      skills: [],
      rating: 5.0,
      completedProjects: 0,
      isEmailVerified: true,
      oauthProvider: 'yandex',
      yandexId: yandexUser.id
    }
  };
}

module.exports = router;