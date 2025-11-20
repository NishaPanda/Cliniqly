// Routers/chatRouter.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middelware/authMiddleware');
const {
  getChatHistory,
  sendMessage,
  markAsRead,
  getDoctorChatParticipants
} = require('../Controller/chatController');

// Get all chat participants for a doctor
router.get('/participants', authMiddleware, getDoctorChatParticipants);

// Get chat history with another user
router.get('/:userId', authMiddleware, getChatHistory);

// Send a message to another user
router.post('/send', authMiddleware, sendMessage);

// Mark messages as read from a specific user
router.put('/:userId/read', authMiddleware, markAsRead);

module.exports = router;