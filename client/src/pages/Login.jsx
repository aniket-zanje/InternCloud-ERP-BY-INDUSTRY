import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [needOrg, setNeedOrg] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (user?.role === 'CANDIDATE') return <Navigate to={location.state?.from || '/intern'} replace />

  const submit = async (e) => {
    e.preventDefault()
    const f = e.currentTarget
    setBusy(true)
    setError('')
    try {
      const u = await login(f.email.value, f.password.value, f.org?.value || '')
      if (u.role !== 'CANDIDATE') {
        logout()
        setError('This portal is for interns only. Dashboards for other roles are coming soon.')
        setBusy(false)
        return
      }
      navigate(location.state?.from || '/intern', { replace: true })
    } catch (err) {
      if (err.code === 'ORG_REQUIRED') setNeedOrg(true)
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <div className="box">
        <div className="logo"><b>I</b> InternCloud</div>
        <h2>Intern sign in</h2>
        <p className="sub">Use the email and password shared by your organization.</p>
        <form onSubmit={submit}>
          {error && <div className="err" role="alert">{error}</div>}
          <div className="fld">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="username" required autoFocus />
          </div>
          <div className="fld">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {needOrg && (
            <div className="fld">
              <label htmlFor="org">Organization code</label>
              <input id="org" name="org" required placeholder="e.g. SQI" />
            </div>
          )}
          <button className="btn btn-p" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  )
}
