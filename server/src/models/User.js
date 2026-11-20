const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null, // null only for SUPER_ADMIN
    validate: {
      validator: function (value) {
        if (this.role === 'SUPER_ADMIN') return true;
        return value !== null && value !== undefined;
      },
      message: 'organizationId is required for non-SUPER_ADMIN roles'
    }
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required']
  },
  phone: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String,
    trim: true
  },
  // Shown on the intern's Virtual ID card
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    default: undefined
  },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'ORG_ADMIN', 'MENTOR', 'CANDIDATE'],
    required: [true, 'Role is required']
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'],
    default: 'ACTIVE'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  }
}, { timestamps: true });

// Unique email per organization (Super Admin handled via global email policy)
userSchema.index({ organizationId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);