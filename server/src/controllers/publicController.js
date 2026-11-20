const VirtualId = require('../models/VirtualId');
const Intern = require('../models/Intern');
const User = require('../models/User');
const Organization = require('../models/Organization');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { toKey, todayKey } = require('../utils/dates');

// GET /api/public/verify/:number   (no login - this is what the ID-card QR code opens)
exports.verifyVirtualId = asyncHandler(async (req, res) => {
  const number = String(req.params.number || '').trim().toUpperCase();
  const vid = await VirtualId.findOne({ virtualIdNumber: number });
  if (!vid) throw httpError(404, 'This ID could not be verified');

  const [intern, user, org] = await Promise.all([
    Intern.findById(vid.internId).select('domain internshipStatus endDate').lean(),
    User.findById(vid.userId).select('fullName').lean(),
    Organization.findById(vid.organizationId).select('organizationName').lean()
  ]);

  const validTill = toKey(vid.expiryDate || intern?.endDate);
  const valid =
    vid.status === 'ACTIVE' && intern?.internshipStatus !== 'TERMINATED' && validTill >= todayKey();

  // Only non-sensitive details are exposed publicly
  res.json({
    valid,
    status: vid.status,
    name: user?.fullName,
    domain: intern?.domain,
    organization: org?.organizationName,
    virtualIdNumber: vid.virtualIdNumber,
    validTill
  });
});
