import { useEffect, useState } from 'react'
import { fetchOrderPaymentStatus } from '../services/api'
import { getCartToken } from '../services/cart.service'

const paymentStatusByOrderState = {
  paid: 'approved',
  payment_cancelled: 'cancelled',
  payment_expired: 'expired',
  payment_failed: 'failed',
  payment_review: 'review',
  pending_payment: 'pending'
}

export default function usePaymentResult(orderNumber, onPaymentApproved) {
  const [status, setStatus] = useState('pending')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (!orderNumber) {
      setStatus('failed')
      return () => {
        active = false
      }
    }

    fetchOrderPaymentStatus(orderNumber)
      .then(({ status: orderStatus, cart_token: orderCartToken }) => {
        if (!active) return
        setStatus(paymentStatusByOrderState[orderStatus] ?? 'pending')
        if (orderStatus === 'paid' && orderCartToken === getCartToken()) {
          onPaymentApproved()
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })

    return () => {
      active = false
    }
  }, [orderNumber, onPaymentApproved])

  return { status, error }
}
