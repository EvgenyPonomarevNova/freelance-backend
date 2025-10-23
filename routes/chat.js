const express = require('express');
const { sendMessage, getMessages } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/message', protect, sendMessage);
router.get('/:projectId/messages', protect, getMessages);

module.exports = router;