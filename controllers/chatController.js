// controllers/chatController.js
const { Chat, Message, User, Project } = require('../models');
const { Op } = require('sequelize');

// Получить или создать чат
exports.getOrCreateChat = async (req, res) => {
  try {
    const { projectId, freelancerId } = req.body;
    const clientId = req.user.id;

    let chat = await Chat.findOne({
      where: {
        projectId,
        clientId,
        freelancerId
      },
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'email', 'fullName', 'profile']
        },
        {
          model: User,
          as: 'freelancer',
          attributes: ['id', 'email', 'fullName', 'profile']
        },
        {
          model: Project,
          attributes: ['id', 'title', 'status']
        }
      ]
    });

    if (!chat) {
      chat = await Chat.create({
        projectId,
        clientId,
        freelancerId
      });

      // Загружаем связанные данные
      chat = await Chat.findByPk(chat.id, {
        include: [
          {
            model: User,
            as: 'client',
            attributes: ['id', 'email', 'fullName', 'profile']
          },
          {
            model: User,
            as: 'freelancer',
            attributes: ['id', 'email', 'fullName', 'profile']
          },
          {
            model: Project,
            attributes: ['id', 'title', 'status']
          }
        ]
      });
    }

    res.json({
      status: 'success',
      chat
    });
  } catch (error) {
    console.error('Chat creation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Ошибка при создании чата'
    });
  }
};

// Получить список чатов пользователя
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.findAll({
      where: {
        [Op.or]: [
          { clientId: userId },
          { freelancerId: userId }
        ],
        isActive: true
      },
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'email', 'fullName', 'profile']
        },
        {
          model: User,
          as: 'freelancer',
          attributes: ['id', 'email', 'fullName', 'profile']
        },
        {
          model: Project,
          attributes: ['id', 'title', 'status', 'budget']
        },
        {
          model: Message,
          limit: 1,
          order: [['created_at', 'DESC']]
        }
      ],
      order: [['lastMessageAt', 'DESC']]
    });

    res.json({
      status: 'success',
      chats
    });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Ошибка при загрузке чатов'
    });
  }
};

// Получить сообщения чата
exports.getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // Проверяем доступ к чату
    const chat = await Chat.findOne({
      where: {
        id: chatId,
        [Op.or]: [
          { clientId: userId },
          { freelancerId: userId }
        ]
      }
    });

    if (!chat) {
      return res.status(403).json({
        status: 'error',
        message: 'Доступ к чату запрещен'
      });
    }

    const messages = await Message.findAll({
      where: { chatId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'email', 'fullName', 'profile']
        }
      ],
      order: [['created_at', 'ASC']]
    });

    // Помечаем сообщения как прочитанные
    await Message.update(
      { isRead: true },
      {
        where: {
          chatId,
          senderId: { [Op.ne]: userId },
          isRead: false
        }
      }
    );

    res.json({
      status: 'success',
      messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Ошибка при загрузке сообщений'
    });
  }
};

// Отправить сообщение
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text, type = 'text', file = null } = req.body;
    const senderId = req.user.id;

    // Проверяем доступ к чату
    const chat = await Chat.findOne({
      where: {
        id: chatId,
        [Op.or]: [
          { clientId: senderId },
          { freelancerId: senderId }
        ]
      }
    });

    if (!chat) {
      return res.status(403).json({
        status: 'error',
        message: 'Доступ к чату запрещен'
      });
    }

    const message = await Message.create({
      chatId,
      senderId,
      text,
      type,
      file
    });

    // Обновляем последнее сообщение в чате
    await Chat.update(
      {
        lastMessage: text,
        lastMessageAt: new Date()
      },
      { where: { id: chatId } }
    );

    // Увеличиваем счетчик непрочитанных
    const unreadField = senderId === chat.clientId ? 
      'unreadCountFreelancer' : 'unreadCountClient';
    
    await Chat.increment(unreadField, { where: { id: chatId } });

    // Загружаем сообщение с данными отправителя
    const messageWithSender = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'email', 'fullName', 'profile']
        }
      ]
    });

    res.json({
      status: 'success',
      message: messageWithSender
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Ошибка при отправке сообщения'
    });
  }
};