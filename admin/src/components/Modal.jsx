import { X } from 'lucide-react'

export default function Modal({ className, eyebrow, title, onClose, children }) {
  const titleId = `${className}-title`

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={className} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="modal-head">
          <div><span className="eyebrow">{eyebrow}</span><h2 id={titleId}>{title}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar"><X size={19} /></button>
        </header>
        {children}
      </section>
    </div>
  )
}
