const mongoose = require('mongoose');

const internSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: [true, 'Application ID is required']
  },
  openingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InternshipOpening',
    required: [true, 'Opening ID is required']
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned by user is required']
  },
  domain: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  projectTitle: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  internshipStatus: {
    type: String,
    enum: ['UPCOMING', 'ACTIVE', 'COMPLETED', 'TERMINATED'],
    default: 'UPCOMING'
  },
  internshipType: {
    type: String,
    enum: ['PAID', 'UNPAID'],
    required: [true, 'Internship type is required']
  },
  stipendAmount: {
    type: Number,
    min: [0, 'Stipend amount cannot be negative'],
    default: 0
  },
  virtualId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VirtualId',
    default: null
  }
}, { timestamps: true });

// Recommended indexes from schema document
internSchema.index({ organizationId: 1, applicationId: 1 }, { unique: true });
internSchema.index({ organizationId: 1, mentorId: 1, internshipStatus: 1 });

module.exports = mongoose.model('Intern', internSchema);