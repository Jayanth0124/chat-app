import mongoose from 'mongoose';

const usernameOwnershipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  acquiredAt: {
    type: Date,
    default: Date.now,
  },
  releasedAt: {
    type: Date,
    default: null, // Null means it is permanently reserved by this user
  }
}, { timestamps: true });

// Ensure fast lookups by username
usernameOwnershipSchema.index({ username: 1 });

const UsernameOwnership = mongoose.model('UsernameOwnership', usernameOwnershipSchema);

export default UsernameOwnership;
