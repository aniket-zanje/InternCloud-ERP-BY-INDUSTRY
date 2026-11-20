import { useNavigate } from 'react-router-dom'

// Same "You've been signed out" screen as the demo (#out)
export default function SignedOut() {
  const navigate = useNavigate()
  return (
    <div id="out">
      <div>
        <h2>You’ve been signed out</h2>
        <p>Thanks for your hard work today. See you tomorrow!</p>
        <button className="btn btn-p" style={{ margin: 'auto' }} onClick={() => navigate('/login', { replace: true })}>
          Sign in again
        </button>
      </div>
    </div>
  )
}
