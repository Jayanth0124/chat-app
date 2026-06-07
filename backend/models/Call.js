import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
  caller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['voice', 'video'],
    default: 'voice'
  },
  status: {
    type: String,
    enum: ['missed', 'completed', 'rejected'],
    default: 'missed'
  },
  duration: {
    type: Number, // seconds
    default: 0
  }
}, { timestamps: true });

callSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

export default mongoose.model('Call', callSchema);
