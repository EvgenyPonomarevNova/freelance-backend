const jwt = require('jsonwebtoken');
const { User } = require('../models');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d'
  });
};

exports.register = async (req, res) => {
  try {
    console.log('Register request body:', req.body); // Для дебага
    
    // Проверяем что body существует
    if (!req.body) {
      return res.status(400).json({
        status: 'error',
        message: 'Request body is missing'
      });
    }

    const { email, password, fullName, role } = req.body;

    // Проверяем обязательные поля
    if (!email || !password || !fullName || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'Все поля обязательны для заполнения'
      });
    }

    // Проверяем существующего пользователя
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Пользователь с таким email уже существует'
      });
    }

    // Создаем пользователя
    const newUser = await User.create({
      email,
      password,
      role,
      profile: {
        name: fullName,
        bio: '',
        avatar: '',
        category: 'other',
        rating: 5.0,
        completedProjects: 0,
        responseRate: '100%',
        skills: [],
        online: false
      }
    });

    const token = signToken(newUser.id);

    res.status(201).json({
      status: 'success',
      token,
      user: newUser.toSafeObject()
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Укажите email и пароль'
      });
    }

    const user = await User.findOne({ where: { email } });
    
    if (!user || !(await user.correctPassword(password))) {
      return res.status(401).json({
        status: 'error', 
        message: 'Неверный email или пароль'
      });
    }

    const token = signToken(user.id);

    res.json({
      status: 'success',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Пользователь не найден'
      });
    }
    
    res.json({
      status: 'success',
      user: user.toSafeObject()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};