const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Message is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  audience: {
    type: String,
    enum: ['ALL_USERS', 'MENTORS', 'CANDIDATES', 'ACTIVE_INTERNS', 'SPECIFIC_USERS'],
    required: [true, 'Audience is required']
  },
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  publishedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    default: 'DRAFT'
  }
}, { timestamps: true });

// Validate targetUsers is provided only when audience is SPECIFIC_USERS
announcementSchema.pre('validate', function (next) {
  if (this.audience === 'SPECIFIC_USERS' && (!this.targetUsers || this.targetUsers.length === 0)) {
    return next(new Error('targetUsers is required when audience is SPECIFIC_USERS'));
  }
  if (this.audience !== 'SPECIFIC_USERS') {
    this.targetUsers = [];
  }
  next();
});

module.exports = mongoose.model('Announcement', announcementSchema);