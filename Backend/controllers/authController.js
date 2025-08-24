const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // Not used in provided code but kept for context if needed

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  port: 587, // TLS
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Anonymous Social - Email Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Your OTP for email verification is:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
          ${otp}
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '7d'
  });
};

const authController = {
  // Send OTP for verification
  sendOTP: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email.endsWith('@pec.edu.in')) {
        return res.status(400).json({
          message: 'Only @pec.edu.in email addresses are allowed'
        });
      }

      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      let user = await User.findOne({ email });
      if (!user) {
        user = new User({
          email,
          anonymousName: '', // Will be set during verification for new users
          otp: {
            code: otp,
            expiresAt: otpExpiry
          }
        });
      } else {
        user.otp = {
          code: otp,
          expiresAt: otpExpiry
        };
      }

      await user.save();
      await sendOTPEmail(email, otp);

      res.status(200).json({
        message: 'OTP sent successfully to your email',
        email: email
      });
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({ message: 'Failed to send OTP' });
    }
  },

  // Verify OTP and complete registration
  verifyOTP: async (req, res) => {
    try {
      const { email, otp, anonymousName } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      if (!user.otp || user.otp.code !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      if (new Date() > user.otp.expiresAt) {
        return res.status(400).json({ message: 'OTP has expired' });
      }

      // Check if anonymous name is provided for new users (or if user isn't verified yet)
      if (!user.isVerified && !anonymousName) {
        return res.status(400).json({ message: 'Anonymous name is required' });
      }

      // Check if anonymous name is unique
      if (anonymousName && anonymousName !== user.anonymousName) { // Only check if name is provided and changed
        const existingUser = await User.findOne({
          anonymousName,
          _id: { $ne: user._id }
        });
        if (existingUser) {
          return res.status(400).json({
            message: 'Anonymous name already taken. Please choose another.'
          });
        }
        user.anonymousName = anonymousName;
      }

      user.isVerified = true;
      user.otp = undefined; // Clear OTP after successful verification
      await user.save();

      const token = generateToken(user._id);

      res.status(200).json({
        message: 'Email verified successfully',
        token,
        user: {
          id: user._id,
          email: user.email,
          anonymousName: user.anonymousName,
          avatar: user.avatar,
          isVerified: user.isVerified
        }
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ message: 'Failed to verify OTP' });
    }
  },

  // Login (send OTP to existing user)
  login: async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email, isVerified: true });
      if (!user) {
        return res.status(400).json({
          message: 'User not found or not verified. Please register first.'
        });
      }

      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      user.otp = {
        code: otp,
        expiresAt: otpExpiry
      };
      await user.save();

      await sendOTPEmail(email, otp);

      res.status(200).json({
        message: 'OTP sent to your email for login',
        email: email
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Failed to initiate login' });
    }
  },

  // Verify login OTP
  verifyLoginOTP: async (req, res) => {
    try {
      const { email, otp } = req.body;

      const user = await User.findOne({ email, isVerified: true });
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      if (!user.otp || user.otp.code !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      if (new Date() > user.otp.expiresAt) {
        return res.status(400).json({ message: 'OTP has expired' });
      }

      user.otp = undefined;
      await user.save();

      const token = generateToken(user._id);

      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          anonymousName: user.anonymousName,
          avatar: user.avatar,
          isVerified: user.isVerified
        }
      });
    } catch (error) {
      console.error('Verify login OTP error:', error);
      res.status(500).json({ message: 'Failed to verify login OTP' });
    }
  }
};

module.exports = authController;