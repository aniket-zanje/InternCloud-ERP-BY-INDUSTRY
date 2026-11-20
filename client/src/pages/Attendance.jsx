import { useMemo, useState } from 'react'
import { useApi } from '../utils/useApi'
import { parseKey } from '../utils/format'
import Icon from '../components/Icon'
import { ErrorBox, Loading } from '../components/State'

const pad = (n) => String(n).padStart(2, '0')
const keyOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}` // m is 0-based

const LABEL = {
  PRESENT: 'present', HALF_DAY: 'half day', ABSENT: 'absent', LEAVE: 'leave',
}
const CLASS = { PRESENT: 'present', HALF_DAY: 'present', ABSENT: 'absent', LEAVE: 'leave' }

/** Calendar months covered by the internship (the design shows Sep / Oct / Nov) */
function monthsBetween(startKey, endKey) {
  const s = parseKey(startKey), e = parseKey(endKey)
  const out = []
  for (let y = s.getFullYear(), m = s.getMonth(); y < e.getFullYear() || (y === e.getFullYear() && m <= e.getMonth()); ) {
    out.push({ y, m })
    if (++m > 11) { m = 0; y++ }
  }
  return out
}

function Calendar({ data }) {
  const { startDate, endDate, today, records } = data
  const months = useMemo(() => monthsBetween(startDate, endDate), [startDate, endDate])
  const multiYear = months[0].y !== months[months.length - 1].y

  // open on the month that contains "today" (clamped to the internship period)
  const initial = useMemo(() => {
    const t = parseKey(today)
    const i = months.findIndex((x) => x.y === t.getFullYear() && x.m === t.getMonth())
    return i >= 0 ? i : today < startDate ? 0 : months.length - 1
  }, [months, today, startDate])
  const [idx, setIdx] = useState(initial)

  const { y, m } = months[idx]
  const first = new Date(y, m, 1).getDay()
  const count = new Date(y, m + 1, 0).getDate()

  const stateOf = (key) => {
    const rec = records[key]
    if (rec) return { cls: CLASS[rec], title: LABEL[rec] }
    if (key < startDate || key > endDate || key > today) return { cls: 'none', title: 'upcoming' }
    const w = parseKey(key).getDay()
    if (w === 0 || w === 6) return { cls: 'off', title: 'weekend' }
    return { cls: 'none', title: 'not marked' }
  }

  const monthName = (mm, yy, style) => new Date(yy, mm, 1).toLocaleString('en-US', { month: style })

  return (
    <div className="card" style={{ marginTop: 18, maxWidth: 640 }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>{monthName(m, y, 'long')} {y}</h3>
        <div className="tabs" style={{ margin: 0 }}>
          {months.map((x, i) => (
            <button key={`${x.y}-${x.m}`} className="tab" aria-selected={idx === i} onClick={() => setIdx(i)}>
              {monthName(x.m, x.y, 'short')}{multiYear ? ` ’${String(x.y).slice(2)}` : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="cal">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div className="d" key={i}>{d}</div>)}
        {Array.from({ length: first }, (_, i) => <div className="c blank" key={`b${i}`} />)}
        {Array.from({ length: count }, (_, i) => {
          const s = stateOf(keyOf(y, m, i + 1))
          return <div key={i} className={`c ${s.cls}`} title={s.title}>{i + 1}</div>
        })}
      </div>

      <div className="leg">
        <span style={{ '--k': 'var(--ok)' }}>Present</span>
        <span style={{ '--k': 'var(--bad)' }}>Absent</span>
        <span style={{ '--k': 'var(--warn)' }}>Leave</span>
        <span style={{ '--k': 'var(--border)' }}>Weekend / upcoming</span>
      </div>
    </div>
  )
}

export default function Attendance() {
  const { data, loading, error, reload } = useApi('/intern/attendance')
  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} onRetry={reload} />
  const a = data.stats

  return (
    <>
      <div className="ph">
        <h2>Attendance</h2>
        <p>Your personal attendance record for the internship period.</p>
      </div>

      <div className="grid g4">
        <div className="card stat"><div className="ico"><Icon name="cal" /></div><div><b>{a.percent}%</b><span>Overall attendance</span></div></div>
        <div className="card stat"><div className="ico" style={{ background: 'var(--oks)', color: 'var(--ok)' }}><Icon name="check" /></div><div><b>{a.present}</b><span>Days present</span></div></div>
        <div className="card stat"><div className="ico" style={{ background: 'var(--bads)', color: 'var(--bad)' }}><Icon name="x" /></div><div><b>{a.absent}</b><span>Days absent</span></div></div>
        <div className="card stat"><div className="ico" style={{ background: 'var(--warns)', color: 'var(--warn)' }}><Icon name="clock" /></div><div><b>{a.leave}</b><span>Leaves taken</span></div></div>
      </div>

      <Calendar data={data} />
    </>
  )
}
