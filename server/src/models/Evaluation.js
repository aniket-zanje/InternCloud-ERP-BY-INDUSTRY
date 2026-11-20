const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  internId: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true, index: true },
  evaluatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  evaluationType: { type: String, enum: ['MID_TERM', 'FINAL', 'TASK'], default: 'FINAL' },
  overallScore: { type: Number, min: 0, max: 100 },
  criteria: [{ name: { type: String, trim: true }, score: { type: Number, min: 0, max: 100 }, comments: { type: String, trim: true } }],
  strengths: [{ type: String, trim: true }],
  improvementAreas: [{ type: String, trim: true }],
  comments: { type: String, trim: true },
  evaluatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

evaluationSchema.index({ organizationId: 1, internId: 1, evaluatedAt: -1 });

module.exports = mongoose.models.Evaluation || mongoose.model('Evaluation', evaluationSchema);
