import { createContext, useContext, useEffect, useState } from 'react'

// Same approach as the demo: render the ID card / certificate into #pa and
// let the print stylesheet hide everything else.
const PrintCtx = createContext(() => {})
export const usePrint = () => useContext(PrintCtx)

export function PrintProvider({ children }) {
  const [node, setNode] = useState(null)

  useEffect(() => {
    const done = () => {
      document.body.classList.remove('printing')
      setNode(null)
    }
    window.addEventListener('afterprint', done)
    return () => window.removeEventListener('afterprint', done)
  }, [])

  useEffect(() => {
    if (!node) return
    document.body.classList.add('printing')
    const id = setTimeout(() => window.print(), 60) // let #pa paint first
    return () => clearTimeout(id)
  }, [node])

  return (
    <PrintCtx.Provider value={setNode}>
      {children}
      <div id="pa">{node}</div>
    </PrintCtx.Provider>
  )
}
