const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes in this file require authentication
router.use(authenticateToken);

// Get notifications for the current user
router.get('/', notificationController.getNotifications);

// Get unread notification count for the current user
router.get('/unread-count', notificationController.getUnreadCount);

// Mark a specific notification as read
router.put('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read for the current user
router.put('/mark-all-read', notificationController.markAllAsRead);

// Delete a specific notification
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;