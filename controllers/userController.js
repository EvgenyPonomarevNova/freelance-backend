// controllers/userController.js
const { User } = require('../models');
const { Op } = require('sequelize');

class UserService {
  static buildFreelancerFilters(query) {
    const { category, search } = query;
    const where = { role: 'freelancer' };
    
    if (category && category !== 'all') {
      where['profile.category'] = category;
    }
    
    if (search) {
      where[Op.or] = [
        { '$profile.name$': { [Op.iLike]: `%${search}%` } },
        { '$profile.bio$': { [Op.iLike]: `%${search}%` } },
        { '$profile.skills$': { [Op.contains]: [search] } }
      ];
    }

    return where;
  }

  static sanitizeUser(user) {
    const { password, email, ...sanitized } = user.toJSON();
    return sanitized;
  }
}

// Получение профиля пользователя
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['passwordHash', 'email'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }

    res.json({
      success: true,
      data: UserService.sanitizeUser(user)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка при загрузке профиля'
    });
  }
};

// Обновление профиля
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }

    // Обновляем профиль
    user.profile = {
      ...user.profile,
      ...req.body,
      // Сохраняем существующие поля если они не переданы
      avatar: req.body.avatar !== undefined ? req.body.avatar : user.profile.avatar
    };

    await user.save();

    res.json({
      success: true,
      data: UserService.sanitizeUser(user),
      message: 'Профиль успешно обновлен'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(400).json({
      success: false,
      error: 'Ошибка при обновлении профиля'
    });
  }
};

// Поиск фрилансеров
exports.getFreelancers = async (req, res) => {
  try {
    const { page = 1, limit = 10, ...filters } = req.query;
    const where = UserService.buildFreelancerFilters(filters);

    const freelancers = await User.findAndCountAll({
      where,
      attributes: { exclude: ['passwordHash', 'email'] },
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['profile.rating', 'DESC']]
    });

    res.json({
      success: true,
      data: freelancers.rows.map(UserService.sanitizeUser),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: freelancers.count,
        pages: Math.ceil(freelancers.count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка при поиске фрилансеров'
    });
  }
};

// Получение текущего пользователя
exports.getCurrentUser = async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user.toSafeObject()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка при загрузке пользователя'
    });
  }
};