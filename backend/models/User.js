import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 4,
    maxlength: 20,
    match: /^[a-z0-9_.]+$/
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePic: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    default: "",
    maxlength: 150,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'banned', 'suspended'],
    default: 'active'
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  usernameChanges: {
    type: Number,
    default: 0
  },
  maxUsernameChanges: {
    type: Number,
    default: 3
  },
  previousUsernames: [{
    type: String
  }],
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  sentRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  archivedChats: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat'
  }],
  pinnedChats: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat'
  }],
  mutedChats: [{
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat'
    },
    mutedUntil: {
      type: Date // null means muted forever
    }
  }],
  privacySettings: {
    readReceipts: { type: Boolean, default: true },
    onlineStatus: { type: String, enum: ['everyone', 'friends', 'specific_friends', 'nobody', 'true', 'false'], default: 'nobody' },
    onlineStatusAllowed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    accountPrivacy: { type: String, enum: ['public', 'private'], default: 'public' }
  },
  socialLinks: {
    website: { type: String, default: "" },
    instagram: { type: String, default: "" },
    twitter: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    youtube: { type: String, default: "" },
    discord: { type: String, default: "" }
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastViewed: {
    stories: { type: Date, default: Date.now },
    calls: { type: Date, default: Date.now },
    notifications: { type: Date, default: Date.now }
  },
  lifetimeMetrics: {
    messagesSent: { type: Number, default: 0 },
    storiesPosted: { type: Number, default: 0 },
    callsMade: { type: Number, default: 0 },
    reportsReceived: { type: Number, default: 0 }
  },
  mutedUntil: {
    type: Date,
    default: null
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
