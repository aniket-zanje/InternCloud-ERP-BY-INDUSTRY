import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, booting, logout } = useAuth()
  const location = useLocation()

  if (booting) {
    return (
      <div className="fullpage">
        <div className="spin" aria-label="Loading" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  if (user.role !== 'CANDIDATE') {
    return (
      <div className="fullpage">
        <div className="card" style={{ maxWidth: 440, textAlign: 'center' }}>
          <h3>Intern accounts only</h3>
          <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>
            This is the intern dashboard. Your account ({user.role.replace('_', ' ').toLowerCase()}) will
            get its own dashboard.
          </p>
          <button className="btn btn-p" onClick={logout}>Sign out</button>
        </div>
      </div>
    )
  }
  return children
}
