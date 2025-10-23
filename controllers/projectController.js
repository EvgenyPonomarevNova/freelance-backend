const Project = require('../models/Project');

// Создание проекта
exports.createProject = async (req, res) => {
  try {
    const { title, description, category, budget, deadline, skills } = req.body;

    const project = await Project.create({
      title,
      description, 
      category,
      budget,
      deadline,
      skills: skills || [],
      client: req.user.id
    });

    // Популируем данные клиента
    await project.populate('client', 'profile.name profile.avatar');

    res.status(201).json({
      status: 'success',
      project
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Получение всех проектов
exports.getProjects = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    
    // Фильтры
    const filter = { status: 'open' };
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    // Поиск
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const projects = await Project.find(filter)
      .populate('client', 'profile.name profile.avatar profile.rating')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Project.countDocuments(filter);

    res.json({
      status: 'success',
      results: projects.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      projects
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Получение проекта по ID
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'profile.name profile.avatar profile.rating profile.completedProjects')
      .populate('responses.freelancer', 'profile.name profile.avatar profile.rating');

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Проект не найден'
      });
    }

    // Увеличиваем просмотры
    project.views += 1;
    await project.save();

    res.json({
      status: 'success',
      project
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Отклик на проект
exports.respondToProject = async (req, res) => {
  try {
    const { proposal, price, timeline } = req.body;
    const projectId = req.params.id;

    // Проверяем что пользователь фрилансер
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({
        status: 'error',
        message: 'Только фрилансеры могут откликаться на проекты'
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Проект не найден'
      });
    }

    // Проверяем что пользователь еще не откликался
    const existingResponse = project.responses.find(
      response => response.freelancer.toString() === req.user.id
    );

    if (existingResponse) {
      return res.status(400).json({
        status: 'error',
        message: 'Вы уже отправили отклик на этот проект'
      });
    }

    // Добавляем отклик
    project.responses.push({
      freelancer: req.user.id,
      proposal,
      price,
      timeline,
      status: 'pending'
    });

    await project.save();

    // Популируем данные для ответа
    await project.populate('responses.freelancer', 'profile.name profile.avatar profile.rating');

    res.status(201).json({
      status: 'success',
      message: 'Отклик успешно отправлен',
      response: project.responses[project.responses.length - 1]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Получение откликов пользователя
exports.getMyResponses = async (req, res) => {
  try {
    const projects = await Project.find({
      'responses.freelancer': req.user.id
    }).populate('client', 'profile.name profile.avatar');

    const responses = projects.flatMap(project => 
      project.responses
        .filter(response => response.freelancer.toString() === req.user.id)
        .map(response => ({
          ...response.toObject(),
          project: {
            _id: project._id,
            title: project.title,
            budget: project.budget,
            client: project.client
          }
        }))
    );

    res.json({
      status: 'success',
      results: responses.length,
      responses
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Получение проектов пользователя
exports.getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ client: req.user.id })
      .populate('responses.freelancer', 'profile.name profile.avatar profile.rating')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      results: projects.length,
      projects
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Обновление статуса отклика (принятие/отклонение)
exports.updateResponseStatus = async (req, res) => {
  try {
    const { projectId, responseId } = req.params;
    const { status } = req.body;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Проект не найден'
      });
    }

    // Проверяем что пользователь - владелец проекта
    if (project.client.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Только владелец проекта может менять статус откликов'
      });
    }

    const response = project.responses.id(responseId);
    if (!response) {
      return res.status(404).json({
        status: 'error',
        message: 'Отклик не найден'
      });
    }

    response.status = status;
    await project.save();

    // Если отклик принят, меняем статус проекта
    if (status === 'accepted') {
      project.status = 'in_progress';
      await project.save();
    }

    res.json({
      status: 'success',
      message: `Отклик ${status === 'accepted' ? 'принят' : 'отклонен'}`,
      response
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};