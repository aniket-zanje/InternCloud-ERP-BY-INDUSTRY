const mongoose = require('mongoose');

const domainCertificationSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required']
  },
  domain: {
    type: String,
    required: [true, 'Domain is required'],
    trim: true
  },
  certificationName: {
    type: String,
    required: [true, 'Certification name is required'],
    trim: true
  },
  description: {
    type: String
  },
  requiredTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  minimumScore: {
    type: Number,
    min: [0, 'Minimum score cannot be negative']
  },
  minimumAttendance: {
    type: Number,
    min: [0, 'Minimum attendance cannot be negative'],
    max: [100, 'Minimum attendance cannot exceed 100']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  }
}, { timestamps: true });

module.exports = mongoose.model('DomainCertification', domainCertificationSchema);