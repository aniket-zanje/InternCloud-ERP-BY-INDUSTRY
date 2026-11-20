import { useState } from 'react'
import { useApi } from '../utils/useApi'
import Icon from '../components/Icon'
import Ring from '../components/Ring'
import AiScoreDialog from '../components/AiScoreDialog'
import { ErrorBox, Loading } from '../components/State'

export default function AiScore() {
  const { data, loading, error, reload } = useApi('/intern/ai-score')
  const [open, setOpen] = useState(false)
  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} onRetry={reload} />

  return (
    <>
      <div className="ph">
        <h2>AI Score</h2>
        <p>Your weekly AI evaluation based on task efficiency, mentor feedback and attendance.</p>
      </div>
      <div className="card row" style={{ gap: 32, maxWidth: 720 }}>
        <Ring value={data.score} size={170} />
        <div style={{ flex: 1, minWidth: 230 }}>
          <h3>Overall performance: {data.level}</h3>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>{data.message}</p>
          <button className="btn btn-p" onClick={() => setOpen(true)}>
            <Icon name="score" /> View AI analysis
          </button>
        </div>
      </div>
      <AiScoreDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}
