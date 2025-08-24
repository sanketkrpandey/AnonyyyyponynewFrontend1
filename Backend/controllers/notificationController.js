const Notification = require('../models/Notification');

const notificationController = {
  // Get user notifications
  getNotifications: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      const notifications = await Notification.find({ recipient: req.userId })
        .populate('sender', 'anonymousName avatar')
        .populate('post', 'content') // Populate post content for context
        .populate('comment', 'content') // Populate comment content for context
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(parseInt(limit));

      res.status(200).json({
        notifications,
        currentPage: parseInt(page),
        hasMore: notifications.length === parseInt(limit) // Indicates if more notifications can be fetched
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ message: 'Failed to get notifications' });
    }
  },

  // Mark notification as read
  markAsRead: async (req, res) => {
    try {
      const { notificationId } = req.params;

      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: req.userId }, // Ensure only recipient can mark as read
        { isRead: true },
        { new: true } // Return the updated document
      );

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found or not authorized' });
      }

      res.status(200).json({
        message: 'Notification marked as read',
        notification
      });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (req, res) => {
    try {
      await Notification.updateMany(
        { recipient: req.userId, isRead: false }, // Only mark unread notifications for the current user
        { isRead: true }
      );

      res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({ message: 'Failed to mark all notifications as read' });
    }
  },

  // Get unread notification count
  getUnreadCount: async (req, res) => {
    try {
      const count = await Notification.countDocuments({
        recipient: req.userId,
        isRead: false
      });

      res.status(200).json({ unreadCount: count });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({ message: 'Failed to get unread count' });
    }
  },

  // Delete notification
  deleteNotification: async (req, res) => {
    try {
      const { notificationId } = req.params;

      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        recipient: req.userId // Ensure only recipient can delete
      });

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found or not authorized' });
      }

      res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ message: 'Failed to delete notification' });
    }
  }
};

module.exports = notificationController;