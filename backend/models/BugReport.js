import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  response: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

const bugReportSchema = new mongoose.Schema({
  reportId: {
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
  title: {
    type: String,
    required: true,
    trim: true
  },
  reproductionSteps: {
    type: String,
    trim: true
  },
  stepsToReproduce: {
    type: String,
    trim: true
  },
  expectedBehavior: {
    type: String,
    required: true,
    trim: true
  },
  actualBehavior: {
    type: String,
    required: true,
    trim: true
  },
  screenshot: {
    type: String,
    default: ""
  },
  notes: {
    type: String,
    trim: true,
    default: ""
  },
  additionalNotes: {
    type: String,
    trim: true,
    default: ""
  },
  status: {
    type: String,
    enum: ['Open', 'Investigating', 'Fixed', 'Duplicate', 'Resolved', 'Closed'],
    default: 'Open'
  },
  adminNotes: {
    type: String,
    default: ""
  },
  replies: [replySchema]
}, { timestamps: true });

// Pre-save hook to generate reportId and sync compatibility fields
bugReportSchema.pre('save', function () {
  if (!this.reportId) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const ts = Date.now().toString().slice(-4);
    this.reportId = `BUG-${ts}-${rand}`;
  }
  if (!this.userId) {
    this.userId = this.user;
  }
  if (!this.reproductionSteps && this.stepsToReproduce) {
    this.reproductionSteps = this.stepsToReproduce;
  } else if (!this.stepsToReproduce && this.reproductionSteps) {
    this.stepsToReproduce = this.reproductionSteps;
  }
  if (!this.notes && this.additionalNotes) {
    this.notes = this.additionalNotes;
  } else if (!this.additionalNotes && this.notes) {
    this.additionalNotes = this.notes;
  }
});

export default mongoose.model('BugReport', bugReportSchema);
