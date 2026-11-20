const mongoose = require('mongoose');

const aiInsightSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  internId: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true, index: true },
  generatedAt: { type: Date, default: Date.now },
  modelName: { type: String, trim: true },
  metricsSnapshot: {
    evaluationScore: { type: Number, min: 0, max: 100 },
    taskCompletionPercent: { type: Number, min: 0, max: 100 },
    attendancePercent: { type: Number, min: 0, max: 100 }
  },
  strengths: [{ type: String, trim: true }],
  improvementAreas: [{ type: String, trim: true }],
  summary: { type: String, trim: true },
  rawResponse: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

aiInsightSchema.index({ internId: 1, generatedAt: -1 });

module.exports = mongoose.models.AiInsight || mongoose.model('AiInsight', aiInsightSchema);
