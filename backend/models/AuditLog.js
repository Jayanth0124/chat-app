import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true // e.g. 'BAN_USER', 'UNBAN_USER'
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true // User ID, Chat ID, etc.
  },
  targetModel: {
    type: String,
    required: true,
    enum: ['User', 'Chat', 'Message']
  },
  details: {
    type: String
  }
}, { timestamps: true });

export default mongoose.model('AuditLog', auditLogSchema);
