import { AlertTriangle, LoaderCircle } from 'lucide-react'
import Modal from './Modal'

export default function ConfirmationModal({ title, message, busy, onCancel, onConfirm }) {
  return (
    <Modal
      className="confirmation-modal"
      eyebrow="CONFIRMACIÓN"
      title={title}
      onClose={onCancel}
      busy={busy}
    >
      <p className="confirmation-message">
        <AlertTriangle size={18} />
        <span>{message}</span>
      </p>
      <footer className="modal-actions">
        <button className="button button-quiet" type="button" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
        <button className="button button-danger" type="button" onClick={onConfirm} disabled={busy}>
          {busy && <LoaderCircle className="spin" size={17} />}
          Eliminar
        </button>
      </footer>
    </Modal>
  )
}
