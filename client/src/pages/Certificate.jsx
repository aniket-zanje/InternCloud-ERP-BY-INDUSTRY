import { usePrint } from '../context/PrintContext'
import { useApi } from '../utils/useApi'
import CertificateView from '../components/CertificateView'
import Icon from '../components/Icon'
import { ErrorBox, Loading } from '../components/State'

export default function Certificate() {
  const { data, loading, error, reload } = useApi('/intern/certificate')
  const print = usePrint()
  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} onRetry={reload} />

  const { unlocked, message, criteria, certificate } = data
  const met = criteria.filter((c) => c.met).length

  return (
    <>
      <div className="ph">
        <h2>E-Certificate</h2>
        <p>{message}</p>
      </div>

      {unlocked ? (
        <>
          <div className="row" style={{ marginBottom: 18 }}>
            <button className="btn btn-p" onClick={() => print(<CertificateView c={certificate} />)}>
              <Icon name="dl" /> Download certificate
            </button>
          </div>
          <CertificateView c={certificate} />
        </>
      ) : (
        <div className="grid g2">
          <div className="card">
            <h3>Unlock criteria</h3>
            <div className="crit">
              {criteria.map((c) => (
                <div key={c.label}>
                  <span className={`dot ${c.met ? 'y' : ''}`}><Icon name={c.met ? 'check' : 'x'} /></span>
                  {c.label}
                </div>
              ))}
            </div>
            <div className="bar"><i style={{ width: `${(met / criteria.length) * 100}%` }} /></div>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '10px 0 0' }}>
              {met} of {criteria.length} criteria met
            </p>
          </div>
          <div style={{ position: 'relative' }}>
            <div className="lock"><CertificateView c={certificate} /></div>
            <div className="row" style={{ position: 'absolute', inset: 0, justifyContent: 'center' }}>
              <span className="tag t-pending" style={{ fontSize: 14, padding: '8px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
                <Icon name="lock" /> Locked
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
