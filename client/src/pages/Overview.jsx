import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIntern } from '../context/InternContext'
import { useApi } from '../utils/useApi'
import { fmt } from '../utils/format'
import Icon from '../components/Icon'
import AiScoreDialog from '../components/AiScoreDialog'
import { ErrorBox, Loading } from '../components/State'

export default function Overview() {
  const navigate = useNavigate()
  const { profile } = useIntern()
  const { data, loading, error, reload } = useApi('/intern/overview')
  const [aiOpen, setAiOpen] = useState(false)

  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} onRetry={reload} />

  const { stats, progress, upcoming, certificateUnlocked } = data
  const first = profile.user.fullName.split(' ')[0]
  const mentor = profile.mentor || 'your mentor'

  return (
    <>
      <div className="ph">
        <h2>Welcome back, {first} 👋</h2>
        <p>Here’s a snapshot of your internship progress.</p>
      </div>

      <div className="grid g4">
        <div className="card stat click" onClick={() => navigate('/intern/tasks')}>
          <div className="ico"><Icon name="task" /></div>
          <div><b>{stats.tasksDone}/{stats.tasksTotal}</b><span>Tasks submitted</span></div>
        </div>
        <div className="card stat click" onClick={() => navigate('/intern/attendance')}>
          <div className="ico"><Icon name="cal" /></div>
          <div><b>{stats.attendancePercent}%</b><span>Attendance</span></div>
        </div>
        <div className="card stat click" onClick={() => setAiOpen(true)}>
          <div className="ico"><Icon name="score" /></div>
          <div><b>{stats.aiScore}/100</b><span>AI score</span></div>
        </div>
        <div className="card stat">
          <div className="ico"><Icon name="clock" /></div>
          <div><b>{stats.daysRemaining}</b><span>Days remaining</span></div>
        </div>
      </div>

      <div className="grid g2" style={{ marginTop: 18 }}>
        <div className="card">
          <h3>Internship progress</h3>
          <div className="row" style={{ justifyContent: 'space-between', fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>
            <span>{fmt(progress.startDate)}</span>
            <b style={{ color: 'var(--text)' }}>{progress.percent}% complete</b>
            <span>{fmt(progress.endDate)}</span>
          </div>
          <div className="bar"><i style={{ width: `${progress.percent}%` }} /></div>
          <p style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 16 }}>
            Your mentor <b style={{ color: 'var(--text)' }}>{mentor}</b> reviews submissions every Friday.
          </p>
        </div>

        <div className="card">
          <h3>Upcoming deadlines</h3>
          {upcoming.length ? (
            upcoming.map((t) => (
              <div
                key={t.id}
                className="row"
                style={{ justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}
              >
                <span>{t.title}</span>
                <span className="tag t-pending">{fmt(t.dueDate)}</span>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--muted)' }}>You’re all caught up. 🎉</p>
          )}
          <button className="btn btn-g" style={{ marginTop: 14 }} onClick={() => navigate('/intern/tasks')}>
            Go to tasks
          </button>
        </div>

        <div className="card">
          <h3>E-Certificate</h3>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 14 }}>
            {certificateUnlocked
              ? 'Your certificate is unlocked and ready to download.'
              : 'Complete all criteria to unlock your certificate.'}
          </p>
          <button className="btn btn-p" onClick={() => navigate('/intern/certificate')}>
            <Icon name={certificateUnlocked ? 'award' : 'lock'} /> {certificateUnlocked ? 'View certificate' : 'View criteria'}
          </button>
        </div>

        <div className="card">
          <h3>Virtual ID</h3>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 14 }}>
            Your digital intern ID is generated and active until {fmt(profile.virtualId.validTill)}.
          </p>
          <button className="btn btn-g" onClick={() => navigate('/intern/virtual-id')}>
            <Icon name="id" /> Open ID card
          </button>
        </div>
      </div>

      <AiScoreDialog open={aiOpen} onClose={() => setAiOpen(false)} />
    </>
  )
}
