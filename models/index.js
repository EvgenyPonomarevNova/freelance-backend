// models/index.js
const User = require('./User');
const Project = require('./Project');
const Chat = require('./Chat');
const Message = require('./Message');

// Связи Chat
Chat.belongsTo(Project, { foreignKey: 'projectId' });
Chat.belongsTo(User, { as: 'client', foreignKey: 'clientId' });
Chat.belongsTo(User, { as: 'freelancer', foreignKey: 'freelancerId' });

// Связи Message
Message.belongsTo(Chat, { foreignKey: 'chatId' });
Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });

// Обратные связи
Project.hasMany(Chat, { foreignKey: 'projectId' });
User.hasMany(Chat, { as: 'clientChats', foreignKey: 'clientId' });
User.hasMany(Chat, { as: 'freelancerChats', foreignKey: 'freelancerId' });
Chat.hasMany(Message, { foreignKey: 'chatId' });
User.hasMany(Message, { as: 'sentMessages', foreignKey: 'senderId' });

module.exports = {
  User,
  Project,
  Chat,
  Message
};