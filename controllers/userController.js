const User = require('../models/User');

// Получение профиля пользователя
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email');

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

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          'profile.name': name,
          'profile.bio': bio,
          'profile.skills': skills,
          'profile.category': category
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      status: 'success',
      user
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
    
    const filter = { role: 'freelancer' };
    
    if (category && category !== 'all') {
      filter['profile.category'] = category;
    }
    
    if (search) {
      filter.$or = [
        { 'profile.name': { $regex: search, $options: 'i' } },
        { 'profile.bio': { $regex: search, $options: 'i' } },
        { 'profile.skills': { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const freelancers = await User.find(filter)
      .select('-password -email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'profile.rating': -1 });

    const total = await User.countDocuments(filter);

    res.json({
      status: 'success',
      results: freelancers.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      freelancers
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};