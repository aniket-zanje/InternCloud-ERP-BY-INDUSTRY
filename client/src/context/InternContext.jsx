import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from './AuthContext'
import { useNavigate } from 'react-router-dom'

const InternCtx = createContext(null)
export const useIntern = () => useContext(InternCtx)

/** Loads the intern profile once (header, sidebar badge, ID card) and shares it. */
export function InternProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)
  const { logout } = useAuth()
  const navigate = useNavigate()

  const refresh = useCallback(async () => {
    try {
      setProfile(await api.get('/intern/profile'))
      setError(null)
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const setPhoto = (photo) => setProfile((p) => ({ ...p, user: { ...p.user, photo } }))

  if (error && !profile) {
    return (
      <div className="fullpage">
        <div className="card" style={{ maxWidth: 440, textAlign: 'center' }}>
          <h3>We couldn’t load your dashboard</h3>
          <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>{error}</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn btn-p" onClick={refresh}>Try again</button>
            <button
              className="btn btn-g"
              onClick={() => {
                logout()
                navigate('/login', { replace: true })
              }}
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="fullpage">
        <div className="spin" aria-label="Loading" />
      </div>
    )
  }

  return <InternCtx.Provider value={{ profile, refresh, setPhoto }}>{children}</InternCtx.Provider>
}
