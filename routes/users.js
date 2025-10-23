const express = require('express');
const { 
  getUserProfile, 
  updateProfile, 
  getFreelancers 
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/freelancers', getFreelancers);
router.get('/:id', getUserProfile);
router.patch('/profile', protect, updateProfile);

module.exports = router;