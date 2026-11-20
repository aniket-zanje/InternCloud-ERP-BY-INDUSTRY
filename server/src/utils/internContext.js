const Organization = require('../models/Organization');
const User = require('../models/User');
const InternshipOpening = require('../models/InternshipOpening');

/** Loads everything related to the logged-in intern that most endpoints need. */
async function getInternContext(req) {
  const intern = req.intern;
  const [org, mentor, opening] = await Promise.all([
    Organization.findById(intern.organizationId).lean(),
    intern.mentorId ? User.findById(intern.mentorId).select('fullName').lean() : null,
    InternshipOpening.findById(intern.openingId).select('title domain').lean()
  ]);

  return {
    user: req.user,
    intern,
    org,
    mentor,
    opening,
    role: opening?.title || `${intern.domain || 'General'} Intern`
  };
}

module.exports = { getInternContext };
