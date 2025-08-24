const express = require('express');
const commentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes in this file require authentication
router.use(authenticateToken);

// Create comment on post
router.post('/post/:postId', commentController.createComment);

// Get comments for post
router.get('/post/:postId', commentController.getComments);

// Like/Unlike comment
router.post('/:commentId/like', commentController.toggleCommentLike);

// Delete comment
router.delete('/:commentId', commentController.deleteComment);

// Add reply to comment
router.post('/:commentId/reply', commentController.addReply);

module.exports = router;