const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  internId: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true, index: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category: { type: String, enum: ['MENTOR', 'INTERNSHIP', 'TASK', 'GENERAL'], default: 'GENERAL' },
  rating: { type: Number, min: 1, max: 5 },
  comments: { type: String, trim: true, required: true },
  isAnonymous: { type: Boolean, default: false },
  status: { type: String, enum: ['OPEN', 'REVIEWED', 'CLOSED'], default: 'OPEN' }
}, { timestamps: true });

feedbackSchema.index({ organizationId: 1, internId: 1, createdAt: -1 });

module.exports = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);
