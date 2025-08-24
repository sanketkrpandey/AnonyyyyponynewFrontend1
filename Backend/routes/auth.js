const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Send OTP for registration/login
router.post('/send-otp', authController.sendOTP);

// Verify OTP for registration
router.post('/verify-otp', authController.verifyOTP);

// Login (send OTP)
router.post('/login', authController.login);  

// Verify login OTP
router.post('/verify-login-otp', authController.verifyLoginOTP);

// Check if user is authenticated and get their basic info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const User = require('../models/User'); // Re-require to avoid circular dependency
    const user = await User.findById(req.userId).select('-otp -email'); // Exclude sensitive fields
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error('Get /me error:', error);
    res.status(500).json({ message: 'Failed to get user info' });
  }
});

module.exports = router;