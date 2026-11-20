const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  audience: { type: String, enum: ['ALL', 'INTERNS', 'MENTORS', 'ADMINS'], default: 'ALL' },
  priority: { type: String, enum: ['LOW', 'NORMAL', 'HIGH'], default: 'NORMAL' },
  publishAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'PUBLISHED' },
  attachments: [{ name: { type: String, trim: true }, url: { type: String, trim: true } }]
}, { timestamps: true });

announcementSchema.index({ organizationId: 1, status: 1, publishAt: -1 });

module.exports = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);
