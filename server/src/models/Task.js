const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  internId: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true, index: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  openingId: { type: mongoose.Schema.Types.ObjectId, ref: 'InternshipOpening' },
  taskCode: { type: String, trim: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
  assignedDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'COMPLETED', 'OVERDUE', 'EXPIRED'],
    default: 'ASSIGNED'
  }
}, { timestamps: true });

taskSchema.index({ organizationId: 1, internId: 1, dueDate: 1 });
taskSchema.index({ organizationId: 1, internId: 1, taskCode: 1 }, { unique: true, sparse: true });

module.exports = mongoose.models.Task || mongoose.model('Task', taskSchema);
