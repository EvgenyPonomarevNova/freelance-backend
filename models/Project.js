const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Название проекта обязательно'],
    trim: true,
    maxlength: [100, 'Название не может быть длиннее 100 символов']
  },
  description: {
    type: String,
    required: [true, 'Описание проекта обязательно'],
    maxlength: [2000, 'Описание не может быть длиннее 2000 символов']
  },
  category: {
    type: String,
    required: true,
    enum: {
      values: ['development', 'design', 'marketing', 'writing', 'seo', 'other'],
      message: 'Неверная категория проекта'
    }
  },
  budget: {
    type: Number,
    required: [true, 'Бюджет проекта обязателен'],
    min: [1000, 'Бюджет должен быть не менее 1000 рублей']
  },
  deadline: {
    type: String,
    default: ''
  },
  skills: [{
    type: String,
    trim: true
  }],
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'completed', 'cancelled'],
    default: 'open'
  },
  views: {
    type: Number,
    default: 0
  },
  responses: [{
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    proposal: String,
    price: Number,
    timeline: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Индекс для поиска
projectSchema.index({ status: 1, createdAt: -1 });
projectSchema.index({ category: 1 });

module.exports = mongoose.model('Project', projectSchema);