// routes/users.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const userController = require('../controllers/userController');
const { validate, schemas, validateQuery } = require('../middleware/validation');
const { protect } = require('../middleware/auth');
const Joi = require('joi');

// Создаем папку для загрузок, если её нет
const uploadsDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 🔥 УПРОЩЕННАЯ КОНФИГУРАЦИЯ MULTER
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 🔥 БОЛЕЕ ПРОСТАЯ КОНФИГУРАЦИЯ MULTER
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
  // Убираем fileFilter для упрощения
});

// 🔥 ФУНКЦИЯ ДЛЯ ОБРАБОТКИ ОШИБОК MULTER
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Файл слишком большой. Максимальный размер: 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Ошибка загрузки: ${err.message}`
    });
  }
  next(err);
};

// Схема для query параметров поиска фрилансеров
const freelancersQuerySchema = Joi.object({
  category: Joi.string().valid('development', 'design', 'marketing', 'writing', 'seo', 'other', 'all').optional(),
  search: Joi.string().max(100).optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

// 🔥 КОРНЕВОЙ РОУТ ДЛЯ /api/users
router.get('/', (req, res) => {
  res.json({ 
    message: 'Users API is working!',
    availableEndpoints: [
      'GET /api/users/',
      'GET /api/users/profile',
      'PATCH /api/users/profile',
      'POST /api/users/profile/avatar',
      'GET /api/users/freelancers',
      'GET /api/users/:id'
    ]
  });
});

// 🔥 ПОЛУЧЕНИЕ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
router.get('/profile', protect, userController.getCurrentUser);

// 🔥 ОБНОВЛЕНИЕ ПРОФИЛЯ
router.patch('/profile', protect, userController.updateProfile);

// 🔥 ЗАГРУЗКА АВАТАРА - УПРОЩЕННАЯ ВЕРСИЯ
router.post('/profile/avatar', 
  protect,
  express.json(), // Добавляем парсинг JSON
  async (req, res) => {
    try {
      console.log('📤 Avatar upload request received');
      console.log('📁 Request body:', req.body);
      console.log('📁 Headers:', req.headers);
      console.log('👤 User:', req.user.id);

      const { avatarData } = req.body;
      
      if (!avatarData) {
        console.log('❌ No avatar data received');
        return res.status(400).json({
          success: false,
          error: 'Данные аватара не предоставлены'
        });
      }

      // Проверяем, что это base64 строка
      if (!avatarData.startsWith('data:image/')) {
        return res.status(400).json({
          success: false,
          error: 'Неверный формат данных аватара'
        });
      }

      const { User } = require('../models');
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Пользователь не найден'
        });
      }

      // Сохраняем base64 изображение напрямую
      user.profile = {
        ...user.profile,
        avatar: avatarData
      };

      await user.save();
      console.log('✅ Avatar saved to database as base64');

      res.json({
        success: true,
        avatarUrl: avatarData,
        message: 'Аватар успешно обновлен'
      });

    } catch (error) {
      console.error('❌ Avatar upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при загрузке аватара: ' + error.message
      });
    }
  }
);

// 🔥 ПОИСК ФРИЛАНСЕРОВ
router.get('/freelancers', validateQuery(freelancersQuerySchema), userController.getFreelancers);

// 🔥 ПОЛУЧЕНИЕ ПРОФИЛЯ ПО ID
router.get('/:id', userController.getUserProfile);

module.exports = router;