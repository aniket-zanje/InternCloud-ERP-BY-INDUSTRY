const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
    default: null
  },
  attendanceDate: {
    type: Date,
    required: [true, 'Attendance date is required']
  },
  status: {
    type: String,
    enum: ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'],
    required: [true, 'Status is required']
  },
  checkIn: {
    type: Date
  },
  checkOut: {
    type: Date
  },
  workingHours: {
    type: Number,
    min: [0, 'Working hours cannot be negative']
  },
  remarks: {
    type: String,
    trim: true
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Marked by user is required']
  }
}, { timestamps: true });

// Recommended index from schema document
attendanceSchema.index(
  { organizationId: 1, internId: 1, attendanceDate: 1 },
  { unique: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);