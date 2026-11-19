const mongoose = require('mongoose');

const virtualIdSchema = new mongoose.Schema({
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
    required: [true, 'User ID is required']
  },
  virtualIdNumber: {
    type: String,
    required: [true, 'Virtual ID number is required'],
    trim: true
  },
  qrCode: {
    type: String,
    trim: true
  },
  issueDate: {
    type: Date,
    required: [true, 'Issue date is required']
  },
  expiryDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED', 'REVOKED'],
    default: 'ACTIVE'
  }
}, { timestamps: true });

// Recommended index: choose ONE based on your uniqueness policy
// Option A: globally unique
virtualIdSchema.index({ virtualIdNumber: 1 }, { unique: true });

// Option B: unique per organization (comment out Option A if using this)
// virtualIdSchema.index({ organizationId: 1, virtualIdNumber: 1 }, { unique: true });

module.exports = mongoose.model('VirtualId', virtualIdSchema);