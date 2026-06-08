import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  response: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const supportTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Account Issue', 'Messaging Issue', 'Privacy Issue', 'Technical Issue', 'Feature Request', 'Other']
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Waiting For User', 'Resolved', 'Closed'],
    default: 'Open'
  },
  replies: [replySchema]
}, { timestamps: true });

// Pre-save hook to populate ticketId and userId compatibility
supportTicketSchema.pre('save', function () {
  if (!this.ticketId) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const ts = Date.now().toString().slice(-4);
    this.ticketId = `TK-${ts}-${rand}`;
  }
  if (!this.userId) {
    this.userId = this.user;
  }
});

export default mongoose.model('SupportTicket', supportTicketSchema);
