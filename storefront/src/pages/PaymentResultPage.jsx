import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchOrderPaymentStatus } from '../services/api'
import { getCartToken } from '../services/cart.service'

const paymentMessages = {
  approved: {
    heading: 'Pago confirmado',
    message: 'Transbank confirmó tu pago. Estamos preparando tu pedido.',
    label: 'Pedido'
  },
  cancelled: {
    heading: 'Pago cancelado',
    message: 'No se realizó el pago. Puedes volver al carrito e intentarlo nuevamente.'
  },
  expired: {
    heading: 'Sesión de pago vencida',
    message: 'El tiempo para completar el pago expiró. Vuelve al carrito para iniciar una nueva compra.'
  },
  failed: {
    heading: 'No se pudo completar el pago',
    message: 'Transbank no confirmó el pago. Si ves un cargo en tu cuenta, contáctanos antes de volver a intentarlo.'
  },
  pending: {
    heading: 'Estamos verificando tu pago',
    message: 'No pudimos confirmar el resultado todavía. No vuelvas a pagar por ahora; contáctanos si el estado no se actualiza.'
  },
  review: {
    heading: 'Estamos revisando tu pago',
    message: 'Recibimos una respuesta que requiere revisión manual. No intentes pagar nuevamente; nos pondremos en contacto contigo.'
  }
}

export default function PaymentResultPage({ cartError, onPaymentApproved }) {
  const [searchParams] = useSearchParams()
  const orderNumber = searchParams.get('order')
  const [verifiedStatus, setVerifiedStatus] = useState('pending')
  const [verificationError, setVerificationError] = useState('')

  useEffect(() => {
    if (!orderNumber) {
      setVerifiedStatus('failed')
      return
    }

    fetchOrderPaymentStatus(orderNumber)
      .then(({ status, cart_token: orderCartToken }) => {
        const statusByOrderState = {
          paid: 'approved',
          payment_cancelled: 'cancelled',
          payment_expired: 'expired',
          payment_failed: 'failed',
          payment_review: 'review',
          pending_payment: 'pending'
        }
        const resultStatus = statusByOrderState[status] ?? 'pending'
        setVerifiedStatus(resultStatus)
        if (status === 'paid' && orderCartToken === getCartToken()) {
          onPaymentApproved()
        }
      })
      .catch((error) => setVerificationError(error.message))
  }, [orderNumber, onPaymentApproved])

  const result = paymentMessages[verifiedStatus] ?? paymentMessages.pending

  return (
    <main className="container page-enter">
      <section className="order-confirmation" role="status">
        <span className="eyebrow">Resultado del pago</span>
        <h1>{result.heading}</h1>
        <p>{result.message}</p>
        {orderNumber && <p>{result.label ?? 'Pedido'}: <strong>{orderNumber}</strong></p>}
        {cartError && <p className="form-error" role="alert">{cartError}</p>}
        {verificationError && <p className="form-error" role="alert">{verificationError}</p>}
        <Link className="primary-btn" to="/">Volver a la tienda</Link>
      </section>
    </main>
  )
}
