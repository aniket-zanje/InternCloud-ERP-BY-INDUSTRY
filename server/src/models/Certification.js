const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
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
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient user ID is required']
  },
  certificateTitle: {
    type: String,
    required: [true, 'Certificate title is required'],
    trim: true
  },
  domain: {
    type: String,
    trim: true
  },
  certificateType: {
    type: String,
    enum: ['INTERNSHIP', 'DOMAIN', 'ACHIEVEMENT'],
    required: [true, 'Certificate type is required']
  },
  certificateNumber: {
    type: String,
    required: [true, 'Certificate number is required'],
    trim: true
  },
  issueDate: {
    type: Date,
    required: [true, 'Issue date is required']
  },
  expiryDate: {
    type: Date
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Issuer is required']
  },
  certificateUrl: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ISSUED', 'REVOKED'],
    default: 'PENDING'
  }
}, { timestamps: true });

// Recommended index: choose ONE based on your uniqueness policy
// Option A: globally unique
certificationSchema.index({ certificateNumber: 1 }, { unique: true });

// Option B: unique per organization (comment out Option A if using this)
// certificationSchema.index({ organizationId: 1, certificateNumber: 1 }, { unique: true });

module.exports = mongoose.model('Certification', certificationSchema);