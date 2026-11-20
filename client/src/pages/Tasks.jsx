import { useState } from 'react'
import { api } from '../api/client'
import { TASK_SCORE_MAX } from '../config'
import { useIntern } from '../context/InternContext'
import { useToast } from '../context/ToastContext'
import { useApi } from '../utils/useApi'
import { cap, fmt } from '../utils/format'
import Icon from '../components/Icon'
import Modal from '../components/Modal'
import { ErrorBox, Loading } from '../components/State'

const TABS = [['all', 'All'], ['pending', 'Pending'], ['submitted', 'Submitted'], ['reviewed', 'Reviewed']]

function SubmitForm({ task, onClose, onDone }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    const f = e.currentTarget
    const form = new FormData()
    if (f.sfile.files[0]) form.append('file', f.sfile.files[0])
    form.append('link', f.slink.value)
    form.append('notes', f.snote.value)

    setBusy(true)
    setError('')
    try {
      await api.post(`/intern/tasks/${task.id}/submit`, { form })
      onDone()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <>
      <h2>Submit work</h2>
      <p className="sub">{task.title} · Due {fmt(task.dueDate)}</p>
      {task.revisionRequested && task.feedback && (
        <div className="fb" style={{ marginTop: 0, marginBottom: 14 }}><b>Revision requested:</b> {task.feedback}</div>
      )}
      <form onSubmit={submit}>
        <div className="fld">
          <label htmlFor="sfile">Upload file</label>
          <input id="sfile" name="sfile" type="file" required />
        </div>
        <div className="fld">
          <label htmlFor="slink">Repository / document link (optional)</label>
          <input id="slink" name="slink" type="url" placeholder="https://github.com/…" />
        </div>
        <div className="fld">
          <label htmlFor="snote">Notes for your mentor</label>
          <textarea id="snote" name="snote" rows={3} placeholder="Anything your mentor should know…" />
        </div>
        {error && <div className="err">{error}</div>}
        <div className="acts">
          <button type="button" className="btn btn-g" onClick={onClose}>Cancel</button>
          <button className="btn btn-p" type="submit" disabled={busy}>
            <Icon name="up" /> {busy ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </form>
    </>
  )
}

export default function Tasks() {
  const { data, loading, error, reload } = useApi('/intern/tasks')
  const { refresh } = useIntern() // keeps the sidebar badge in sync
  const toast = useToast()
  const [filter, setFilter] = useState('all')
  const [active, setActive] = useState(null)

  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} onRetry={reload} />

  const { tasks, counts } = data
  const list = tasks.filter((t) => filter === 'all' || t.status === filter)

  const done = async () => {
    setActive(null)
    toast('Work submitted successfully')
    await Promise.all([reload(), refresh()])
  }

  return (
    <>
      <div className="ph">
        <h2>Tasks</h2>
        <p>View assigned tasks and submit your work before the deadline.</p>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map(([k, l]) => (
          <button key={k} className="tab" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}>
            {l} ({counts[k]})
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '6px 22px' }}>
        {list.length ? (
          list.map((t) => (
            <div className="task" key={t.id}>
              <div className="n">{t.no}</div>
              <div style={{ minWidth: 0 }}>
                <h4>{t.title}</h4>
                <p>{t.description}</p>
                <div className="meta">
                  <span className={`tag t-${t.status}`}>{cap(t.status)}</span>
                  {t.expired && <span className="tag t-overdue">Expired</span>}
                  {t.overdue && <span className="tag t-overdue">Overdue</span>}
                  {t.revisionRequested && <span className="tag t-overdue">Revision requested</span>}
                  <span>Due {fmt(t.dueDate)}</span>
                  {t.score != null && <span><b style={{ color: 'var(--text)' }}>Score {t.score}/{TASK_SCORE_MAX}</b></span>}
                  {t.submittedAt && t.status !== 'pending' && <span>Submitted {fmt(t.submittedAt)}</span>}
                </div>
                {t.feedback && (
                  <div className="fb"><b>Mentor feedback:</b> {t.feedback}</div>
                )}
              </div>
              {t.canSubmit && (
                <div className="act">
                  <button className="btn btn-p" onClick={() => setActive(t)}>
                    <Icon name="up" /> {t.attempts ? 'Resubmit work' : 'Submit work'}
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p style={{ padding: 30, textAlign: 'center', color: 'var(--muted)' }}>No tasks in this category.</p>
        )}
      </div>

      <Modal open={!!active} onClose={() => setActive(null)}>
        {active && <SubmitForm task={active} onClose={() => setActive(null)} onDone={done} />}
      </Modal>
    </>
  )
}
