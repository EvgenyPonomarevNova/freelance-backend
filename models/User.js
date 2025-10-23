const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['freelancer', 'client'],
    required: true
  },
  profile: {
    name: {
      type: String,
      required: true
    },
    bio: {
      type: String,
      default: ''
    },
    avatar: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      enum: ['development', 'design', 'marketing', 'writing', 'seo', 'other'],
      default: 'other'
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5
    },
    completedProjects: {
      type: Number,
      default: 0
    },
    responseRate: {
      type: String,
      default: '100%'
    },
    skills: [{
      type: String
    }],
    online: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Хеширование пароля перед сохранением
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Метод для проверки пароля
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model('User', userSchema);