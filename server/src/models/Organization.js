const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  organizationName: { type: String, required: true, trim: true },
  organizationCode: { type: String, required: true, trim: true, uppercase: true },
  email: { type: String, trim: true, lowercase: true, match: /^\S+@\S+\.\S+$/ },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  industry: { type: String, trim: true },
  logo: { type: String, trim: true },
  website: { type: String, trim: true },
  primaryAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], default: 'ACTIVE' }
}, { timestamps: true });

organizationSchema.index({ organizationCode: 1 }, { unique: true });
organizationSchema.index({ email: 1 }, { sparse: true });

module.exports = mongoose.models.Organization || mongoose.model('Organization', organizationSchema);
