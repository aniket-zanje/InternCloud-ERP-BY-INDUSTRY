/**
 * STATIC AI PERFORMANCE DATA
 * --------------------------
 * The AI score is intentionally static for now (same numbers as the demo).
 * Later, replace getStaticAi() with a lookup of the latest AiInsight / Evaluation
 * for the intern, e.g.:
 *
 *   const insight = await AiInsight.findOne({ internId }).sort({ generatedAt: -1 });
 *   score        <- insight.metricsSnapshot.evaluationScore (or Evaluation.overallScore)
 *   strengths    <- insight.strengths
 *   improvements <- insight.improvementAreas
 *   breakdown    <- insight.metricsSnapshot (taskCompletionPercent, ...)
 *
 * The React side only talks to GET /api/intern/ai-score, so it needs no change.
 */
const getStaticAi = () => ({
  score: 82,
  level: 'Excellent',
  message: 'You’re in the top tier of your cohort and improving every week.',
  breakdown: [
    { label: 'Task completion efficiency', value: 85 },
    { label: 'Mentor feedback', value: 80 }
    // "Attendance" row is appended by the controller using REAL attendance
  ],
  strengths: [
    'Strong Python and ML fundamentals',
    'Consistently on-time delivery',
    'Clear documentation',
    'Good collaboration with mentor'
  ],
  improvements: [
    'Model deployment experience',
    'Unit testing practices',
    'Overfitting control',
    'Time estimation for large tasks'
  ],
  growth: [58, 62, 66, 65, 71, 74, 78, 80, 82]
});

module.exports = { getStaticAi };
