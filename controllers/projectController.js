// controllers/projectController.js
const { Project, User } = require('../models');
const { Op } = require('sequelize');

class ProjectService {
  static buildProjectFilters(query) {
    const { category, search, status = 'open' } = query;
    const where = { status };
    
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
    
    return where;
  }

  static createResponse(freelancerId, data) {
    return {
      id: Date.now(),
      freelancer_id: freelancerId,
      proposal: data.proposal || "Готов взяться за проект!",
      price: data.price,
      timeline: data.timeline || "2 недели",
      status: 'pending',
      created_at: new Date().toISOString()
    };
  }
}

// Получение всех проектов
exports.getProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, ...filters } = req.query;
    const where = ProjectService.buildProjectFilters(filters);

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
      success: true,
      data: projects.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: projects.count,
        pages: Math.ceil(projects.count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка при загрузке проектов'
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
        success: false,
        error: 'Проект не найден'
      });
    }

    project.views += 1;
    await project.save();

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка при загрузке проекта'
    });
  }
};

// Создание проекта
exports.createProject = async (req, res) => {
  try {
    const project = await Project.create({
      ...req.body,
      client_id: req.user.id
    });

    await project.reload({
      include: [{
        model: User,
        as: 'client',
        attributes: ['id', 'profile']
      }]
    });

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Ошибка при создании проекта'
    });
  }
};

// Отклик на проект
exports.respondToProject = async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { proposal, price, timeline } = req.body;

    if (req.user.role !== 'freelancer') {
      return res.status(403).json({
        success: false,
        error: 'Только фрилансеры могут откликаться на проекты'
      });
    }

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Проект не найден'
      });
    }

    const existingResponse = project.responses?.find(
      response => response.freelancer_id === req.user.id
    );

    if (existingResponse) {
      return res.status(400).json({
        success: false,
        error: 'Вы уже отправили отклик на этот проект'
      });
    }

    const newResponse = ProjectService.createResponse(req.user.id, {
      proposal,
      price: price || project.budget * 0.8,
      timeline
    });

    const updatedResponses = [...(project.responses || []), newResponse];
    await project.update({ responses: updatedResponses });

    res.status(201).json({
      success: true,
      data: newResponse,
      message: 'Отклик успешно отправлен'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка при отправке отклика'
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
      success: true,
      data: responses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка при загрузке откликов'
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
      success: true,
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка при загрузке проектов'
    });
  }
};

// Обновление статуса отклика
exports.updateResponseStatus = async (req, res) => {
  try {
    const { projectId, responseId } = req.params;
    const { status } = req.body;

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Проект не найден'
      });
    }

    if (project.client_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Только владелец проекта может менять статус откликов'
      });
    }

    const responseIndex = project.responses.findIndex(
      response => response.id === parseInt(responseId)
    );

    if (responseIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Отклик не найден'
      });
    }

    project.responses[responseIndex].status = status;
    
    if (status === 'accepted') {
      project.status = 'in_progress';
    }

    await project.save();

    res.json({
      success: true,
      data: project.responses[responseIndex],
      message: `Отклик ${status === 'accepted' ? 'принят' : 'отклонен'}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка при обновлении статуса'
    });
  }
};