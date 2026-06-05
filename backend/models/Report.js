import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: ['Spam', 'Harassment', 'Inappropriate Content', 'Hate Speech', 'Other'],
    default: 'Other'
  },
  details: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'dismissed'],
    default: 'pending'
  }
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
