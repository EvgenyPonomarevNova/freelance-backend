// routes/chats.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getOrCreateChat,
  getUserChats,
  getChatMessages,
  sendMessage
} = require('../controllers/chats');

router.post('/create', protect, getOrCreateChat);
router.get('/my', protect, getUserChats);
router.get('/:chatId/messages', protect, getChatMessages);
router.post('/:chatId/messages', protect, sendMessage);

module.exports = router;