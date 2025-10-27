const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');

// Валидация создания проекта
const validateProject = [
  body('title').notEmpty().isLength({ min: 5, max: 100 }),
  body('description').notEmpty().isLength({ min: 10, max: 2000 }),
  body('category').isIn(['development', 'design', 'marketing', 'writing', 'seo', 'other']),
  body('budget').isInt({ min: 1000 }),
  body('deadline').optional().isISO8601(),
  body('skills').optional().isArray()
];

// Валидация откликов
const validateResponse = [
  body('proposal').optional().isLength({ max: 1000 }),
  body('price').optional().isNumeric(),
  body('timeline').optional().isLength({ max: 100 })
];

const validateStatus = [
  body('status').notEmpty().isIn(['pending', 'accepted', 'rejected'])
];

// 🔥 ОСНОВНЫЕ МАРШРУТЫ ДЛЯ ПРОЕКТОВ
router.get('/', projectController.getProjects); // Получить все проекты
router.get('/:id', projectController.getProject); // Получить проект по ID
router.post('/', protect, validateProject, projectController.createProject); // Создать проект

// 🔥 МАРШРУТЫ ДЛЯ ОТКЛИКОВ
router.post('/:id/respond', protect, validateResponse, projectController.respondToProject);
router.patch('/:projectId/responses/:responseId', protect, validateStatus, projectController.updateResponseStatus);
router.get('/my/responses', protect, projectController.getMyResponses);
router.get('/client/my-projects', protect, projectController.getMyProjects);

module.exports = router;