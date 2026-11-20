const Certification = require('../models/Certification');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { toKey } = require('../utils/dates');
const { getInternContext } = require('../utils/internContext');
const { ensureVirtualId } = require('../utils/virtualId');
const { getMetrics, buildCriteria } = require('../utils/internMetrics');
const { AUTO_ISSUE_CERTIFICATE } = require('../utils/internRules');

async function issueCertificate(ctx, number) {
  const { intern, user } = ctx;
  try {
    const cert = await Certification.findOneAndUpdate(
      { organizationId: intern.organizationId, internId: intern._id, certificateType: 'INTERNSHIP' },
      {
        $set: { status: 'ISSUED', issueDate: new Date() },
        $setOnInsert: {
          userId: intern.userId,
          certificateTitle: 'Certificate of Internship',
          domain: intern.domain,
          certificateNumber: number,
          issuedBy: intern.assignedBy
        }
      },
      { upsert: true, new: true }
    );
    await Notification.create({
      organizationId: intern.organizationId,
      recipientId: user._id,
      title: 'Your internship certificate is ready',
      message: 'You have met all criteria. Your certificate is now available to download.',
      notificationType: 'CERTIFICATE',
      relatedEntityId: cert._id,
      relatedEntityType: 'Certification'
    }).catch(() => {});
    return cert;
  } catch (err) {
    if (err.code === 11000) {
      return Certification.findOne({ certificateNumber: number });
    }
    throw err;
  }
}

// GET /api/intern/certificate
exports.getCertificate = asyncHandler(async (req, res) => {
  const ctx = await getInternContext(req);
  const { intern, org, mentor, user } = ctx;

  const [m, vid] = await Promise.all([getMetrics(ctx), ensureVirtualId(intern, org)]);
  const criteria = buildCriteria(m);
  const criteriaMet = criteria.every((c) => c.met);

  let cert = await Certification.findOne({
    organizationId: intern.organizationId,
    internId: intern._id,
    certificateType: 'INTERNSHIP'
  });

  const number = cert?.certificateNumber || `CERT-${vid.virtualIdNumber}`;
  const revoked = cert?.status === 'REVOKED';
  let unlocked = criteriaMet && !revoked;
  let awaitingIssue = false;

  if (unlocked && AUTO_ISSUE_CERTIFICATE && (!cert || cert.status === 'PENDING')) {
    cert = await issueCertificate(ctx, number);
  }
  if (unlocked && !AUTO_ISSUE_CERTIFICATE && cert?.status !== 'ISSUED') {
    unlocked = false;
    awaitingIssue = true;
  }

  let message = unlocked
    ? 'Congratulations! Your certificate is unlocked.'
    : 'Your certificate unlocks once every criterion below is met.';
  if (revoked) message = 'This certificate has been revoked. Please contact your organization.';
  if (awaitingIssue) message = 'You have met all criteria. Your certificate will appear once your organization issues it.';

  res.json({
    unlocked,
    message,
    criteria,
    certificate: {
      number,
      issueDate: toKey(cert?.issueDate || intern.endDate),
      name: user.fullName,
      role: ctx.role,
      domain: intern.domain || '',
      mentor: mentor?.fullName || null,
      organization: org?.organizationName || '',
      startDate: m.att.startKey,
      endDate: m.att.endKey,
      aiScore: m.aiScore
    }
  });
});
