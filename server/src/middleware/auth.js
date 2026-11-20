const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Intern = require('../models/Intern');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

/** Verifies the Bearer token and attaches the user to req.user */
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw httpError(401, 'Not authenticated');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw httpError(401, 'Session expired. Please sign in again.');
  }

  const user = await User.findById(payload.sub).select('-passwordHash');
  if (!user || user.status !== 'ACTIVE') throw httpError(401, 'Account is not active');

  req.user = user;
  next();
});

/** Only interns (role CANDIDATE with an Intern record). Attaches req.intern */
const requireIntern = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'CANDIDATE') {
    throw httpError(403, 'This dashboard is only available to interns');
  }

  const records = await Intern.find({
    userId: req.user._id,
    organizationId: req.user.organizationId
  }).sort({ startDate: -1 });

  if (!records.length) throw httpError(403, 'No internship record found for your account');

  const usable = records.filter((i) => i.internshipStatus !== 'TERMINATED');
  if (!usable.length) throw httpError(403, 'Your internship has been terminated');

  // Prefer the ACTIVE internship, otherwise the most recent one
  req.intern = usable.find((i) => i.internshipStatus === 'ACTIVE') || usable[0];
  next();
});

module.exports = { protect, requireIntern };
