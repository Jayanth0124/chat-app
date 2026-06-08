import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['message', 'friendRequest', 'friendAccepted', 'system', 'bug_update', 'support_reply', 'admin'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  isPermanent: {
    type: Boolean,
    default: false,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  expiresAt: {
    type: Date,
  }
}, { timestamps: true });

// Optional: Index to easily clear old non-permanent notifications
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60, partialFilterExpression: { isPermanent: false } });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
