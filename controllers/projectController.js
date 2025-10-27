const { Project, User, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');




// Валидация для создания отклика
exports.validateResponse = [
  // Проверка обязательных полей
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        errors: errors.array() 
      });
    }
    next();
  }
];

// Валидация для обновления статуса
exports.validateUpdateStatus = [
  // Проверка наличия статуса
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        errors: errors.array() 
      });
    }
    next();
  }
];

// Валидация для обновления профиля
exports.validateProfileUpdate = [
  // Проверка длины пароля
  (req, res, next) => {
    if (req.body.password && req.body.password.length < 6) {
      return res.status(400).json({ 
        errors: [{ msg: 'Пароль должен быть не менее 6 символов' }] 
      });
    }
    next();
  }
];
// Создание отклика на проект
exports.respondToProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { proposal, price, timeline } = req.body;

  try {
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    const freelancerId = req.user.id;
    
    // Проверка, что пользователь не отправил отклик на свой же проект
    if (project.user_id === freelancerId) {
      return res.status(400).json({ message: 'Нельзя отправить отклик на свой же проект' });
    }

    // Проверка, что пользователь не отправил уже отклик на этот проект
    const existingResponse = project.responses?.find(
      response => response.freelancer_id === freelancerId
    );
    
    if (existingResponse) {
      return res.status(400).json({ message: 'Вы уже отправили отклик на этот проект' });
    }

    // Создание нового отклика
    const newResponse = {
      id: uuidv4(),
      freelancer_id: freelancerId,
      proposal: proposal || null,
      price: price || null,
      timeline: timeline || null,
      status: 'pending',
      created_at: new Date()
    };

    // Обновление массива откликов
    const updatedResponses = project.responses ? [...project.responses, newResponse] : [newResponse];

    await project.update({ responses: updatedResponses });

    res.status(201).json({
      message: 'Отклик успешно отправлен',
      response: newResponse
    });
  } catch (error) {
    console.error('Ошибка при отправке отклика:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Обновление статуса отклика
exports.updateResponseStatus = async (req, res) => {
  const { id, responseId } = req.params;
  const { status } = req.body;

  try {
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    const responseIndex = project.responses?.findIndex(
      response => response.id === responseId
    );

    if (responseIndex === -1) {
      return res.status(404).json({ message: 'Отклик не найден' });
    }

    // Проверка, что только владелец проекта может изменять статус
    if (project.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    // Обновление статуса отклика
    project.responses[responseIndex].status = status;
    project.responses[responseIndex].updated_at = new Date();

    await project.update({ responses: project.responses });

    res.json({
      message: 'Статус отклика обновлен',
      response: project.responses[responseIndex]
    });
  } catch (error) {
    console.error('Ошибка при обновлении статуса отклика:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Получение откликов на проект
exports.getProjectResponses = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await Project.findByPk(id, {
      include: [{
        model: User,
        as: 'freelancer',
        attributes: ['id', 'profile']
      }]
    });

    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    // Проверка, что только владелец проекта может видеть отклики
    if (project.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const responses = project.responses || [];
    
    res.json({
      responses: responses.map(response => ({
        ...response,
        freelancer: project.freelancer
      }))
    });
  } catch (error) {
    console.error('Ошибка при получении откликов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Получение откликов пользователя
exports.getMyResponses = async (req, res) => {
  try {
    const responses = await Project.findAll({
      where: {
        responses: {
          [sequelize.Op.contains]: [{ freelancer_id: req.user.id }]
        }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'profile']
      }]
    });

    // Фильтрация откликов пользователя
    const userResponses = responses.flatMap(project => 
      project.responses?.filter(response => response.freelancer_id === req.user.id) || []
    );

    res.json({
      responses: userResponses.map(response => ({
        ...response,
        project: {
          id: project.id,
          title: project.title,
          description: project.description
        }
      }))
    });
  } catch (error) {
    console.error('Ошибка при получении откликов пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Получение проектов пользователя
exports.getUserProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: {
        user_id: req.user.id
      },
      order: [['created_at', 'DESC']]
    });

    res.json({ projects });
  } catch (error) {
    console.error('Ошибка при получении проектов пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};
