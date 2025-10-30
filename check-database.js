// check-database.js
require('dotenv').config();
const { sequelize, User, Project, Chat, Message } = require('./models');

const checkDatabase = async () => {
  try {
    console.log('🔍 Checking database...');
    
    // Проверяем подключение
    await sequelize.authenticate();
    console.log('✅ Database connection: OK');
    
    // Проверяем таблицу users
    const userCount = await User.count();
    console.log(`👥 Users in database: ${userCount}`);
    
    // Проверяем таблицу projects
    const projectCount = await Project.count();
    console.log(`📋 Projects in database: ${projectCount}`);
    
    // Проверяем таблицу chats
    const chatCount = await Chat.count();
    console.log(`💬 Chats in database: ${chatCount}`);
    
    // Проверяем таблицу messages
    const messageCount = await Message.count();
    console.log(`✉️ Messages in database: ${messageCount}`);
    
    // Проверяем структуру таблицы users
    console.log('\n📝 User table structure:');
    const userAttributes = User.rawAttributes;
    Object.keys(userAttributes).forEach(column => {
      const attr = userAttributes[column];
      console.log(`  - ${column}: ${attr.type.key} ${attr.allowNull === false ? 'NOT NULL' : ''}`);
    });
    
    console.log('\n🎉 Database check completed successfully!');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await sequelize.close();
  }
};

checkDatabase();