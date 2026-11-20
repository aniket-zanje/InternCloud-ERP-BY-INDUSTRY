const mongoose = require('mongoose');
const Task = require('../models/Task');
const TaskSubmission = require('../models/TaskSubmission');
const User = require('../models/User');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { toKey, todayKey } = require('../utils/dates');
const { getInternContext } = require('../utils/internContext');
const { ensureVirtualId } = require('../utils/virtualId');
const { getMetrics, buildCriteria } = require('../utils/internMetrics');
const { getAttendanceSummary } = require('../utils/attendance');
const { SUBMITTABLE, uiStatus } = require('../utils/taskStatus');
const { getStaticAi } = require('../utils/staticAi');
const { removeUploaded } = require('../middleware/upload');

/* ------------------------------------------------------------------ */
/* GET /api/intern/profile  -> header, sidebar, Virtual ID card         */
/* ------------------------------------------------------------------ */
exports.getProfile = asyncHandler(async (req, res) => {
  const ctx = await getInternContext(req);
  const { user, intern, org, mentor } = ctx;

  const [vid, pendingTasks] = await Promise.all([
    ensureVirtualId(intern, org),
    Task.countDocuments({
      organizationId: intern.organizationId,
      internId: intern._id,
      status: { $in: SUBMITTABLE }
    })
  ]);

  res.json({
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      photo: user.profileImage || null,
      bloodGroup: user.bloodGroup || null
    },
    organization: {
      name: org?.organizationName || '',
      logo: org?.logo || null,
      address: org?.address || ''
    },
    intern: {
      id: intern._id,
      domain: intern.domain || '',
      role: ctx.role,
      startDate: toKey(intern.startDate),
      endDate: toKey(intern.endDate),
      status: intern.internshipStatus
    },
    mentor: mentor?.fullName || null,
    virtualId: {
      number: vid.virtualIdNumber,
      qrValue: vid.qrCode || vid.virtualIdNumber,
      validTill: toKey(vid.expiryDate || intern.endDate),
      status: vid.status
    },
    pendingTasks
  });
});

/* ------------------------------------------------------------------ */
/* PUT /api/intern/profile/photo   (multipart: photo)                   */
/* ------------------------------------------------------------------ */
exports.updatePhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw httpError(400, 'Please choose an image');

  const previous = req.user.profileImage;
  const photo = `/uploads/profile/${req.file.filename}`;

  await User.updateOne({ _id: req.user._id }, { profileImage: photo });
  removeUploaded(previous);

  res.json({ photo });
});

/* ------------------------------------------------------------------ */
/* GET /api/intern/overview                                             */
/* ------------------------------------------------------------------ */
exports.getOverview = asyncHandler(async (req, res) => {
  const ctx = await getInternContext(req);
  const m = await getMetrics(ctx);
  const criteria = buildCriteria(m);

  const upcoming = m.tasks
    .filter((t) => SUBMITTABLE.includes(t.status))
    .slice(0, 3)
    .map((t) => ({ id: t._id, title: t.title, dueDate: toKey(t.dueDate) }));

  res.json({
    stats: {
      tasksDone: m.tasksDone,
      tasksTotal: m.tasksTotal,
      attendancePercent: m.att.pct,
      aiScore: m.aiScore,
      daysRemaining: m.daysRemaining
    },
    progress: {
      percent: m.progressPercent,
      startDate: m.att.startKey,
      endDate: m.att.endKey
    },
    upcoming,
    certificateUnlocked: criteria.every((c) => c.met)
  });
});

/* ------------------------------------------------------------------ */
/* GET /api/intern/tasks                                                */
/* ------------------------------------------------------------------ */
exports.getTasks = asyncHandler(async (req, res) => {
  const { intern } = req;
  const today = todayKey();

  const tasks = await Task.find({
    organizationId: intern.organizationId,
    internId: intern._id
  })
    .sort({ dueDate: 1, assignedDate: 1 })
    .lean();

  const submissions = await TaskSubmission.find({
    organizationId: intern.organizationId,
    internId: intern._id,
    taskId: { $in: tasks.map((t) => t._id) }
  })
    .sort({ attemptNumber: -1 })
    .lean();

  // newest attempt first, so the first hit per task is the latest one
  const byTask = new Map();
  for (const s of submissions) {
    const k = String(s.taskId);
    if (!byTask.has(k)) byTask.set(k, []);
    byTask.get(k).push(s);
  }

  const items = tasks.map((t, i) => {
    const list = byTask.get(String(t._id)) || [];
    const latest = list[0];
    const reviewed = list.find((s) => s.reviewStatus !== 'PENDING');
    const status = uiStatus(t.status);
    const dueKey = toKey(t.dueDate);
    const canSubmit = SUBMITTABLE.includes(t.status);

    return {
      id: t._id,
      no: i + 1,
      code: t.taskCode || null,
      title: t.title,
      description: t.description,
      priority: t.priority,
      dueDate: dueKey,
      status, // pending | submitted | reviewed
      rawStatus: t.status,
      canSubmit,
      overdue: canSubmit && dueKey < today,
      expired: t.status === 'EXPIRED',
      revisionRequested: !!reviewed && ['REVISION_REQUIRED', 'REJECTED'].includes(reviewed.reviewStatus) && canSubmit,
      attempts: list.length,
      submittedAt: latest ? toKey(latest.submittedAt) : null,
      score: status === 'reviewed' && reviewed?.score != null ? reviewed.score : null,
      feedback: reviewed?.mentorComment || null
    };
  });

  const count = (s) => items.filter((t) => t.status === s).length;
  res.json({
    tasks: items,
    counts: { all: items.length, pending: count('pending'), submitted: count('submitted'), reviewed: count('reviewed') }
  });
});

