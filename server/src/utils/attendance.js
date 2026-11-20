const Attendance = require('../models/Attendance');
const { toKey, todayKey } = require('./dates');

/**
 * Builds the attendance summary for one intern.
 *  - records : { 'YYYY-MM-DD': 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' }
 *  - Only MARKED days count. Weekends / unmarked weekdays / future days are ignored,
 *    exactly like the static demo (days = present + absent + leave).
 *  - A HALF_DAY counts as 0.5 present in the percentage.
 */
async function getAttendanceSummary(intern) {
  const startKey = toKey(intern.startDate);
  const endKey = toKey(intern.endDate);
  const today = todayKey();
  const lastCounted = today < endKey ? today : endKey;

  const rows = await Attendance.find({
    organizationId: intern.organizationId,
    internId: intern._id
  })
    .select('attendanceDate status')
    .lean();

  const records = {};
  const counts = { present: 0, absent: 0, leave: 0, halfDay: 0 };

  for (const row of rows) {
    const key = toKey(row.attendanceDate);
    if (key < startKey || key > endKey) continue;
    records[key] = row.status;
    if (key > lastCounted) continue;
    if (row.status === 'PRESENT') counts.present++;
    else if (row.status === 'ABSENT') counts.absent++;
    else if (row.status === 'LEAVE') counts.leave++;
    else if (row.status === 'HALF_DAY') counts.halfDay++;
  }

  const days = counts.present + counts.absent + counts.leave + counts.halfDay;
  const pct = days ? Math.round(((counts.present + counts.halfDay * 0.5) / days) * 100) : 0;

  return { startKey, endKey, today, records, ...counts, days, pct };
}

module.exports = { getAttendanceSummary };
