// Maps the 7 database task statuses onto the 3 tabs of the UI
const SUBMITTABLE = ['ASSIGNED', 'IN_PROGRESS', 'OVERDUE']; // intern can still submit
const IN_REVIEW = ['SUBMITTED', 'UNDER_REVIEW'];

const uiStatus = (status) => {
  if (status === 'COMPLETED') return 'reviewed';
  if (IN_REVIEW.includes(status)) return 'submitted';
  return 'pending'; // ASSIGNED, IN_PROGRESS, OVERDUE, EXPIRED
};

module.exports = { SUBMITTABLE, IN_REVIEW, uiStatus };
