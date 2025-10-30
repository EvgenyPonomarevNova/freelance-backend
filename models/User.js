// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Новый пользователь' // 🔥 ДОБАВЛЯЕМ ЗНАЧЕНИЕ ПО УМОЛЧАНИЮ
  },
  role: {
    type: DataTypes.ENUM('freelancer', 'client'),
    defaultValue: 'freelancer'
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: true // Для OAuth пользователей
  },
  profile: {
    type: DataTypes.JSONB,
    defaultValue: {
      avatar: null,
      bio: '',
      skills: [],
      rating: 0,
      completedProjects: 0,
      isEmailVerified: false,
      oauthProvider: null,
      linkedOAuthProviders: [],
      yandexId: null,
      googleId: null,
      vkId: null
    }
  },
  isOAuth: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true // 🔥 ВАЖНО: согласованность именования
});

// Хук для хеширования пароля
User.beforeSave(async (user) => {
  if (user.changed('passwordHash') && user.passwordHash) {
    user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
  }
});

// Метод для проверки пароля
User.prototype.checkPassword = async function(candidatePassword) {
  if (!this.passwordHash) return false;
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Метод для безопасного преобразования в JSON
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.passwordHash;
  return values;
};

// 🔥 ДОБАВЛЯЕМ МЕТОД ДЛЯ БЕЗОПАСНОГО ОБЪЕКТА
User.prototype.toSafeObject = function() {
  return {
    id: this.id,
    email: this.email,
    fullName: this.fullName,
    role: this.role,
    profile: this.profile,
    isOAuth: this.isOAuth,
    isActive: this.isActive,
    createdAt: this.created_at,
    updatedAt: this.updated_at
  };
};

module.exports = User;