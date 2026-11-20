import { createContext, useCallback, useContext, useRef, useState } from 'react'
import Icon from '../components/Icon'

const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }) {
  const [t, setT] = useState({ msg: '', on: false, kind: 'ok' })
  const timer = useRef()

  const toast = useCallback((msg, kind = 'ok') => {
    setT({ msg, on: true, kind })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setT((s) => ({ ...s, on: false })), 2600)
  }, [])

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div id="toast" role="status" className={t.on ? 'on' : ''}>
        <Icon name={t.kind === 'error' ? 'x' : 'check'} />
        {t.msg}
      </div>
    </ToastCtx.Provider>
  )
}
