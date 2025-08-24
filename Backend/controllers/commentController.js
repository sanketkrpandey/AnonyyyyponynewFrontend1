const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');

const commentController = {
  // Create comment
  createComment: async (req, res) => {
    try {
      const { postId } = req.params;
      const { content, isAnonymous = true } = req.body;

      if (!content) {
        return res.status(400).json({ message: 'Comment content is required' });
      }

      const post = await Post.findById(postId).populate('author'); // Populate author to get recipient ID
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if current user has blocked the post author
      const currentUser = await User.findById(req.userId);
      if (currentUser.blockedUsers.includes(post.author._id.toString())) {
        return res.status(403).json({ message: 'You cannot comment on posts from a blocked user.' });
      }

      const comment = new Comment({
        post: postId,
        author: req.userId,
        content,
        isAnonymous
      });

      await comment.save();

      // Add comment to post
      post.comments.push(comment._id);
      await post.save();

      // Populate comment author for response
      await comment.populate('author', 'anonymousName avatar');

      // Create notification if not commenting on own post
      if (post.author._id.toString() !== req.userId) {
        const commenter = await User.findById(req.userId);
        await new Notification({
          recipient: post.author._id,
          sender: req.userId,
          type: 'comment',
          post: postId,
          comment: comment._id,
          message: `${commenter.anonymousName} commented on your post`
        }).save();

        // Emit real-time notification
        const io = req.app.get('io');
        io.to(post.author._id.toString()).emit('newNotification', {
          type: 'comment',
          message: `${commenter.anonymousName} commented on your post`,
          createdAt: new Date(),
          sender: { anonymousName: commenter.anonymousName, avatar: commenter.avatar },
          post: { _id: postId, content: post.content },
          comment: { _id: comment._id, content: comment.content }
        });
      }

      res.status(201).json({
        message: 'Comment created successfully',
        comment
      });
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({ message: 'Failed to create comment' });
    }
  },

  // Get comments for a post
  getComments: async (req, res) => {
    try {
      const { postId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const comments = await Comment.find({
        post: postId,
        isHidden: false
      })
        .populate('author', 'anonymousName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Add like status for current user
      const commentsWithLikeStatus = comments.map(comment => {
        const isLiked = comment.likes.some(like =>
          like.user.toString() === req.userId
        );

        return {
          ...comment.toObject(),
          isLiked,
          likesCount: comment.likes.length,
          likes: undefined // Remove for privacy
        };
      });

      res.status(200).json({
        comments: commentsWithLikeStatus,
        currentPage: parseInt(page),
        hasMore: comments.length === parseInt(limit)
      });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ message: 'Failed to get comments' });
    }
  },

  // Like/Unlike comment
  toggleCommentLike: async (req, res) => {
    try {
      const { commentId } = req.params;
      const comment = await Comment.findById(commentId).populate('author', 'anonymousName');

      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      // Prevent liking own comment
      if (comment.author._id.toString() === req.userId) {
        return res.status(400).json({ message: 'Cannot like your own comment' });
      }

      // Check if current user has blocked the comment author
      const currentUser = await User.findById(req.userId);
      if (currentUser.blockedUsers.includes(comment.author._id.toString())) {
        return res.status(403).json({ message: 'You cannot like comments from a blocked user.' });
      }

      const likeIndex = comment.likes.findIndex(like =>
        like.user.toString() === req.userId
      );

      if (likeIndex > -1) {
        // Unlike
        comment.likes.splice(likeIndex, 1);
        await comment.save();

        res.status(200).json({
          message: 'Comment unliked',
          isLiked: false,
          likesCount: comment.likes.length
        });
      } else {
        // Like
        comment.likes.push({ user: req.userId });
        await comment.save();

        // Create notification for the comment author
        const liker = await User.findById(req.userId);
        await new Notification({
          recipient: comment.author._id,
          sender: req.userId,
          type: 'like',
          post: comment.post, // Link to the post the comment belongs to
          comment: comment._id,
          message: `${liker.anonymousName} liked your comment`
        }).save();

        // Emit real-time notification
        const io = req.app.get('io');
        io.to(comment.author._id.toString()).emit('newNotification', {
          type: 'like',
          message: `${liker.anonymousName} liked your comment`,
          createdAt: new Date(),
          sender: { anonymousName: liker.anonymousName, avatar: liker.avatar },
          comment: { _id: comment._id, content: comment.content }
        });

        res.status(200).json({
          message: 'Comment liked',
          isLiked: true,
          likesCount: comment.likes.length
        });
      }
    } catch (error) {
      console.error('Toggle comment like error:', error);
      res.status(500).json({ message: 'Failed to toggle comment like' });
    }
  },

  // Delete comment
  deleteComment: async (req, res) => {
    try {
      const { commentId } = req.params;
      const comment = await Comment.findById(commentId);

      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      if (comment.author.toString() !== req.userId) {
        return res.status(403).json({ message: 'Not authorized to delete this comment' });
      }

      // Remove comment from its parent post
      await Post.findByIdAndUpdate(comment.post, {
        $pull: { comments: commentId }
      });

      // Delete the comment itself
      await Comment.findByIdAndDelete(commentId);

      res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({ message: 'Failed to delete comment' });
    }
  },

  // Add reply to comment
  addReply: async (req, res) => {
    try {
      const { commentId } = req.params;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ message: 'Reply content is required' });
      }

      const comment = await Comment.findById(commentId).populate('author', 'anonymousName');
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      // Check if current user has blocked the original comment author
      const currentUser = await User.findById(req.userId);
      if (currentUser.blockedUsers.includes(comment.author._id.toString())) {
        return res.status(403).json({ message: 'You cannot reply to comments from a blocked user.' });
      }

      const reply = {
        author: req.userId,
        content,
        createdAt: new Date()
      };

      comment.replies.push(reply);
      await comment.save();

      // Populate the author of the new reply for the response
      const populatedReply = comment.replies[comment.replies.length - 1];
      await User.populate(populatedReply, { path: 'author', select: 'anonymousName avatar' });

      // Create notification for the original comment author if not replying to self
      if (comment.author._id.toString() !== req.userId) {
        const replier = await User.findById(req.userId);
        await new Notification({
          recipient: comment.author._id,
          sender: req.userId,
          type: 'reply',
          comment: commentId,
          post: comment.post, // Link to the original post
          message: `${replier.anonymousName} replied to your comment`
        }).save();

        // Emit real-time notification
        const io = req.app.get('io');
        io.to(comment.author._id.toString()).emit('newNotification', {
          type: 'reply',
          message: `${replier.anonymousName} replied to your comment`,
          createdAt: new Date(),
          sender: { anonymousName: replier.anonymousName, avatar: replier.avatar },
          comment: { _id: comment._id, content: comment.content }
        });
      }

      res.status(201).json({
        message: 'Reply added successfully',
        reply: populatedReply
      });
    } catch (error) {
      console.error('Add reply error:', error);
      res.status(500).json({ message: 'Failed to add reply' });
    }
  }
};

module.exports = commentController;