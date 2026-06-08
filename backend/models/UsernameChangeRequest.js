import mongoose from 'mongoose';

const usernameChangeRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requestedUsername: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    minlength: 4,
    maxlength: 20,
    match: /^[a-z0-9_.]+$/,
  },
  reason: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  adminNotes: {
    type: String,
    default: '',
  }
}, { timestamps: true });

const UsernameChangeRequest = mongoose.model('UsernameChangeRequest', usernameChangeRequestSchema);

export default UsernameChangeRequest;
