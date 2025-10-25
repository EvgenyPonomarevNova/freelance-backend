// models/index.js
const sequelize = require('../config/database');
const User = require('./User');
const Project = require('./Project');
const Message = require('./Message');

// Ассоциации
User.hasMany(Project, { foreignKey: 'client_id', as: 'projects' });
Project.belongsTo(User, { foreignKey: 'client_id', as: 'client' });

Message.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });

Project.hasMany(Message, { foreignKey: 'project_id', as: 'messages' });
User.hasMany(Message, { foreignKey: 'sender_id', as: 'sentMessages' });
User.hasMany(Message, { foreignKey: 'receiver_id', as: 'receivedMessages' });

module.exports = {
  sequelize,
  User,
  Project,
  Message
};