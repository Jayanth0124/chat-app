import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    trim: true,
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'document', 'system', 'call', 'snap'],
    default: 'text'
  },
  mediaUrl: {
    type: String,
    default: null
  },
  mediaSource: {
    type: String,
    enum: ['camera', 'gallery'],
    default: null
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'seen'],
    default: 'sent'
  },
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],
  // Vanish Mode / View Once Message properties
  isViewOnce: {
    type: Boolean,
    default: false
  },
  isViewed: {
    type: Boolean,
    default: false
  },
  opened: {
    type: Boolean,
    default: false
  },
  openedAt: {
    type: Date,
    default: null
  },
  // Auto-delete temporary messages logic
  expiresAt: {
    type: Date,
    default: undefined
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  // Unsend & Delete functionality
  isUnsent: {
    type: Boolean,
    default: false
  },
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Call Log tracking
  callData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, { timestamps: true });

// TTL index for temporary messages (if expiresAt is set, mongo deletes it automatically)
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Message', messageSchema);
