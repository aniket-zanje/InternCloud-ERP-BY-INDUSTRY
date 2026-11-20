import { useApi } from '../utils/useApi'
import Modal from './Modal'
import Ring from './Ring'
import GrowthGraph from './GrowthGraph'
import { ErrorBox, Loading } from './State'

function Body() {
  const { data, loading, error, reload } = useApi('/intern/ai-score')
  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} onRetry={reload} />

  return (
    <>
      <h2>AI Performance Analysis</h2>
      <p className="sub">Generated weekly from your task efficiency, mentor feedback and attendance.</p>
      <div className="row" style={{ gap: 28 }}>
        <div><Ring value={data.score} size={150} /></div>
        <div className="sb" style={{ flex: 1, minWidth: 220 }}>
          {data.breakdown.map((b) => (
            <div key={b.label}>
              <span>{b.label}<b style={{ color: 'var(--text)' }}>{b.value}%</b></span>
              <div className="bar"><i style={{ width: `${b.value}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="two">
        <div className="sw s-ok"><h5>Strengths</h5><ul>{data.strengths.map((s) => <li key={s}>{s}</li>)}</ul></div>
        <div className="sw s-bad"><h5>Areas to improve</h5><ul>{data.improvements.map((s) => <li key={s}>{s}</li>)}</ul></div>
      </div>
      <h3 style={{ fontSize: 15, marginBottom: 6 }}>Weekly growth graph</h3>
      <GrowthGraph data={data.growth} />
    </>
  )
}

export default function AiScoreDialog({ open, onClose }) {
  return <Modal open={open} onClose={onClose}>{open && <Body />}</Modal>
}
