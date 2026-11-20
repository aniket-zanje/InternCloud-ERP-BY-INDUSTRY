const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
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
      type: Date,
      default: null
    },

    checkOut: {
      type: Date,
      default: null,
      validate: {
        validator: function (value) {
          if (!value || !this.checkIn) return true;
          return value > this.checkIn;
        },
        message: 'Check-out time must be after check-in time'
      }
    },

    workingHours: {
      type: Number,
      min: [0, 'Working hours cannot be negative'],
      default: 0
    },

    remarks: {
      type: String,
      trim: true,
      default: ''
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Marked by user is required']
    }
  },
  {
    timestamps: true
  }
);


// One attendance record per intern per organization per date
attendanceSchema.index(
  {
    organizationId: 1,
    internId: 1,
    attendanceDate: 1
  },
  {
    unique: true
  }
);

module.exports = mongoose.model('Attendance', attendanceSchema);