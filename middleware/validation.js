// src/middleware/validation.js
const Joi = require('joi');

// Валидационные схемы
const schemas = {
  // Регистрация
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Некорректный формат email',
      'any.required': 'Email обязателен'
    }),
    password: Joi.string().min(6).max(30).required().messages({
      'string.min': 'Пароль должен содержать минимум 6 символов',
      'string.max': 'Пароль не должен превышать 30 символов',
      'any.required': 'Пароль обязателен'
    }),
    fullName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Имя должно содержать минимум 2 символа',
      'string.max': 'Имя не должно превышать 50 символов',
      'any.required': 'Имя обязательно'
    }),
    role: Joi.string().valid('freelancer', 'client').default('freelancer').messages({
      'any.only': 'Роль должна быть freelancer или client'
    })
  }),

  // Логин
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Некорректный формат email',
      'any.required': 'Email обязателен'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Пароль обязателен'
    })
  }),

  // Создание проекта
  createProject: Joi.object({
    title: Joi.string().min(5).max(100).required().messages({
      'string.min': 'Название должно содержать минимум 5 символов',
      'string.max': 'Название не должно превышать 100 символов',
      'any.required': 'Название обязательно'
    }),
    description: Joi.string().min(10).max(2000).required().messages({
      'string.min': 'Описание должно содержать минимум 10 символов',
      'string.max': 'Описание не должно превышать 2000 символов',
      'any.required': 'Описание обязательно'
    }),
    category: Joi.string().valid('development', 'design', 'marketing', 'writing', 'seo', 'other').required().messages({
      'any.only': 'Некорректная категория',
      'any.required': 'Категория обязательна'
    }),
    budget: Joi.number().integer().min(1000).max(1000000).required().messages({
      'number.min': 'Бюджет должен быть не менее 1000',
      'number.max': 'Бюджет не должен превышать 1000000',
      'any.required': 'Бюджет обязателен'
    }),
    deadline: Joi.string().optional().allow(''),
    skills: Joi.array().items(Joi.string().max(50)).max(10).messages({
      'array.max': 'Не более 10 навыков'
    })
  }),

  // Обновление профиля
updateProfile: Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  bio: Joi.string().max(500).optional().allow(''),
  skills: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  location: Joi.string().max(100).optional().allow(''),
  category: Joi.string().valid('development', 'design', 'marketing', 'writing', 'seo', 'other').optional(),
  title: Joi.string().max(100).optional().allow(''),
  hourlyRate: Joi.number().min(0).max(10000).optional(),
  experience: Joi.string().max(100).optional().allow(''),
  website: Joi.string().uri().optional().allow(''),
  telegram: Joi.string().max(50).optional().allow(''),
  github: Joi.string().max(50).optional().allow(''),
  avatar: Joi.string().uri().optional().allow(''),
  portfolio: Joi.array().optional(),
  experienceList: Joi.array().optional()
}),

  // Отклик на проект
  projectResponse: Joi.object({
    proposal: Joi.string().max(1000).optional().allow(''),
    price: Joi.number().min(0).max(1000000).optional(),
    timeline: Joi.string().max(100).optional().allow('')
  }),

  // Яндекс OAuth
  yandexOAuth: Joi.object({
    code: Joi.string().required().messages({
      'any.required': 'Authorization code обязателен'
    })
  })
};

// Мидлварь для валидации
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Возвращать все ошибки, а не только первую
      stripUnknown: true // Удалять неизвестные поля
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        details: errors
      });
    }

    // Заменяем req.body на валидированные данные
    req.body = value;
    next();
  };
};

// Валидация query параметров
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации query параметров',
        details: errors
      });
    }

    req.query = value;
    next();
  };
};

module.exports = {
  schemas,
  validate,
  validateQuery
};