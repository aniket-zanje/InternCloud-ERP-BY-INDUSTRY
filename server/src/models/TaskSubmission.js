const mongoose = require('mongoose');

const taskSubmissionSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required']
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Task ID is required']
  },
  internId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intern',
    required: [true, 'Intern ID is required']
  },
  submissionText: {
    type: String
  },
  submissionLinks: [{
    type: String,
    trim: true
  }],
  submittedAt: {
    type: Date,
    required: [true, 'Submitted date is required'],
    default: Date.now
  },
  attemptNumber: {
    type: Number,
    required: [true, 'Attempt number is required'],
    min: [1, 'Attempt number must be a positive integer'],
    validate: {
      validator: Number.isInteger,
      message: 'Attempt number must be an integer'
    }
  },
  reviewStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUIRED'],
    default: 'PENDING'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date
  },
  score: {
    type: Number,
    min: [0, 'Score cannot be negative']
  },
  mentorComment: {
    type: String
  }
}, { timestamps: true });

// Recommended index from schema document
taskSubmissionSchema.index({ organizationId: 1, taskId: 1, internId: 1, attemptNumber: -1 });

module.exports = mongoose.model('TaskSubmission', taskSubmissionSchema);