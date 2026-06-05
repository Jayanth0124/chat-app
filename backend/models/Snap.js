import mongoose from 'mongoose';

const snapSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  publicId: {
    type: String, // Cloudinary public_id for deletion
    required: true
  },
  viewed: {
    type: Boolean,
    default: false
  },
  viewedAt: {
    type: Date
  }
}, { timestamps: true });

export default mongoose.model('Snap', snapSchema);
