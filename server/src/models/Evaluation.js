const mongoose = require('mongoose');

// Reusable 0-100 score field config
const scoreField = {
  type: Number,
  min: [0, 'Score cannot be below 0'],
  max: [100, 'Score cannot exceed 100']
};

const evaluationSchema = new mongoose.Schema({
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
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Mentor ID is required']
  },
  evaluationPeriod: {
    type: String,
    enum: ['WEEKLY', 'MONTHLY', 'FINAL'],
    required: [true, 'Evaluation period is required']
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
  taskCompletionScore: scoreField,
  attendanceScore: scoreField,
  workQualityScore: scoreField,
  technicalSkillsScore: scoreField,
  communicationScore: scoreField,
  teamworkScore: scoreField,
  disciplineScore: scoreField,
  overallScore: {
    type: Number,
    min: [0, 'Overall score cannot be below 0'],
    max: [100, 'Overall score cannot exceed 100']
  },
  mentorFeedback: {
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
  evaluatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Recommended index from schema document
evaluationSchema.index({ organizationId: 1, internId: 1, periodStart: -1 });

module.exports = mongoose.model('Evaluation', evaluationSchema);