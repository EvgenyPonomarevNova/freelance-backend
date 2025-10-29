const { User: UserModel, sequelize } = require('../models');
const { Op } = require('sequelize');

// Получение профиля пользователя
exports.getUserProfile = async (req, res) => {
  try {
    const user = await UserModel.findByPk(req.params.id, {
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
    const { 
      name, 
      bio, 
      skills, 
      location, 
      category,
      title,
      hourlyRate,
      experience,
      website,
      telegram,
      github,
      avatar // 🔥 ДОБАВЬТЕ ЭТО ПОЛЕ
    } = req.body;

    console.log('🔧 Server: Received update data:', req.body);

    const user = await UserModel.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Пользователь не найден'
      });
    }

    // 🔥 ОБНОВЛЯЕМ ВСЕ ПОЛЯ включая avatar
    user.profile = {
      ...user.profile,
      name: name !== undefined ? name : user.profile.name,
      bio: bio !== undefined ? bio : user.profile.bio,
      skills: skills !== undefined ? skills : user.profile.skills,
      category: category !== undefined ? category : user.profile.category,
      location: location !== undefined ? location : user.profile.location,
      title: title !== undefined ? title : user.profile.title,
      hourlyRate: hourlyRate !== undefined ? hourlyRate : user.profile.hourlyRate,
      experience: experience !== undefined ? experience : user.profile.experience,
      website: website !== undefined ? website : user.profile.website,
      telegram: telegram !== undefined ? telegram : user.profile.telegram,
      github: github !== undefined ? github : user.profile.github,
      avatar: avatar !== undefined ? avatar : user.profile.avatar // 🔥 СОХРАНЯЕМ AVATAR
    };

    await user.save();

    console.log('✅ Server: Profile updated successfully:', user.profile);

    res.json({
      status: 'success',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    console.error('❌ Server: Profile update error:', error);
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

    const freelancers = await UserModel.findAndCountAll({
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