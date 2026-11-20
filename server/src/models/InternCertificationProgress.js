const mongoose = require('mongoose');

const internCertificationProgressSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  internId: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true, index: true },
  domainCertificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'DomainCertification', required: true },
  completedRequirements: [{ type: String, trim: true }],
  progressPercent: { type: Number, min: 0, max: 100, default: 0 },
  status: { type: String, enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CERTIFIED'], default: 'NOT_STARTED' },
  certificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Certification' },
  completedAt: { type: Date }
}, { timestamps: true });

internCertificationProgressSchema.index({ internId: 1, domainCertificationId: 1 }, { unique: true });

module.exports = mongoose.models.InternCertificationProgress || mongoose.model('InternCertificationProgress', internCertificationProgressSchema);
