const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes in this file require authentication
router.use(authenticateToken);

// Get current user profile
router.get('/profile', userController.getProfile);

// Update profile
router.put('/profile', userController.updateProfile);

// Follow/Unfollow user
router.post('/:userId/follow', userController.toggleFollow);

// Get user by anonymous name
router.get('/name/:anonymousName', userController.getUserByName);

// Search users
router.get('/search', userController.searchUsers);

// Block/Unblock user (Added for completeness in social platforms)
router.post('/:userIdToBlock/block', userController.toggleBlockUser);

module.exports = router;