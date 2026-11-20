const mongoose = require('mongoose');

const internSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  openingId: { type: mongoose.Schema.Types.ObjectId, ref: 'InternshipOpening' },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  virtualId: { type: mongoose.Schema.Types.ObjectId, ref: 'VirtualId', default: null },
  domain: { type: String, trim: true, default: '' },
  department: { type: String, trim: true },
  projectTitle: { type: String, trim: true },
  startDate: { type: Date, required: true },
  endDate: {
    type: Date, required: true,
    validate: { validator(value) { return !this.startDate || value >= this.startDate; }, message: 'endDate must be on or after startDate' }
  },
  internshipStatus: { type: String, enum: ['ACTIVE', 'COMPLETED', 'TERMINATED', 'ON_HOLD'], default: 'ACTIVE' },
  internshipType: { type: String, enum: ['PAID', 'UNPAID', 'PERFORMANCE_BASED'], default: 'UNPAID' }
}, { timestamps: true });

internSchema.index({ organizationId: 1, userId: 1, startDate: -1 });
internSchema.index({ organizationId: 1, openingId: 1 });

module.exports = mongoose.models.Intern || mongoose.model('Intern', internSchema);
