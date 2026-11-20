import { durationInfo, fmt } from '../utils/format'

/** `c` is the `certificate` object returned by GET /api/intern/certificate */
export default function CertificateView({ c }) {
  const { adj } = durationInfo(c.startDate, c.endDate)
  return (
    <div className="cert">
      <div>
        <div className="k">{c.organization.toUpperCase()}</div>
        <h2>Certificate of Internship</h2>
        <p>This is to certify that</p>
        <div className="nm">{c.name}</div>
        <p>
          has successfully completed a {adj} internship as <b>{c.role}</b> in the domain of{' '}
          <b>{c.domain}</b>, from {fmt(c.startDate)} to {fmt(c.endDate)}, with a final AI
          performance score of <b>{c.aiScore}/100</b>.
        </p>
        <div className="sg">
          <div>{c.mentor || 'Mentor'}<br />Mentor</div>
          <span className="seal">VERIFIED</span>
          <div>Director<br />{c.organization}</div>
        </div>
        <p style={{ fontSize: 11, marginTop: 18, color: '#78716c' }}>
          Certificate ID: {c.number} · Issued {fmt(c.issueDate)}
        </p>
      </div>
    </div>
  )
}
