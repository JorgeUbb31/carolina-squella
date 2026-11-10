import { useState } from 'react'
import { submitOrder } from '../services/api'
import { savePaymentCartToken } from '../services/cart.service'

const initialForm = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  delivery_address: '',
  delivery_city: '',
  delivery_region: '',
  payment_method: 'bank_transfer'
}

export default function useCheckout(cartToken, onClear) {
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [completedOrder, setCompletedOrder] = useState(null)
  const [showShippingNotice, setShowShippingNotice] = useState(false)
  const [step, setStep] = useState('cart')

  const updateField = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')
    setShowShippingNotice(true)
  }

  const confirmOrder = async () => {
    setShowShippingNotice(false)
    setSubmitting(true)
    setError('')

    try {
      const result = await submitOrder({ ...form, cart_token: cartToken })
      if (result.payment) {
        savePaymentCartToken(result.order.order_number, cartToken)
        const paymentForm = document.createElement('form')
        paymentForm.method = 'POST'
        paymentForm.action = result.payment.url

        const tokenInput = document.createElement('input')
        tokenInput.type = 'hidden'
        tokenInput.name = 'token_ws'
        tokenInput.value = result.payment.token

        paymentForm.appendChild(tokenInput)
        document.body.appendChild(paymentForm)
        paymentForm.submit()
        return
      }

      setCompletedOrder(result.order)
      onClear()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return {
    form,
    updateField,
    submitting,
    error,
    completedOrder,
    showShippingNotice,
    setShowShippingNotice,
    step,
    setStep,
    handleSubmit,
    confirmOrder
  }
}
