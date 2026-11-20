const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  internId: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true, index: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attendanceDate: { type: Date, required: true },
  status: { type: String, enum: ['PRESENT', 'ABSENT', 'LEAVE', 'HALF_DAY'], required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  workingHours: { type: Number, min: 0, max: 24 },
  remarks: { type: String, trim: true }
}, { timestamps: true });

attendanceSchema.index({ organizationId: 1, internId: 1, attendanceDate: 1 }, { unique: true });

module.exports = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
