const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  internId: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  certificateType: { type: String, enum: ['INTERNSHIP', 'DOMAIN', 'COMPLETION'], default: 'INTERNSHIP' },
  certificateTitle: { type: String, required: true, trim: true },
  domain: { type: String, trim: true },
  certificateNumber: { type: String, required: true, trim: true, uppercase: true },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  issueDate: { type: Date },
  status: { type: String, enum: ['PENDING', 'ISSUED', 'REVOKED'], default: 'PENDING' },
  certificateUrl: { type: String, trim: true },
  revokedAt: { type: Date },
  revocationReason: { type: String, trim: true }
}, { timestamps: true });

certificationSchema.index({ certificateNumber: 1 }, { unique: true });
certificationSchema.index({ organizationId: 1, internId: 1, certificateType: 1 }, { unique: true });

module.exports = mongoose.models.Certification || mongoose.model('Certification', certificationSchema);
