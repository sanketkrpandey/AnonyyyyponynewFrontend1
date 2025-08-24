const User = require('../models/User');
const Post = require('../models/Post');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const userController = {
  // Get current user profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.userId)
        .select('-otp -email') // Do not expose OTP or email
        .populate('followers', 'anonymousName avatar')
        .populate('following', 'anonymousName avatar');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const postCount = await Post.countDocuments({ author: req.userId });

      res.status(200).json({
        user: {
          ...user.toObject(),
          postCount,
          followerCount: user.followers.length,
          followingCount: user.following.length
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Failed to get profile' });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const { anonymousName, avatar } = req.body;
      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if new anonymous name is unique
      if (anonymousName && anonymousName !== user.anonymousName) {
        const existingUser = await User.findOne({
          anonymousName,
          _id: { $ne: req.userId }
        });
        if (existingUser) {
          return res.status(400).json({
            message: 'Anonymous name already taken'
          });
        }
        user.anonymousName = anonymousName;
      }

      if (avatar) {
        // Upload to Cloudinary if it's a base64 image
        if (avatar.startsWith('data:image/')) {
          const uploadResult = await cloudinary.uploader.upload(avatar, {
            folder: 'anonymous-social/avatars',
            width: 200,
            height: 200,
            crop: 'fill'
          });
          user.avatar = uploadResult.secure_url;
        } else {
          // If avatar is not a base64 string, assume it's an existing URL or null
          user.avatar = avatar;
        }
      }

      await user.save();

      res.status(200).json({
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          anonymousName: user.anonymousName,
          avatar: user.avatar
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  },

  // Follow/Unfollow user
  toggleFollow: async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUser = await User.findById(req.userId);
      const targetUser = await User.findById(userId);

      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (userId === req.userId) {
        return res.status(400).json({ message: 'Cannot follow yourself' });
      }

      const isFollowing = currentUser.following.includes(userId);

      if (isFollowing) {
        // Unfollow
        currentUser.following.pull(userId);
        targetUser.followers.pull(req.userId);
        await currentUser.save();
        await targetUser.save();

        res.status(200).json({
          message: 'Unfollowed successfully',
          isFollowing: false
        });
      } else {
        // Follow
        currentUser.following.push(userId);
        targetUser.followers.push(req.userId);
        await currentUser.save();
        await targetUser.save();

        // Create notification
        const Notification = require('../models/Notification'); // Re-require to avoid circular dependency issues
        await new Notification({
          recipient: userId,
          sender: req.userId,
          type: 'follow',
          message: `${currentUser.anonymousName} started following you`
        }).save();

        // Emit real-time notification
        const io = req.app.get('io');
        io.to(userId).emit('newNotification', {
          type: 'follow',
          message: `${currentUser.anonymousName} started following you`,
          createdAt: new Date(),
          sender: { anonymousName: currentUser.anonymousName, avatar: currentUser.avatar } // Include sender info for frontend
        });

        res.status(200).json({
          message: 'Followed successfully',
          isFollowing: true
        });
      }
    } catch (error) {
      console.error('Toggle follow error:', error);
      res.status(500).json({ message: 'Failed to toggle follow' });
    }
  },

  // Get user by anonymous name
  getUserByName: async (req, res) => {
    try {
      const { anonymousName } = req.params;
      const user = await User.findOne({ anonymousName })
        .select('-email -otp')
        .populate('followers', 'anonymousName avatar')
        .populate('following', 'anonymousName avatar');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const postCount = await Post.countDocuments({ author: user._id });
      // Check if current authenticated user is following this user
      const currentUser = await User.findById(req.userId);
      const isFollowing = currentUser ? currentUser.following.includes(user._id) : false;


      res.status(200).json({
        user: {
          ...user.toObject(),
          postCount,
          followerCount: user.followers.length,
          followingCount: user.following.length,
          isFollowing
        }
      });
    } catch (error) {
      console.error('Get user by name error:', error);
      res.status(500).json({ message: 'Failed to get user' });
    }
  },

  // Search users
  searchUsers: async (req, res) => {
    try {
      const { query } = req.query;
      const users = await User.find({
        anonymousName: { $regex: query, $options: 'i' }, // Case-insensitive regex search
        isVerified: true,
        isActive: true
      })
        .select('anonymousName avatar')
        .limit(10); // Limit search results

      res.status(200).json({ users });
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({ message: 'Failed to search users' });
    }
  },

  // Block/Unblock user (New functionality, not in original prompt but good for social platforms)
  toggleBlockUser: async (req, res) => {
    try {
      const { userIdToBlock } = req.params;
      const currentUser = await User.findById(req.userId);
      const targetUser = await User.findById(userIdToBlock);

      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (userIdToBlock === req.userId) {
        return res.status(400).json({ message: 'Cannot block yourself' });
      }

      const isBlocked = currentUser.blockedUsers.includes(userIdToBlock);

      if (isBlocked) {
        // Unblock
        currentUser.blockedUsers.pull(userIdToBlock);
        // Optionally remove from followers/following if they were
        currentUser.following.pull(userIdToBlock);
        currentUser.followers.pull(userIdToBlock);
        await currentUser.save();
        res.status(200).json({ message: 'User unblocked successfully', isBlocked: false });
      } else {
        // Block
        currentUser.blockedUsers.push(userIdToBlock);
        // Also ensure they are unfollowed if currently following
        currentUser.following.pull(userIdToBlock);
        targetUser.followers.pull(req.userId); // Remove current user from target's followers
        await currentUser.save();
        await targetUser.save(); // Save target user to update their followers list
        res.status(200).json({ message: 'User blocked successfully', isBlocked: true });
      }
    } catch (error) {
      console.error('Toggle block user error:', error);
      res.status(500).json({ message: 'Failed to toggle block user' });
    }
  }
};

module.exports = userController;