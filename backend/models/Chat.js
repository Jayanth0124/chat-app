import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  isGroupChat: {
    type: Boolean,
    default: false
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  latestMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  groupName: {
    type: String,
    trim: true
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  vanishMode: {
    type: String,
    enum: ['OFF', 'VIEW ONCE', '10 SECONDS', '1 MINUTE'],
    default: 'OFF'
  }
}, { timestamps: true });

export default mongoose.model('Chat', chatSchema);
