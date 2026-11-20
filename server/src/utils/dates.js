/**
 * Date helpers. The dashboard works with plain "YYYY-MM-DD" day keys so that
 * the attendance calendar / due dates never shift by a day because of time zones.
 * Every Date coming out of MongoDB is converted to a key in APP_TIMEZONE (IST by default).
 */
const TZ = process.env.APP_TIMEZONE || 'Asia/Kolkata';
const DAY = 864e5;

const keyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

const toKey = (date) => (date ? keyFormatter.format(new Date(date)) : null);
const todayKey = () => toKey(new Date());
const keyToUTC = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const daysBetween = (a, b) => Math.round((keyToUTC(b) - keyToUTC(a)) / DAY);

module.exports = { TZ, toKey, todayKey, daysBetween };
