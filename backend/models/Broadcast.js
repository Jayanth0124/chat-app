import mongoose from 'mongoose';

const broadcastSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  audience: {
    type: String,
    required: true
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  message: {
    type: String,
    required: true
  },
  isPermanent: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Auto-delete broadcast documents at their specific expiresAt date
broadcastSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Broadcast', broadcastSchema);
