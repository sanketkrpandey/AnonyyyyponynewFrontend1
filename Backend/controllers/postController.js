const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const cloudinary = require('cloudinary').v2;

const postController = {
  // Create new post
  createPost: async (req, res) => {
    try {
      const { content, images, tags, isAnonymous = true } = req.body;

      if (!content && (!images || images.length === 0)) {
        return res.status(400).json({
          message: 'Post must have content or images'
        });
      }

      let uploadedImages = [];

      // Upload images to Cloudinary
      if (images && images.length > 0) {
        for (const image of images) {
          if (image.startsWith('data:image/')) {
            const uploadResult = await cloudinary.uploader.upload(image, {
              folder: 'anonymous-social/posts',
              resource_type: 'image'
            });
            uploadedImages.push({
              url: uploadResult.secure_url,
              publicId: uploadResult.public_id
            });
          }
        }
      }

      const post = new Post({
        author: req.userId,
        content: content || '',
        images: uploadedImages,
        tags: tags || [],
        isAnonymous
      });

      await post.save();

      // Add post to user's posts array
      await User.findByIdAndUpdate(req.userId, {
        $push: { posts: post._id }
      });

      // Populate author information for response
      await post.populate('author', 'anonymousName avatar');

      res.status(201).json({
        message: 'Post created successfully',
        post
      });
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({ message: 'Failed to create post' });
    }
  },

  // Get all posts (feed)
  getPosts: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const currentUser = await User.findById(req.userId);
      const blockedUsers = currentUser.blockedUsers || [];

      const posts = await Post.find({
        isHidden: false,
        author: { $nin: blockedUsers } // Filter out posts from blocked users
      })
        .populate('author', 'anonymousName avatar')
        .populate({
          path: 'comments',
          select: 'content author createdAt likes',
          populate: {
            path: 'author',
            select: 'anonymousName avatar'
          },
          options: { limit: 3, sort: { createdAt: -1 } } // Fetch limited comments
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Add like status and counts for current user
      const postsWithLikeStatus = posts.map(post => {
        const isLiked = post.likes.some(like =>
          like.user.toString() === req.userId
        );

        return {
          ...post.toObject(),
          isLiked,
          likesCount: post.likes.length,
          commentsCount: post.comments.length,
          likes: undefined // Remove likes array for privacy, as only count and status are needed
        };
      });

      res.status(200).json({
        posts: postsWithLikeStatus,
        currentPage: parseInt(page),
        hasMore: posts.length === parseInt(limit)
      });
    } catch (error) {
      console.error('Get posts error:', error);
      res.status(500).json({ message: 'Failed to get posts' });
    }
  },

  // Get single post
  getPost: async (req, res) => {
    try {
      const { postId } = req.params;
      const post = await Post.findById(postId)
        .populate('author', 'anonymousName avatar')
        .populate({
          path: 'comments',
          populate: {
            path: 'author',
            select: 'anonymousName avatar'
          },
          options: { sort: { createdAt: -1 } }
        });

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if the current user has blocked the post author
      const currentUser = await User.findById(req.userId);
      if (currentUser.blockedUsers.includes(post.author._id.toString())) {
        return res.status(403).json({ message: 'You have blocked this user and cannot view their post.' });
      }

      const isLiked = post.likes.some(like =>
        like.user.toString() === req.userId
      );

      res.status(200).json({
        post: {
          ...post.toObject(),
          isLiked,
          likesCount: post.likes.length,
          commentsCount: post.comments.length,
          likes: undefined // Remove for privacy
        }
      });
    } catch (error) {
      console.error('Get post error:', error);
      res.status(500).json({ message: 'Failed to get post' });
    }
  },

  // Like/Unlike post
  toggleLike: async (req, res) => {
    try {
      const { postId } = req.params;
      const post = await Post.findById(postId).populate('author', 'anonymousName'); // Populate author for notification message

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Prevent liking own post
      if (post.author._id.toString() === req.userId) {
        return res.status(400).json({ message: 'Cannot like your own post' });
      }

      // Check if current user has blocked the post author
      const currentUser = await User.findById(req.userId);
      if (currentUser.blockedUsers.includes(post.author._id.toString())) {
        return res.status(403).json({ message: 'You cannot like posts from a blocked user.' });
      }

      const likeIndex = post.likes.findIndex(like =>
        like.user.toString() === req.userId
      );

      if (likeIndex > -1) {
        // Unlike
        post.likes.splice(likeIndex, 1);
        await post.save();

        res.status(200).json({
          message: 'Post unliked',
          isLiked: false,
          likesCount: post.likes.length
        });
      } else {
        // Like
        post.likes.push({ user: req.userId });
        await post.save();

        // Create notification for the post author
        const liker = await User.findById(req.userId); // Get liker's anonymous name
        await new Notification({
          recipient: post.author._id,
          sender: req.userId,
          type: 'like',
          post: postId,
          message: `${liker.anonymousName} liked your post`
        }).save();

        // Emit real-time notification
        const io = req.app.get('io');
        io.to(post.author._id.toString()).emit('newNotification', {
          type: 'like',
          message: `${liker.anonymousName} liked your post`,
          createdAt: new Date(),
          sender: { anonymousName: liker.anonymousName, avatar: liker.avatar },
          post: { _id: postId, content: post.content }
        });

        res.status(200).json({
          message: 'Post liked',
          isLiked: true,
          likesCount: post.likes.length
        });
      }
    } catch (error) {
      console.error('Toggle like error:', error);
      res.status(500).json({ message: 'Failed to toggle like' });
    }
  },

  // Delete post
  deletePost: async (req, res) => {
    try {
      const { postId } = req.params;
      const post = await Post.findById(postId);

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      if (post.author.toString() !== req.userId) {
        return res.status(403).json({ message: 'Not authorized to delete this post' });
      }

      // Delete images from Cloudinary
      if (post.images && post.images.length > 0) {
        for (const image of post.images) {
          await cloudinary.uploader.destroy(image.publicId);
        }
      }

      // Delete all comments associated with this post
      await Comment.deleteMany({ post: postId });

      await Post.findByIdAndDelete(postId);
      await User.findByIdAndUpdate(req.userId, {
        $pull: { posts: postId } // Remove post from user's posts array
      });

      res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Delete post error:', error);
      res.status(500).json({ message: 'Failed to delete post' });
    }
  },

  // Report post
  reportPost: async (req, res) => {
    try {
      const { postId } = req.params;
      const { reason } = req.body;

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if user already reported this post
      const existingReport = post.reports.find(report =>
        report.user.toString() === req.userId
      );

      if (existingReport) {
        return res.status(400).json({ message: 'You have already reported this post' });
      }

      // Prevent reporting your own post
      if (post.author.toString() === req.userId) {
        return res.status(400).json({ message: 'Cannot report your own post' });
      }

      post.reports.push({
        user: req.userId,
        reason: reason || 'Inappropriate content'
      });

      await post.save();

      res.status(200).json({ message: 'Post reported successfully' });
    } catch (error) {
      console.error('Report post error:', error);
      res.status(500).json({ message: 'Failed to report post' });
    }
  },

  // Get user's posts
  getUserPosts: async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const posts = await Post.find({
        author: userId,
        isHidden: false
      })
        .populate('author', 'anonymousName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const postsWithLikeStatus = posts.map(post => {
        const isLiked = post.likes.some(like =>
          like.user.toString() === req.userId
        );

        return {
          ...post.toObject(),
          isLiked,
          likesCount: post.likes.length,
          commentsCount: post.comments.length,
          likes: undefined
        };
      });

      res.status(200).json({
        posts: postsWithLikeStatus,
        currentPage: parseInt(page),
        hasMore: posts.length === parseInt(limit)
      });
    } catch (error) {
      console.error('Get user posts error:', error);
      res.status(500).json({ message: 'Failed to get user posts' });
    }
  }
};

module.exports = postController;