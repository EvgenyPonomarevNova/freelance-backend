const { Message, Project, User } = require('../models');
const { Op } = require('sequelize');

// Отправка сообщения
exports.sendMessage = async (req, res) => {
  try {
    const { projectId, receiverId, text, type = 'text', file } = req.body;

    // Проверяем что пользователь участник проекта
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Проект не найден'
      });
    }

    // Проверяем что пользователь клиент или откликнувшийся фрилансер
    const isParticipant = 
      project.client_id === req.user.id ||
      project.responses.some(r => r.freelancer_id === req.user.id);

    if (!isParticipant) {
      return res.status(403).json({
        status: 'error',
        message: 'Вы не участник этого проекта'
      });
    }

    const message = await Message.create({
      project_id: projectId,
      sender_id: req.user.id,
      receiver_id: receiverId,
      text,
      type,
      file: file || null
    });

    // Загружаем данные отправителя
    await message.reload({
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'profile']
      }]
    });

    res.status(201).json({
      status: 'success',
      message
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Получение истории сообщений
exports.getMessages = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.findAndCountAll({
      where: { project_id: projectId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'profile']
        },
        {
          model: User,
          as: 'receiver', 
          attributes: ['id', 'profile']
        }
      ],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['created_at', 'DESC']]
    });

    // Помечаем сообщения как прочитанные
    await Message.update(
      { isRead: true },
      {
        where: {
          project_id: projectId,
          receiver_id: req.user.id,
          isRead: false
        }
      }
    );

    res.json({
      status: 'success',
      results: messages.rows.length,
      total: messages.count,
      messages: messages.rows.reverse() // возвращаем в хронологическом порядке
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};