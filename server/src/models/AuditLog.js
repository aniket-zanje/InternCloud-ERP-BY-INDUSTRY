const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null // null for platform-level Super Admin actions
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // nullable to allow system actions
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    trim: true
  },
  module: {
    type: String,
    required: [true, 'Module is required'],
    trim: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  entityType: {
    type: String,
    trim: true
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  ipAddress: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
    default: Date.now
  }
}, {
  timestamps: { createdAt: true, updatedAt: false } // immutable log: omit updatedAt
});

// Recommended index from schema document
auditLogSchema.index({ organizationId: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);