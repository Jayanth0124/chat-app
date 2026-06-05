import mongoose from 'mongoose';

const securityLogSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  ip: {
    type: String,
    default: '127.0.0.1'
  },
  deviceInfo: {
    type: String,
    default: 'Web Browser'
  },
  logType: {
    type: String,
    enum: ['failed_login', 'suspicious_device'],
    required: true
  },
  attempts: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['active', 'blocked'],
    default: 'active'
  }
}, { timestamps: true });

export default mongoose.model('SecurityLog', securityLogSchema);
