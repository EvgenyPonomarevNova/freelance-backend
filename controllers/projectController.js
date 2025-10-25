const { Project, User, sequelize } = require('../models');
const { Op } = require('sequelize');

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
      client_id: req.user.id
    });

    // Загружаем данные клиента
    await project.reload({
      include: [{
        model: User,
        as: 'client',
        attributes: ['id', 'profile']
      }]
    });

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
    
    const where = { status: 'open' };
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { skills: { [Op.overlap]: [search] } }
      ];
    }

    const projects = await Project.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'client',
        attributes: ['id', 'profile']
      }],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['created_at', 'DESC']]
    });

    res.json({
      status: 'success',
      results: projects.rows.length,
      total: projects.count,
      pages: Math.ceil(projects.count / limit),
      currentPage: parseInt(page),
      projects: projects.rows
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
    const project = await Project.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'client',
        attributes: ['id', 'profile']
      }]
    });

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
  const t = await sequelize.transaction();
  
  try {
    const { proposal, price, timeline } = req.body;
    const projectId = req.params.id;

    // Проверяем что пользователь фрилансер
    if (req.user.role !== 'freelancer') {
      await t.rollback();
      return res.status(403).json({
        status: 'error',
        message: 'Только фрилансеры могут откликаться на проекты'
      });
    }

    const project = await Project.findByPk(projectId, { transaction: t });

    if (!project) {
      await t.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Проект не найден'
      });
    }

    // Проверяем что пользователь еще не откликался
    const existingResponse = project.responses.find(
      response => response.freelancer_id === req.user.id
    );

    if (existingResponse) {
      await t.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Вы уже отправили отклик на этот проект'
      });
    }

    // Добавляем отклик
    const newResponse = {
      id: Date.now(),
      freelancer_id: req.user.id,
      proposal,
      price,
      timeline,
      status: 'pending',
      created_at: new Date()
    };

    project.responses = [...project.responses, newResponse];
    await project.save({ transaction: t });
    await t.commit();

    // Загружаем данные фрилансера для ответа
    const freelancer = await User.findByPk(req.user.id, {
      attributes: ['id', 'profile']
    });

    const responseWithFreelancer = {
      ...newResponse,
      freelancer: freelancer
    };

    res.status(201).json({
      status: 'success',
      message: 'Отклик успешно отправлен',
      response: responseWithFreelancer
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Получение откликов пользователя
exports.getMyResponses = async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: {
        responses: {
          [Op.contains]: [{ freelancer_id: req.user.id }]
        }
      },
      include: [{
        model: User,
        as: 'client',
        attributes: ['id', 'profile']
      }]
    });

    const responses = projects.flatMap(project => 
      project.responses
        .filter(response => response.freelancer_id === req.user.id)
        .map(response => ({
          ...response,
          project: {
            id: project.id,
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
    const projects = await Project.findAll({
      where: { client_id: req.user.id },
      include: [{
        model: User,
        as: 'client',
        attributes: ['id', 'profile']
      }],
      order: [['created_at', 'DESC']]
    });

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

// Обновление статуса отклика
exports.updateResponseStatus = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { projectId, responseId } = req.params;
    const { status } = req.body;

    const project = await Project.findByPk(projectId, { transaction: t });

    if (!project) {
      await t.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Проект не найден'
      });
    }

    // Проверяем что пользователь - владелец проекта
    if (project.client_id !== req.user.id) {
      await t.rollback();
      return res.status(403).json({
        status: 'error',
        message: 'Только владелец проекта может менять статус откликов'
      });
    }

    // Находим и обновляем отклик
    const responseIndex = project.responses.findIndex(
      response => response.id === parseInt(responseId)
    );

    if (responseIndex === -1) {
      await t.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Отклик не найден'
      });
    }

    project.responses[responseIndex].status = status;
    
    // Если отклик принят, меняем статус проекта
    if (status === 'accepted') {
      project.status = 'in_progress';
    }

    await project.save({ transaction: t });
    await t.commit();

    res.json({
      status: 'success',
      message: `Отклик ${status === 'accepted' ? 'принят' : 'отклонен'}`,
      response: project.responses[responseIndex]
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};