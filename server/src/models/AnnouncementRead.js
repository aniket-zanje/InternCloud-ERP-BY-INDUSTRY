const mongoose = require('mongoose');

const announcementReadSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required']
  },
  announcementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Announcement',
    required: [true, 'Announcement ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, { timestamps: true });

// Recommended index from schema document
announcementReadSchema.index(
  { organizationId: 1, announcementId: 1, userId: 1 },
  { unique: true }
);

module.exports = mongoose.model('AnnouncementRead', announcementReadSchema);