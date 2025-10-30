// models/index.js
const sequelize = require('../config/database');
const User = require('./User');
const Project = require('./Project');
const Chat = require('./Chat');
const Message = require('./Message');

// Связи
Project.belongsTo(User, { as: 'client', foreignKey: 'client_id' });
User.hasMany(Project, { as: 'projects', foreignKey: 'client_id' });

Chat.belongsTo(Project, { foreignKey: 'projectId' });
Chat.belongsTo(User, { as: 'client', foreignKey: 'clientId' });
Chat.belongsTo(User, { as: 'freelancer', foreignKey: 'freelancerId' });

Message.belongsTo(Chat, { foreignKey: 'chatId' });
Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });

// Обратные связи
Project.hasMany(Chat, { foreignKey: 'projectId' });
User.hasMany(Chat, { as: 'clientChats', foreignKey: 'clientId' });
User.hasMany(Chat, { as: 'freelancerChats', foreignKey: 'freelancerId' });
Chat.hasMany(Message, { foreignKey: 'chatId' });
User.hasMany(Message, { as: 'sentMessages', foreignKey: 'senderId' });

// 🔥 ИСПРАВЛЕННАЯ СИНХРОНИЗАЦИЯ
const syncDatabase = async () => {
  try {
    // Сначала синхронизируем User отдельно с безопасными настройками
    await User.sync({ force: false, alter: { drop: false } });
    
    // Затем остальные модели
    await Project.sync({ force: false, alter: { drop: false } });
    await Chat.sync({ force: false, alter: { drop: false } });
    await Message.sync({ force: false, alter: { drop: false } });
    
    console.log('✅ Database synchronized successfully');
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
    
    // 🔥 РЕЗЕРВНОЕ РЕШЕНИЕ: принудительная пересоздание таблиц (ТОЛЬКО ДЛЯ РАЗРАБОТКИ!)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Attempting force sync for development...');
      try {
        await sequelize.sync({ force: true });
        console.log('✅ Database force-synced successfully');
      } catch (forceError) {
        console.error('❌ Force sync also failed:', forceError);
      }
    }
  }
};

module.exports = {
  sequelize,
  syncDatabase,
  User,
  Project,
  Chat,
  Message
};