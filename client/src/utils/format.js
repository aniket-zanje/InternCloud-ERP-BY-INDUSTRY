// All dates from the API are plain "YYYY-MM-DD" keys (no time zone surprises)
export const parseKey = (k) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const fmt = (k) =>
  k ? parseKey(k).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 864e5)

/** "3 Months" / "3-month"  (or days for very short internships) */
export function durationInfo(startKey, endKey) {
  const days = daysBetween(startKey, endKey) + 1
  if (days < 28) return { label: `${days} Days`, adj: `${days}-day` }
  const m = Math.max(1, Math.round(days / 30.44))
  return { label: `${m} Month${m > 1 ? 's' : ''}`, adj: `${m}-month` }
}

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

export const cap = (s) => s[0].toUpperCase() + s.slice(1)
