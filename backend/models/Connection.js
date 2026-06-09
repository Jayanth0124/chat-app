import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  totalScore: { type: Number, default: 0 },
  chatCount: { type: Number, default: 0 },
  voiceCallDuration: { type: Number, default: 0 }, // in seconds
  videoCallDuration: { type: Number, default: 0 }, // in seconds
}, { timestamps: true });

// Ensure unique index so two users only have one connection document regardless of order
connectionSchema.index({ users: 1 });

export default mongoose.model('Connection', connectionSchema);
