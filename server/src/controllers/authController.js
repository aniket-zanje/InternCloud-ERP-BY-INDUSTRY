const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const signToken = (user) =>
  jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

const publicUser = (u) => ({
  id: u._id,
  fullName: u.fullName,
  email: u.email,
  role: u.role
});

// POST /api/auth/login   { email, password, organizationCode? }
exports.login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const password = String(req.body.password || '');
  const organizationCode = String(req.body.organizationCode || '').trim();

  if (!email || !password) throw httpError(400, 'Email and password are required');

  let candidates = await User.find({ email });

  // A user is unique per (organization + email), so the same email may exist in several orgs
  if (organizationCode) {
    const org = await Organization.findOne({
      organizationCode: new RegExp(`^${escapeRegex(organizationCode)}$`, 'i')
    });
    candidates = org ? candidates.filter((u) => String(u.organizationId) === String(org._id)) : [];
  }

  const matches = [];
  for (const u of candidates) {
    if (await bcrypt.compare(password, u.passwordHash)) matches.push(u);
  }

  if (matches.length === 0) throw httpError(401, 'Invalid email or password');
  if (matches.length > 1) {
    throw httpError(400, 'Multiple accounts use this email. Please enter your organization code.', 'ORG_REQUIRED');
  }

  const user = matches[0];
  if (user.status !== 'ACTIVE') throw httpError(403, 'Your account is inactive or blocked. Contact your organization.');

  if (user.organizationId) {
    const org = await Organization.findById(user.organizationId).select('status');
    if (!org || org.status !== 'ACTIVE') throw httpError(403, 'Your organization is not active');
  }

  await User.updateOne({ _id: user._id }, { lastLogin: new Date() });

  res.json({ token: signToken(user), user: publicUser(user) });
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
