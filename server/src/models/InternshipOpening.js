const mongoose = require('mongoose');

const internshipOpeningSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  domain: {
    type: String,
    required: [true, 'Domain is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  requiredSkills: [{
    type: String,
    trim: true
  }],
  eligibility: {
    type: String,
    trim: true
  },
  durationWeeks: {
    type: Number,
    min: [0, 'Duration cannot be negative']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function (value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  applicationDeadline: {
    type: Date
  },
  totalSeats: {
    type: Number,
    required: [true, 'Total seats is required'],
    min: [0, 'Total seats cannot be negative'],
    validate: {
      validator: Number.isInteger,
      message: 'Total seats must be an integer'
    }
  },
  availableSeats: {
    type: Number,
    required: [true, 'Available seats is required'],
    min: [0, 'Available seats cannot be negative'],
    validate: [
      {
        validator: Number.isInteger,
        message: 'Available seats must be an integer'
      },
      {
        validator: function (value) {
          return value <= this.totalSeats;
        },
        message: 'Available seats cannot exceed total seats'
      }
    ]
  },
  stipendType: {
    type: String,
    enum: ['PAID', 'UNPAID'],
    required: [true, 'Stipend type is required']
  },
  stipendAmount: {
    type: Number,
    min: [0, 'Stipend amount cannot be negative'],
    default: 0
  },
  status: {
    type: String,
    enum: ['DRAFT', 'OPEN', 'CLOSED', 'COMPLETED'],
    default: 'DRAFT'
  }
}, { timestamps: true });

// Recommended index from schema document
internshipOpeningSchema.index({ organizationId: 1, status: 1, applicationDeadline: 1 });

module.exports = mongoose.model('InternshipOpening', internshipOpeningSchema);