const mongoose = require('mongoose');

const stipendSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  internId: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, uppercase: true, trim: true, default: 'INR' },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  dueDate: { type: Date },
  paidAt: { type: Date },
  paymentReference: { type: String, trim: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'PAID', 'ON_HOLD', 'CANCELLED'], default: 'PENDING' },
  remarks: { type: String, trim: true },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

stipendSchema.index({ organizationId: 1, internId: 1, periodStart: 1, periodEnd: 1 });

module.exports = mongoose.models.Stipend || mongoose.model('Stipend', stipendSchema);
