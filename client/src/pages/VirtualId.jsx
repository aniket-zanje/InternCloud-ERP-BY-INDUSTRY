import { useIntern } from '../context/InternContext'
import { usePrint } from '../context/PrintContext'
import IdCard from '../components/IdCard'
import Icon from '../components/Icon'

export default function VirtualId() {
  const { profile } = useIntern()
  const print = usePrint()
  const inactive = profile.virtualId.status !== 'ACTIVE'

  return (
    <>
      <div className="ph">
        <h2>Virtual ID</h2>
        <p>Your digital identity card, generated automatically for the internship.</p>
      </div>
      <div className="idwrap">
        <IdCard profile={profile} />
        <div className="card" style={{ maxWidth: 460 }}>
          <h3>Using your ID</h3>
          {inactive && (
            <div className="err">This ID is currently {profile.virtualId.status.toLowerCase()}. Contact your organization.</div>
          )}
          <ul className="list">
            <li><Icon name="check" />Show this card for office entry and mentor sessions.</li>
            <li><Icon name="check" />Scan the QR code to verify the intern and internship validity.</li>
            <li><Icon name="check" />Click your profile photo in the header to update the photo on this card.</li>
          </ul>
          <button className="btn btn-p" style={{ marginTop: 20 }} onClick={() => print(<IdCard profile={profile} />)}>
            <Icon name="dl" /> Download ID card
          </button>
        </div>
      </div>
    </>
  )
}
