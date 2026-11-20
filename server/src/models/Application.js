const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  openingId: { type: mongoose.Schema.Types.ObjectId, ref: 'InternshipOpening', required: true, index: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  applicationStatus: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'SELECTED', 'REJECTED', 'WITHDRAWN'],
    default: 'SUBMITTED'
  },
  coverLetter: { type: String, trim: true },
  resumeUrl: { type: String, trim: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  remarks: { type: String, trim: true }
}, { timestamps: true });

applicationSchema.index({ organizationId: 1, openingId: 1, candidateId: 1 }, { unique: true });

module.exports = mongoose.models.Application || mongoose.model('Application', applicationSchema);
