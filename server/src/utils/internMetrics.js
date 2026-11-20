const Task = require('../models/Task');
const { getAttendanceSummary } = require('./attendance');
const { daysBetween } = require('./dates');
const { SUBMITTABLE, uiStatus } = require('./taskStatus');
const { getStaticAi } = require('./staticAi');
const { CERT_MIN_ATTENDANCE, CERT_MIN_AI_SCORE } = require('./internRules');

/** One place that computes every number the dashboard shows. */
async function getMetrics(ctx) {
  const { intern } = ctx;

  const [att, tasks] = await Promise.all([
    getAttendanceSummary(intern),
    Task.find({ organizationId: intern.organizationId, internId: intern._id })
      .select('title status dueDate')
      .sort({ dueDate: 1 })
      .lean()
  ]);

  const total = daysBetween(att.startKey, att.endKey) + 1;
  const elapsed = Math.min(Math.max(daysBetween(att.startKey, att.today) + 1, 0), total);
  const completed = intern.internshipStatus === 'COMPLETED' || att.today > att.endKey;

  return {
    att,
    tasks,
    totalDays: total,
    elapsedDays: elapsed,
    completed,
    progressPercent: completed ? 100 : Math.round((elapsed / total) * 100),
    daysRemaining: completed ? 0 : total - elapsed,
    pendingCount: tasks.filter((t) => SUBMITTABLE.includes(t.status)).length,
    tasksDone: tasks.filter((t) => uiStatus(t.status) !== 'pending').length,
    tasksTotal: tasks.length,
    aiScore: getStaticAi().score
  };
}

const buildCriteria = (m) => [
  { label: 'Internship duration completed', met: m.completed },
  {
    label: `Attendance of at least ${CERT_MIN_ATTENDANCE}% (yours: ${m.att.pct}%)`,
    met: m.att.pct >= CERT_MIN_ATTENDANCE
  },
  { label: 'All assigned tasks submitted', met: m.pendingCount === 0 },
  {
    label: `AI score of ${CERT_MIN_AI_SCORE} or above (yours: ${m.aiScore})`,
    met: m.aiScore >= CERT_MIN_AI_SCORE
  }
];

module.exports = { getMetrics, buildCriteria };
