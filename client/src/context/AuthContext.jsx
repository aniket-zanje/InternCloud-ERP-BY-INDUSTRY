import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, clearToken, getToken, setToken } from '../api/client'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(!!getToken())

  // restore session on page refresh
  useEffect(() => {
    if (!getToken()) return
    api
      .get('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => clearToken())
      .finally(() => setBooting(false))
  }, [])

  // api client fires this when the server answers 401 to an authenticated call
  useEffect(() => {
    const onExpired = () => {
      clearToken()
      setUser(null)
    }
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [])

  const login = useCallback(async (email, password, organizationCode) => {
    const data = await api.post('/auth/login', { body: { email, password, organizationCode } })
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  return <AuthCtx.Provider value={{ user, booting, login, logout }}>{children}</AuthCtx.Provider>
}
