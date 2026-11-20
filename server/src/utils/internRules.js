// Business rules for the intern dashboard (override through .env if needed)
module.exports = {
  CERT_MIN_ATTENDANCE: Number(process.env.CERT_MIN_ATTENDANCE) || 75,
  CERT_MIN_AI_SCORE: Number(process.env.CERT_MIN_AI_SCORE) || 60,
  // true  -> certificate record is created automatically once all criteria are met
  // false -> an admin must create/issue the Certification document (status ISSUED)
  AUTO_ISSUE_CERTIFICATE: process.env.AUTO_ISSUE_CERTIFICATE !== 'false'
};
