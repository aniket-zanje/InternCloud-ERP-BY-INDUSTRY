const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  notificationType: { type: String, enum: ['SYSTEM', 'TASK', 'ATTENDANCE', 'CERTIFICATE', 'ANNOUNCEMENT', 'APPLICATION'], default: 'SYSTEM' },
  relatedEntityId: { type: mongoose.Schema.Types.ObjectId },
  relatedEntityType: { type: String, trim: true },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date }
}, { timestamps: true });

notificationSchema.index({ recipientId:  1, createdAt: -1 });
notificationSchema.index({ organizationId: 1, recipientId: 1, isRead: 1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
