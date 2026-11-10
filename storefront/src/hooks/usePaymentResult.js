import { useEffect, useState } from 'react'
import { fetchOrderPaymentStatus } from '../services/api'
import {
  getCartToken,
  getPaymentCartToken,
  removePaymentCartToken
} from '../services/cart.service'

const paymentStatusByOrderState = {
  paid: 'approved',
  payment_cancelled: 'cancelled',
  payment_expired: 'expired',
  payment_failed: 'failed',
  payment_review: 'review',
  pending_payment: 'pending'
}

const POLL_MS = 15000
const MAX_ATTEMPTS = 20

export default function usePaymentResult(orderNumber, onPaymentApproved) {
  const [status, setStatus] = useState('pending')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    let timer
    let attempts = 0

    setStatus(orderNumber ? 'pending' : 'failed')
    setError('')

    if (!orderNumber) {
      return () => {
        active = false
      }
    }

    const orderCartToken = getPaymentCartToken(orderNumber)

    async function tick() {
      try {
        const { status: orderStatus } = await fetchOrderPaymentStatus(orderNumber)
        if (!active) return

        setError('')
        setStatus(paymentStatusByOrderState[orderStatus] ?? 'pending')

        if (orderStatus === 'paid' && orderCartToken && orderCartToken === getCartToken()) {
          onPaymentApproved()
        }

        if (orderStatus !== 'pending_payment') {
          removePaymentCartToken(orderNumber)
          return
        }
      } catch (requestError) {
        if (active) setError(requestError.message)
      }

      attempts += 1
      if (active && attempts < MAX_ATTEMPTS) {
        timer = window.setTimeout(tick, POLL_MS)
      }
    }

    tick()

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [orderNumber, onPaymentApproved])

  return { status, error }
}
