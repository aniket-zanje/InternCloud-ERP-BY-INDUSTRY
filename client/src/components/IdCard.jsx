import { QRCodeSVG } from 'qrcode.react'
import Avatar from './Avatar'
import { fmt } from '../utils/format'

/** The Virtual ID card. `profile` is the object returned by GET /api/intern/profile */
export default function IdCard({ profile }) {
  const { user, intern, mentor, organization, virtualId } = profile
  return (
    <div className="idc">
      <div className="h">
        <b>{organization.name.toUpperCase()}</b>
        <span>INTERN IDENTITY CARD</span>
      </div>
      <div className="p"><Avatar photo={user.photo} name={user.fullName} /></div>
      <h3>{user.fullName}</h3>
      <div className="r">{intern.role}</div>
      <dl>
        <dt>ID No.</dt><dd>{virtualId.number}</dd>
        <dt>Domain</dt><dd>{intern.domain}</dd>
        <dt>Mentor</dt><dd>{mentor || 'Not assigned yet'}</dd>
        {user.bloodGroup && (<><dt>Blood group</dt><dd>{user.bloodGroup}</dd></>)}
        <dt>Valid till</dt><dd>{fmt(virtualId.validTill)}</dd>
      </dl>
      <div className="f">
        <small>
          Scan to verify<br />
          Issued by {organization.name}
          {organization.address && <>,<br />{organization.address}</>}
        </small>
        <QRCodeSVG value={virtualId.qrValue} size={66} level="M" bgColor="#ffffff" fgColor="#0f172a" />
      </div>
    </div>
  )
}
