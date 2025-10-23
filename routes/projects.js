const express = require('express');
const { 
  createProject, 
  getProjects, 
  getProject,
  respondToProject,
  getMyResponses,
  getMyProjects,
  updateResponseStatus
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Публичные роуты
router.get('/', getProjects);
router.get('/:id', getProject);

// Защищенные роуты
router.post('/', protect, createProject);
router.post('/:id/respond', protect, respondToProject);
router.get('/my/responses', protect, getMyResponses);
router.get('/client/my-projects', protect, getMyProjects);
router.patch('/:projectId/responses/:responseId', protect, updateResponseStatus);

module.exports = router;