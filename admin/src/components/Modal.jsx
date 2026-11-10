import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function Modal({ className, eyebrow, title, onClose, children, busy = false }) {
  const titleId = `${className}-title`
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const busyRef = useRef(busy)

  useEffect(() => {
    onCloseRef.current = onClose
    busyRef.current = busy
  }, [onClose, busy])

  useEffect(() => {
    const previouslyFocused = document.activeElement
    const dialog = dialogRef.current
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const focusableElements = () => [...dialog.querySelectorAll(focusableSelector)]
    const initialFocus = dialog.querySelector('input:not([disabled]), select:not([disabled]), textarea:not([disabled])')
      || focusableElements()[0]
      || dialog
    initialFocus.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (!busyRef.current) onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return
      const elements = focusableElements()
      if (elements.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const first = elements[0]
      const last = elements[elements.length - 1]
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [])

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}>
      <section ref={dialogRef} className={className} role="dialog" aria-modal="true" aria-busy={busy} aria-labelledby={titleId} tabIndex="-1">
        <header className="modal-head">
          <div><span className="eyebrow">{eyebrow}</span><h2 id={titleId}>{title}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar" disabled={busy}><X size={19} /></button>
        </header>
        {children}
      </section>
    </div>
  )
}
