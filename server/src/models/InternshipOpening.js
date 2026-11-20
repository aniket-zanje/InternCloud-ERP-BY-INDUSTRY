const mongoose = require('mongoose');

const internshipOpeningSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  domain: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  requiredSkills: [{ type: String, trim: true }],
  durationWeeks: { type: Number, min: 1 },
  startDate: { type: Date },
  endDate: { type: Date },
  totalSeats: { type: Number, min: 0, default: 0 },
  availableSeats: { type: Number, min: 0, default: 0 },
  stipendType: { type: String, enum: ['PAID', 'UNPAID', 'PERFORMANCE_BASED'], default: 'UNPAID' },
  stipendAmount: { type: Number, min: 0 },
  status: { type: String, enum: ['DRAFT', 'OPEN', 'CLOSED', 'CANCELLED'], default: 'DRAFT' }
}, { timestamps: true });

internshipOpeningSchema.index({ organizationId: 1, status: 1 });
internshipOpeningSchema.index({ organizationId: 1, title: 1 });

module.exports = mongoose.models.InternshipOpening || mongoose.model('InternshipOpening', internshipOpeningSchema);
