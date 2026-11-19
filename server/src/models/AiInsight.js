const mongoose = require('mongoose');

const metricsSnapshotSchema = new mongoose.Schema({
  attendancePercent: { type: Number, min: 0, max: 100 },
  taskCompletionPercent: { type: Number, min: 0, max: 100 },
  averageTaskScore: { type: Number, min: 0 },
  evaluationScore: { type: Number, min: 0, max: 100 },
  communicationScore: { type: Number, min: 0, max: 100 },
  teamworkScore: { type: Number, min: 0, max: 100 },
  disciplineScore: { type: Number, min: 0, max: 100 }
}, { _id: false });

const aiInsightSchema = new mongoose.Schema({
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
  evaluationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evaluation',
    default: null
  },
  periodStart: {
    type: Date,
    required: [true, 'Period start is required']
  },
  periodEnd: {
    type: Date,
    required: [true, 'Period end is required'],
    validate: {
      validator: function (value) {
        return value >= this.periodStart;
      },
      message: 'Period end must not precede period start'
    }
  },
  metricsSnapshot: {
    type: metricsSnapshotSchema,
    required: [true, 'Metrics snapshot is required']
  },
  summary: {
    type: String
  },
  strengths: [{
    type: String,
    trim: true
  }],
  improvementAreas: [{
    type: String,
    trim: true
  }],
  recommendations: [{
    type: String,
    trim: true
  }],
  performanceLevel: {
    type: String,
    enum: ['EXCELLENT', 'VERY_GOOD', 'GOOD', 'AVERAGE', 'NEEDS_IMPROVEMENT']
  },
  confidenceNote: {
    type: String
  },
  model: {
    type: String,
    trim: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Recommended index from schema document
aiInsightSchema.index({ organizationId: 1, internId: 1, generatedAt: -1 });

module.exports = mongoose.model('AiInsight', aiInsightSchema);