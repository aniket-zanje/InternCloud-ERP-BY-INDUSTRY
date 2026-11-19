const mongoose = require('mongoose');

const stipendSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required']
  },
  internId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intern',
    required: [true, 'Intern ID is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  type: {
    type: String,
    enum: ['PAID', 'UNPAID'],
    required: [true, 'Type is required']
  },
  period: {
    type: String,
    enum: ['MONTHLY', 'TOTAL'],
    required: [true, 'Period is required']
  },
  paymentMonth: {
    type: String,
    trim: true,
    match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'paymentMonth must be in YYYY-MM format']
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PROCESSED', 'ON_HOLD'],
    default: 'PENDING'
  },
  notes: {
    type: String,
    trim: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  processedAt: {
    type: Date
  }
}, { timestamps: true });

// Validate paymentMonth is required when period is MONTHLY
stipendSchema.pre('validate', function (next) {
  if (this.period === 'MONTHLY' && !this.paymentMonth) {
    return next(new Error('paymentMonth is required for MONTHLY stipends'));
  }
  next();
});

// Recommended index from schema document
stipendSchema.index({ organizationId: 1, internId: 1, paymentMonth: 1 });

module.exports = mongoose.model('Stipend', stipendSchema);