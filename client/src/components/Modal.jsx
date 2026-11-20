import { useEffect, useRef } from 'react'
import Icon from './Icon'

/** Native <dialog>, styled by the demo's dialog / .m CSS. Children mount only while open. */
export default function Modal({ open, onClose, children }) {
  const ref = useRef(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="m">
        {open && (
          <>
            <button className="x" aria-label="Close" onClick={onClose}>
              <Icon name="x" />
            </button>
            {children}
          </>
        )}
      </div>
    </dialog>
  )
}
