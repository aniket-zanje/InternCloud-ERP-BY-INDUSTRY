const VirtualId = require('../models/VirtualId');
const Intern = require('../models/Intern');
const { toKey } = require('./dates');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// "AI & Machine Learning" -> "AIML", "Web Development" -> "WD"
function domainCode(domain = '') {
  const words = domain.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  const code = words
    .map((w) => (w.length <= 3 && w === w.toUpperCase() ? w : w[0].toUpperCase()))
    .join('');
  return code || 'GEN';
}

const verifyUrl = (number) =>
  `${(process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0]}/verify/${number}`;

/**
 * Returns the intern's Virtual ID. Created automatically the first time it is needed
 * ("generated automatically for the internship" in the design).
 * Format: <ORG_CODE>-<DOMAIN_CODE>-<YEAR>-<0001>   e.g. SQI-AIML-2026-0142
 */
async function ensureVirtualId(intern, org) {
  let vid = intern.virtualId ? await VirtualId.findById(intern.virtualId) : null;
  if (!vid) {
    vid = await VirtualId.findOne({ organizationId: intern.organizationId, internId: intern._id });
  }
  if (vid) {
    if (!intern.virtualId) {
      await Intern.updateOne({ _id: intern._id }, { virtualId: vid._id });
    }
    return vid;
  }

  const year = toKey(intern.startDate).slice(0, 4);
  const prefix = `${org.organizationCode}-${domainCode(intern.domain)}-${year}`.toUpperCase();

  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await VirtualId.countDocuments({
      virtualIdNumber: new RegExp(`^${escapeRegex(prefix)}-`)
    });
    const number = `${prefix}-${String(count + 1 + attempt).padStart(4, '0')}`;
    try {
      vid = await VirtualId.create({
        organizationId: intern.organizationId,
        internId: intern._id,
        userId: intern.userId,
        virtualIdNumber: number,
        qrCode: verifyUrl(number),
        issueDate: new Date(),
        expiryDate: intern.endDate,
        status: 'ACTIVE'
      });
      await Intern.updateOne({ _id: intern._id }, { virtualId: vid._id });
      return vid;
    } catch (err) {
      if (err.code === 11000) continue; // number already taken -> try next one
      throw err;
    }
  }
  throw new Error('Could not generate a unique Virtual ID');
}

module.exports = { ensureVirtualId, verifyUrl };
