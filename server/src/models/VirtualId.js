const mongoose = require('mongoose');

const virtualIdSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  internId: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  virtualIdNumber: { type: String, required: true, trim: true, uppercase: true },
  qrCode: { type: String, trim: true },
  issueDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'REVOKED'], default: 'ACTIVE' }
}, { timestamps: true });

virtualIdSchema.index({ virtualIdNumber:  1 }, { unique: true });
virtualIdSchema.index({ organizationId: 1, internId: 1 }, { unique: true });

module.exports = mongoose.models.VirtualId || mongoose.model('VirtualId', virtualIdSchema);
