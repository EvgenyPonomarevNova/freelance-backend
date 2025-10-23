const Message = require('../models/Message');
const Project = require('../models/Project');

// Отправка сообщения
exports.sendMessage = async (req, res) => {
  try {
    const { projectId, receiverId, text, type = 'text', file } = req.body;

    // Проверяем что пользователь участник проекта
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Проект не найден'
      });
    }

    // Проверяем что пользователь клиент или откликнувшийся фрилансер
    const isParticipant = 
      project.client.toString() === req.user.id ||
      project.responses.some(r => r.freelancer.toString() === req.user.id);

    if (!isParticipant) {
      return res.status(403).json({
        status: 'error',
        message: 'Вы не участник этого проекта'
      });
    }

    const message = await Message.create({
      project: projectId,
      sender: req.user.id,
      receiver: receiverId,
      text,
      type,
      file
    });

    // Популируем данные отправителя
    await message.populate('sender', 'profile.name profile.avatar');

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

    const messages = await Message.find({ project: projectId })
      .populate('sender', 'profile.name profile.avatar')
      .populate('receiver', 'profile.name profile.avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Помечаем сообщения как прочитанные
    await Message.updateMany(
      { 
        project: projectId, 
        receiver: req.user.id, 
        isRead: false 
      },
      { isRead: true }
    );

    res.json({
      status: 'success',
      results: messages.length,
      messages: messages.reverse() // возвращаем в хронологическом порядке
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};