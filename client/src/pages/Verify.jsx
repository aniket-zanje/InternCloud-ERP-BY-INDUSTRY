import { useParams } from 'react-router-dom'
import { useApi } from '../utils/useApi'
import { fmt } from '../utils/format'

// Public page opened by the QR code on the Virtual ID card
export default function Verify() {
  const { number } = useParams()
  const { data, loading, error } = useApi(`/public/verify/${encodeURIComponent(number)}`)

  return (
    <div className="auth">
      <div className="box">
        <h2>ID verification</h2>
        <p className="sub">{number}</p>
        {loading && <div className="center" style={{ minHeight: 120 }}><div className="spin" /></div>}
        {error && <div className="err">{error}</div>}
        {data && (
          <>
            <p style={{ marginBottom: 14 }}>
              <span className={`tag ${data.valid ? 't-reviewed' : 't-overdue'}`}>
                {data.valid ? 'Valid intern ID' : `Not valid (${data.status.toLowerCase()})`}
              </span>
            </p>
            <div className="vrow"><span>Name</span><b>{data.name}</b></div>
            <div className="vrow"><span>Domain</span><b>{data.domain}</b></div>
            <div className="vrow"><span>Organization</span><b>{data.organization}</b></div>
            <div className="vrow"><span>Valid till</span><b>{fmt(data.validTill)}</b></div>
          </>
        )}
      </div>
    </div>
  )
}
