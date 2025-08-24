const express = require('express');
const postController = require('../controllers/postController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes in this file require authentication
router.use(authenticateToken);

// Create post
router.post('/', postController.createPost);

// Get all posts (feed)
router.get('/', postController.getPosts);

// Get single post
router.get('/:postId', postController.getPost);

// Like/Unlike post
router.post('/:postId/like', postController.toggleLike);

// Delete post
router.delete('/:postId', postController.deletePost);

// Report post
router.post('/:postId/report', postController.reportPost);

// Get user's posts (posts by a specific user ID)
router.get('/user/:userId', postController.getUserPosts);

module.exports = router;