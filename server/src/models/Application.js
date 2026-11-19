const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'SELECTED', 'WITHDRAWN'],
    required: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  remarks: {
    type: String,
    trim: true
  }
}, { _id: false }); // Append-only history: no separate _id needed

const answerSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true
  }
}, { _id: false });

const applicationSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required']
  },
  openingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InternshipOpening',
    required: [true, 'Opening ID is required']
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Candidate ID is required']
  },
  applicationStatus: {
    type: String,
    enum: ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'SELECTED', 'WITHDRAWN'],
    default: 'APPLIED'
  },
  coverLetter: {
    type: String
  },
  answers: {
    type: [answerSchema],
    default: []
  },
  resumeUrl: {
    type: String,
    trim: true
  },
  portfolioUrl: {
    type: String,
    trim: true
  },
  githubUrl: {
    type: String,
    trim: true
  },
  linkedinUrl: {
    type: String,
    trim: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  statusHistory: {
    type: [statusHistorySchema],
    default: []
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Recommended indexes from schema document
applicationSchema.index(
  { organizationId: 1, openingId: 1, candidateId: 1 },
  { unique: true }
);
applicationSchema.index({ organizationId: 1, applicationStatus: 1, appliedAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);