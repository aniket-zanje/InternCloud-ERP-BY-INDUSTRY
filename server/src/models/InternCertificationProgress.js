const mongoose = require('mongoose');

const internCertificationProgressSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required']
  },
  internId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intern',
    required: [true, 'Intern ID is required']
  },
  domainCertificationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DomainCertification',
    required: [true, 'Domain certification ID is required']
  },
  completedTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  completionPercent: {
    type: Number,
    default: 0,
    min: [0, 'Completion percent cannot be negative'],
    max: [100, 'Completion percent cannot exceed 100']
  },
  attendancePercent: {
    type: Number,
    default: 0,
    min: [0, 'Attendance percent cannot be negative'],
    max: [100, 'Attendance percent cannot exceed 100']
  },
  evaluationScore: {
    type: Number,
    min: [0, 'Evaluation score cannot be negative']
  },
  eligibilityStatus: {
    type: String,
    enum: ['LOCKED', 'IN_PROGRESS', 'ELIGIBLE', 'CERTIFIED'],
    default: 'LOCKED'
  },
  certificateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certification',
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Recommended index from schema document
internCertificationProgressSchema.index(
  { organizationId: 1, internId: 1, domainCertificationId: 1 },
  { unique: true }
);

module.exports = mongoose.model('InternCertificationProgress', internCertificationProgressSchema);