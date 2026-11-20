/**
 * Demo data that mirrors the static HTML dashboard (Rohan Patil, AI & Machine Learning).
 *   npm run seed
 * Safe to re-run: it wipes only the "SQI" demo organization and rebuilds it.
 *
 * Logins created (organization code: SQI)
 *   Intern : rohan.patil@example.com / Intern@123
 *   Mentor : anjali.deshmukh@example.com / Mentor@123
 *   Admin  : admin@squirrels.example / Admin@123
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Organization = require('../models/Organization');
const User = require('../models/User');
const InternshipOpening = require('../models/InternshipOpening');
const Application = require('../models/Application');
const Intern = require('../models/Intern');
const Task = require('../models/Task');
const TaskSubmission = require('../models/TaskSubmission');
const Attendance = require('../models/Attendance');
const VirtualId = require('../models/VirtualId');
const Certification = require('../models/Certification');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const ORG_CODE = 'SQI';
const ist = (key, time = '00:00:00') => new Date(`${key}T${time}+05:30`); // IST wall-clock
const addDays = (key, n) => new Date(Date.parse(`${key}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // ---- wipe previous demo org
  const old = await Organization.findOne({ organizationCode: ORG_CODE });
  if (old) {
    const filter = { organizationId: old._id };
    await Promise.all(
      [User, InternshipOpening, Application, Intern, Task, TaskSubmission, Attendance, VirtualId, Certification, Notification, AuditLog]
        .map((M) => M.deleteMany(filter))
    );
    await Organization.deleteOne({ _id: old._id });
  }

  // ---- organization + users
  const org = await Organization.create({
    organizationName: 'Squirrels Infotech',
    organizationCode: ORG_CODE,
    email: 'hello@squirrels.example',
    address: 'Satara, Maharashtra',
    industry: 'Software'
  });

  const hash = (p) => bcrypt.hash(p, 10);
  const admin = await User.create({ organizationId: org._id, fullName: 'Squirrels Admin', email: 'admin@squirrels.example', passwordHash: await hash('Admin@123'), role: 'ORG_ADMIN' });
  const mentor = await User.create({ organizationId: org._id, fullName: 'Dr. Anjali Deshmukh', email: 'anjali.deshmukh@example.com', passwordHash: await hash('Mentor@123'), role: 'MENTOR' });
  const candidate = await User.create({ organizationId: org._id, fullName: 'Rohan Patil', email: 'rohan.patil@example.com', passwordHash: await hash('Intern@123'), role: 'CANDIDATE', bloodGroup: 'B+' });
  await Organization.updateOne({ _id: org._id }, { primaryAdminId: admin._id, createdBy: admin._id });

  // ---- opening -> application -> intern
  const START = '2026-09-01';
  const END = '2026-11-30';

  const opening = await InternshipOpening.create({
    organizationId: org._id, createdBy: admin._id,
    title: 'AI/ML Intern', domain: 'AI & Machine Learning',
    description: '3-month AI/ML internship.', requiredSkills: ['Python', 'NumPy'],
    durationWeeks: 13, startDate: ist(START), endDate: ist(END),
    totalSeats: 10, availableSeats: 9, stipendType: 'UNPAID', status: 'CLOSED'
  });

  const application = await Application.create({
    organizationId: org._id, openingId: opening._id, candidateId: candidate._id,
    applicationStatus: 'SELECTED'
  });

  const intern = await Intern.create({
    organizationId: org._id, userId: candidate._id, applicationId: application._id,
    openingId: opening._id, mentorId: mentor._id, assignedBy: admin._id,
    domain: 'AI & Machine Learning', department: 'Data Science', projectTitle: 'Retail insights platform',
    startDate: ist(START), endDate: ist(END, '23:59:59'),
    internshipStatus: 'ACTIVE', internshipType: 'UNPAID'
  });

  // ---- tasks (same 7 as the demo)
  const taskDefs = [
    ['Python & NumPy fundamentals', 'Complete the data-wrangling exercises and upload the notebook.', '2026-09-12', 'COMPLETED', 9, 'Clean code and good use of vectorisation.'],
    ['Exploratory data analysis report', 'Analyse the provided retail dataset and share key insights.', '2026-09-26', 'COMPLETED', 8, 'Strong insights. Add more visual annotations next time.'],
    ['Linear & logistic regression models', 'Build both models and compare their metrics.', '2026-10-10', 'COMPLETED', 9, 'Excellent metric comparison and write-up.'],
    ['Image classifier with CNN', 'Train a small CNN on the sample image set and document results.', '2026-10-24', 'COMPLETED', 7, 'Works well. Overfitting should be addressed with augmentation.'],
    ['NLP sentiment analysis mini-project', 'Classify customer reviews using a pretrained embedding.', '2026-11-05', 'SUBMITTED'],
    ['Model deployment with Flask API', 'Wrap your best model in a REST API and share the repository link.', '2026-11-14', 'OVERDUE'],
    ['Final capstone presentation', 'Prepare a 10-slide deck summarising your internship project.', '2026-11-26', 'ASSIGNED']
  ];

  for (const [i, [title, description, due, status, score, comment]] of taskDefs.entries()) {
    const task = await Task.create({
      organizationId: org._id, internId: intern._id, mentorId: mentor._id, openingId: opening._id,
      title, description, taskCode: `T-${String(i + 1).padStart(3, '0')}`,
      assignedDate: ist(addDays(due, -14)), dueDate: ist(due, '23:59:59'), status
    });

    if (status === 'COMPLETED') {
      await TaskSubmission.create({
        organizationId: org._id, taskId: task._id, internId: intern._id,
        submissionLinks: ['https://github.com/example/repo'], submittedAt: ist(addDays(due, -1), '16:00:00'),
        attemptNumber: 1, reviewStatus: 'APPROVED', reviewedBy: mentor._id,
        reviewedAt: ist(due, '11:00:00'), score, mentorComment: comment
      });
    } else if (status === 'SUBMITTED') {
      await TaskSubmission.create({
        organizationId: org._id, taskId: task._id, internId: intern._id,
        submissionLinks: ['https://github.com/example/nlp-sentiment'], submittedAt: ist('2026-10-31', '17:30:00'),
        attemptNumber: 1, reviewStatus: 'PENDING'
      });
    }
  }

  // ---- attendance: every weekday from start until today (or end)
  const ABSENT = ['2026-09-09', '2026-10-06', '2026-10-21'];
  const LEAVE = ['2026-09-24', '2026-10-14'];
  const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const last = todayKey < END ? todayKey : END;
  const rows = [];
  for (let k = START; k <= last; k = addDays(k, 1)) {
    const dow = new Date(`${k}T00:00:00Z`).getUTCDay();
    if (dow === 0 || dow === 6) continue;
    const status = ABSENT.includes(k) ? 'ABSENT' : LEAVE.includes(k) ? 'LEAVE' : 'PRESENT';
    rows.push({
      organizationId: org._id, internId: intern._id, mentorId: mentor._id, markedBy: mentor._id,
      attendanceDate: ist(k), status,
      ...(status === 'PRESENT' ? { checkIn: ist(k, '10:00:00'), checkOut: ist(k, '18:00:00'), workingHours: 8 } : {})
    });
  }
  await Attendance.insertMany(rows);

  console.log('✅ Demo data created');
  console.log('   Organization code : SQI');
  console.log('   Intern login      : rohan.patil@example.com / Intern@123');
  console.log('   (Virtual ID and certificate are generated automatically on first use)');
  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('❌ Seed failed:', e);
  await mongoose.disconnect();
  process.exit(1);
});
