const mongoose = require('mongoose');

const taskSubmissionSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
  internId: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true, index: true },
  submissionText: { type: String, trim: true },
  submissionLinks: [{ type: String, trim: true }],
  submittedAt: { type: Date, default: Date.now },
  attemptNumber: { type: Number, required: true, min: 1, default: 1 },
  reviewStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REVISION_REQUIRED', 'REJECTED'], default: 'PENDING' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  score: { type: Number, min: 0, max: 10 },
  mentorComment: { type: String, trim: true }
}, { timestamps: true });

taskSubmissionSchema.index({ organizationId: 1, internId: 1, taskId: 1, attemptNumber: -1 });
taskSubmissionSchema.index({ taskId: 1, internId: 1, attemptNumber: 1 }, { unique: true });

module.exports = mongoose.models.TaskSubmission || mongoose.model('TaskSubmission', taskSubmissionSchema);