/* ------------------------------------------------------------------ */
/* POST /api/intern/tasks/:taskId/submit  (multipart: file, link, notes) */
/* ------------------------------------------------------------------ */
exports.submitTask = asyncHandler(async (req, res) => {
  const { intern, user } = req;
  const uploaded = req.file ? `/uploads/submissions/${req.file.filename}` : null;
  const discardUpload = () => removeUploaded(uploaded);

  try {
    if (!mongoose.isValidObjectId(req.params.taskId)) throw httpError(400, 'Invalid task');

    const task = await Task.findOne({
      _id: req.params.taskId,
      internId: intern._id,
      organizationId: intern.organizationId
    });
    if (!task) throw httpError(404, 'Task not found');

    if (!SUBMITTABLE.includes(task.status)) {
      const reason =
        task.status === 'EXPIRED'
          ? 'This task has expired. Please contact your mentor.'
          : 'This task has already been submitted.';
      throw httpError(409, reason);
    }

    const link = String(req.body.link || '').trim();
    const notes = String(req.body.notes || '').trim();

    if (link && !/^https?:\/\/\S+$/i.test(link)) throw httpError(400, 'Please enter a valid link starting with http:// or https://');
    if (!uploaded && !link) throw httpError(400, 'Upload a file or share a link');

    const last = await TaskSubmission.findOne({ taskId: task._id, internId: intern._id }).sort({ attemptNumber: -1 });

    const submission = await TaskSubmission.create({
      organizationId: intern.organizationId,
      taskId: task._id,
      internId: intern._id,
      submissionText: notes || undefined,
      submissionLinks: [uploaded, link].filter(Boolean),
      submittedAt: new Date(),
      attemptNumber: (last?.attemptNumber || 0) + 1,
      reviewStatus: 'PENDING'
    });

    await Task.updateOne({ _id: task._id }, { status: 'SUBMITTED' });

    // Side effects must never fail the submission
    try {
      await Promise.all([
        Notification.create({
          organizationId: intern.organizationId,
          recipientId: task.mentorId,
          senderId: user._id,
          title: 'New task submission',
          message: `${user.fullName} submitted “${task.title}”.`,
          notificationType: 'SYSTEM',
          relatedEntityId: task._id,
          relatedEntityType: 'Task'
        }),
        AuditLog.create({
          organizationId: intern.organizationId,
          performedBy: user._id,
          action: 'TASK_SUBMITTED',
          module: 'TASKS',
          entityId: submission._id,
          entityType: 'TaskSubmission',
          newValue: { taskId: task._id, attemptNumber: submission.attemptNumber },
          ipAddress: req.ip
        })
      ]);
    } catch (e) {
      console.error('Post-submit side effects failed:', e.message);
    }

    res.status(201).json({ message: 'Work submitted successfully', attemptNumber: submission.attemptNumber });
  } catch (err) {
    discardUpload();
    throw err;
  }
});

/* ------------------------------------------------------------------ */
/* GET /api/intern/attendance                                           */
/* ------------------------------------------------------------------ */
exports.getAttendance = asyncHandler(async (req, res) => {
  const a = await getAttendanceSummary(req.intern);
  res.json({
    startDate: a.startKey,
    endDate: a.endKey,
    today: a.today,
    records: a.records,
    stats: {
      present: a.present + a.halfDay, // half days are shown as "present"
      halfDay: a.halfDay,
      absent: a.absent,
      leave: a.leave,
      days: a.days,
      percent: a.pct
    }
  });
});

/* ------------------------------------------------------------------ */
/* GET /api/intern/ai-score   (STATIC for now - see utils/staticAi.js)  */
/* ------------------------------------------------------------------ */
exports.getAiScore = asyncHandler(async (req, res) => {
  const att = await getAttendanceSummary(req.intern);
  const ai = getStaticAi();
  res.json({
    ...ai,
    breakdown: [...ai.breakdown, { label: 'Attendance', value: att.pct }]
  });
});
