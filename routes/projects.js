const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { body } = require('express-validator');

// Валидация откликов
const validateResponse = [
  body('proposal').optional().isLength({ max: 1000 }),
  body('price').optional().isNumeric(),
  body('timeline').optional().isLength({ max: 100 })
];

const validateStatus = [
  body('status').notEmpty().isIn(['pending', 'accepted', 'rejected'])
];

// Маршруты
router.post('/:id/responses', validateResponse, projectController.respondToProject);
router.put('/:id/responses/:responseId/status', validateStatus, projectController.updateResponseStatus);
router.get('/:id/responses', projectController.getProjectResponses);
router.get('/responses', projectController.getMyResponses);
router.get('/user/projects', projectController.getUserProjects);

module.exports = router;