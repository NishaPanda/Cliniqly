const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middelware/authMiddleware');
const { getProfile, updateProfile } = require('../Controller/userController');

// Get current user's profile
router.get('/me', authMiddleware, getProfile);

// Update current user's profile
router.put('/me', authMiddleware, updateProfile);

module.exports = router;
