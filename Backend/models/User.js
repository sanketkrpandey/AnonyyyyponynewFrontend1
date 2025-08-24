  const mongoose = require('mongoose');
  const bcrypt = require('bcryptjs');

  const userSchema = new mongoose.Schema({
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function(email) {
          return email.endsWith('@pec.edu.in');
        },
        message: 'Only @pec.edu.in emails are allowed'
      }
    },
    anonymousName: {
      type: String,
    
      unique: true,
      maxlength: 20
    },
    avatar: {
      type: String,
      default: null
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    otp: {
      code: String,
      expiresAt: Date
    },
    posts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }],
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    blockedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  }, {
    timestamps: true
  });

  // Generate anonymous name
  userSchema.methods.generateAnonymousName = function() {
    const adjectives = ['Cool', 'Smart', 'Funny', 'Creative', 'Brave', 'Quick', 'Silent', 'Bold'];
    const nouns = ['Tiger', 'Eagle', 'Wolf', 'Fox', 'Lion', 'Bear', 'Hawk', 'Shark'];
    const randomNum = Math.floor(Math.random() * 1000);

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];

    return `${adjective}${noun}${randomNum}`;
  };

  module.exports = mongoose.model('User', userSchema);