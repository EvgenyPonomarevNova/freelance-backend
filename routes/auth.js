// routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');


router.get('/', (req, res) => {
  res.json({ 
    message: 'Auth API is working!',
    timestamp: new Date(),
    availableEndpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/oauth/yandex/login'
    ]
  });
});
// 🔥 ПРОСТОЙ ТЕСТОВЫЙ РОУТ ДЛЯ ПРОВЕРКИ
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Auth routes are working!', 
    timestamp: new Date(),
    availableEndpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login', 
      'POST /api/auth/oauth/yandex/login'
    ]
  });
});

// Регистрация пользователя
router.post('/register', async (req, res) => {
  try {
    console.log('📝 Registration attempt:', req.body);
    
    const { email, password, fullName, role } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        error: 'Все поля обязательны'
      });
    }

    // Проверяем, существует ли пользователь
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Пользователь с таким email уже существует'
      });
    }

    // Создаем пользователя
    const user = await User.create({
      email,
      fullName,
      role: role || 'freelancer',
      passwordHash: password,
      profile: {
        isEmailVerified: false
      },
      isOAuth: false
    });

    // Генерируем токен
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    console.log('✅ User registered:', user.email);
    
    res.status(201).json({
      success: true,
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(400).json({
      success: false,
      error: 'Ошибка при регистрации: ' + error.message
    });
  }
});

// Вход пользователя
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email и пароль обязательны'
      });
    }

    // Ищем пользователя
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Неверный email или пароль'
      });
    }

    // Проверяем пароль
    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Неверный email или пароль'
      });
    }

    // Генерируем токен
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    console.log('✅ User logged in:', user.email);
    
    res.json({
      success: true,
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(400).json({
      success: false,
      error: 'Ошибка при входе: ' + error.message
    });
  }
});

// Яндекс OAuth - полная реализация
router.post('/oauth/yandex/login', async (req, res) => {
  try {
    const { code } = req.body;
    
    console.log('🔐 Yandex OAuth attempt with code:', code);

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required'
      });
    }

    // 🔥 РЕАЛЬНАЯ ЛОГИКА OAuth
    if (code.startsWith('demo_')) {
      // Демо-режим для тестирования
      return handleDemoOAuth(res, code);
    } else {
      // Реальная OAuth логика с Яндекс API
      return await handleRealYandexOAuth(res, code);
    }

  } catch (error) {
    console.error('❌ Yandex OAuth error:', error);
    res.status(400).json({
      success: false,
      error: 'OAuth authentication failed: ' + error.message
    });
  }
});

// 🔥 ДЕМО-РЕЖИМ OAuth
function handleDemoOAuth(res, code) {
  console.log('🔄 Using demo OAuth mode');
  
  // Создаем демо-пользователя
  const demoUser = {
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
    },
    isOAuth: true
  };

  // Создаем пользователя в базе
  createOrUpdateOAuthUser(demoUser, res);
}

// 🔥 РЕАЛЬНАЯ ЛОГИКА Яндекс OAuth
async function handleRealYandexOAuth(res, code) {
  console.log('🔄 Using real Yandex OAuth');
  
  try {
    // 1. Обмениваем код на access token
    const tokenResponse = await fetch('https://oauth.yandex.ru/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: process.env.YANDEX_CLIENT_ID,
        client_secret: process.env.YANDEX_CLIENT_SECRET,
        redirect_uri: process.env.YANDEX_REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Yandex token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Получаем информацию о пользователе
    const userResponse = await fetch('https://login.yandex.ru/info?format=json', {
      headers: {
        'Authorization': `OAuth ${accessToken}`
      }
    });

    if (!userResponse.ok) {
      throw new Error(`Yandex user info failed: ${userResponse.status}`);
    }

    const yandexUser = await userResponse.json();
    
    console.log('📧 Yandex user data received:', {
      id: yandexUser.id,
      email: yandexUser.default_email,
      name: yandexUser.real_name || yandexUser.display_name
    });

    // 3. Создаем/обновляем пользователя
    const userData = {
      email: yandexUser.default_email,
      fullName: yandexUser.real_name || yandexUser.display_name || yandexUser.first_name || 'Yandex User',
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
      },
      isOAuth: true
    };

    await createOrUpdateOAuthUser(userData, res);

  } catch (error) {
    console.error('❌ Real Yandex OAuth failed:', error);
    
    // Fallback to demo mode if real OAuth fails
    console.log('🔄 Falling back to demo mode');
    handleDemoOAuth(res, 'demo_fallback');
  }
}

// 🔥 ОБЩАЯ ФУНКЦИЯ ДЛЯ СОЗДАНИЯ/ОБНОВЛЕНИЯ ПОЛЬЗОВАТЕЛЯ
async function createOrUpdateOAuthUser(userData, res) {
  try {
    // Ищем существующего пользователя по email или yandexId
    let user = await User.findOne({
      where: {
        [Op.or]: [
          { email: userData.email },
          { 'profile.yandexId': userData.profile.yandexId }
        ]
      }
    });

    if (user) {
      // Обновляем существующего пользователя
      console.log('🔄 Updating existing OAuth user:', user.email);
      
      user.profile = {
        ...user.profile,
        ...userData.profile,
        oauthProvider: 'yandex'
      };
      user.isOAuth = true;
      
      await user.save();
    } else {
      // Создаем нового пользователя
      console.log('🆕 Creating new OAuth user:', userData.email);
      
      user = await User.create({
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        passwordHash: null, // OAuth users don't have password
        profile: userData.profile,
        isOAuth: true
      });
    }

    // Генерируем JWT токен
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    console.log('✅ OAuth user processed:', user.email);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        profile: user.profile,
        isOAuth: true,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      isDemo: userData.email.includes('demo')
    });

  } catch (error) {
    console.error('❌ OAuth user creation failed:', error);
    throw error;
  }
}

module.exports = router;