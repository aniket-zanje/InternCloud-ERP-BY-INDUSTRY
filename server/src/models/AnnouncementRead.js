const mongoose = require('mongoose');

const announcementReadSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  announcementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Announcement', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  readAt: { type: Date, default: Date.now }
}, { timestamps: true });

announcementReadSchema.index({ announcementId: 1, userId: 1 }, { unique: true });
announcementReadSchema.index({ organizationId: 1, userId: 1 });

module.exports = mongoose.models.AnnouncementRead || mongoose.model('AnnouncementRead', announcementReadSchema);
