const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null // null only for platform-wide notices
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient ID is required']
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
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
  notificationType: {
    type: String,
    enum: [
      'TASK_ASSIGNED',
      'TASK_DEADLINE',
      'TASK_EVALUATED',
      'ATTENDANCE',
      'ANNOUNCEMENT',
      'CERTIFICATE',
      'SYSTEM'
    ],
    required: [true, 'Notification type is required']
  },
  relatedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  relatedEntityType: {
    type: String,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: { createdAt: true, updatedAt: false } // immutable: omit updatedAt
});

// Recommended index from schema document
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);