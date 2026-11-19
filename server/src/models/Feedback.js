const mongoose = require('mongoose');

// Reusable 1-5 rating field config
const ratingField = {
  type: Number,
  min: [1, 'Rating cannot be below 1'],
  max: [5, 'Rating cannot exceed 5']
};

const feedbackSchema = new mongoose.Schema({
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
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Feedback author is required']
  },
  feedbackType: {
    type: String,
    enum: ['MENTOR_FEEDBACK', 'INTERNSHIP_FEEDBACK', 'PROGRAM_FEEDBACK'],
    required: [true, 'Feedback type is required']
  },
  mentorshipRating: ratingField,
  learningRating: ratingField,
  taskRating: ratingField,
  communicationRating: ratingField,
  overallRating: ratingField,
  comments: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);