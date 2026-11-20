const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
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
    required: [true, 'Mentor ID is required']
  },

  openingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InternshipOpening',
    default: null
  },

  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },

  taskCode: {
    type: String,
    trim: true
  },

  description: {
    type: String,
    required: [true, 'Description is required']
  },

  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM'
  },

  frequency: {
    type: String,
    enum: ['ONCE', 'DAILY', 'WEEKLY'],
    default: 'ONCE'
  },

  assignedDate: {
    type: Date,
    required: [true, 'Assigned date is required']
  },

  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    validate: {
      validator: function (value) {
        return value >= this.assignedDate;
      },
      message: 'Due date must not precede assigned date'
    }
  },

  status: {
    type: String,
    enum: [
      'ASSIGNED',
      'IN_PROGRESS',
      'SUBMITTED',
      'UNDER_REVIEW',
      'COMPLETED',
      'REJECTED',
      'OVERDUE',
      'EXPIRED'
    ],
    default: 'ASSIGNED'
  }

}, { timestamps: true });


// Index for organization, intern and task status
taskSchema.index({
  organizationId: 1,
  internId: 1,
  status: 1
});


// Unique taskCode per organization when taskCode is provided
taskSchema.index(
  { organizationId: 1, taskCode: 1 },
  {
    unique: true,
    partialFilterExpression: {
      taskCode: { $type: 'string' }
    }
  }
);

module.exports = mongoose.model('Task', taskSchema);