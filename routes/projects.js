// routes/projects.js
const express = require('express');
const router = express.Router();
const Joi = require('joi');
const projectController = require('../controllers/projectController');
const { validate, schemas, validateQuery } = require('../middleware/validation');
const { protect } = require('../middleware/auth');

// Схемы для query параметров
const projectQuerySchema = Joi.object({
  category: Joi.string().valid('development', 'design', 'marketing', 'writing', 'seo', 'other', 'all').optional(),
  search: Joi.string().max(100).optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid('open', 'in_progress', 'completed', 'cancelled').default('open')
});

// 🔥 ОСНОВНЫЕ МАРШРУТЫ ДЛЯ ПРОЕКТОВ
router.get('/', validateQuery(projectQuerySchema), projectController.getProjects);
router.get('/:id', projectController.getProject);
router.post('/', protect, validate(schemas.createProject), projectController.createProject);

// 🔥 МАРШРУТЫ ДЛЯ ОТКЛИКОВ
router.post('/:id/respond', protect, validate(schemas.projectResponse), projectController.respondToProject);
router.patch('/:projectId/responses/:responseId', protect, projectController.updateResponseStatus);
router.get('/my/responses', protect, projectController.getMyResponses);
router.get('/client/my-projects', protect, projectController.getMyProjects);

module.exports = router;