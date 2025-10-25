const { User, sequelize } = require('../models');
const { Op } = require('sequelize');

// Получение профиля пользователя
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'email'] }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Пользователь не найден'
      });
    }

    res.json({
      status: 'success',
      user
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Обновление профиля
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, skills, category } = req.body;

    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Пользователь не найден'
      });
    }

    // Обновляем профиль
    user.profile = {
      ...user.profile,
      name: name || user.profile.name,
      bio: bio || user.profile.bio,
      skills: skills || user.profile.skills,
      category: category || user.profile.category
    };

    await user.save();

    res.json({
      status: 'success',
      user: user.toSafeObject()
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Поиск фрилансеров
exports.getFreelancers = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    
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

    const freelancers = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'email'] },
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['profile.rating', 'DESC']]
    });

    res.json({
      status: 'success',
      results: freelancers.rows.length,
      total: freelancers.count,
      pages: Math.ceil(freelancers.count / limit),
      currentPage: parseInt(page),
      freelancers: freelancers.rows
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};