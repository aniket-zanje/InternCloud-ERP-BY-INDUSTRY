const mongoose = require('mongoose');

const domainCertificationSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  domain: { type: String, required: true, trim: true },
  certificateTitle: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  issuingAuthority: { type: String, trim: true },
  validityMonths: { type: Number, min: 0 },
  requiredSkills: [{ type: String, trim: true }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

domainCertificationSchema.index({ organizationId: 1, domain: 1, certificateTitle: 1 }, { unique: true });

module.exports = mongoose.models.DomainCertification || mongoose.model('DomainCertification', domainCertificationSchema);
