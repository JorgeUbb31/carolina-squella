import { useState } from 'react'
import { submitQuoteRequest } from '../services/api'

export default function useQuoteRequest() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')

  const reset = () => {
    setError('')
    setResult('')
  }

  const submit = async (items, quoteRequest) => {
    const payload = {
      ...quoteRequest,
      items: items.map(({ slug, quantity }) => ({ slug, quantity: Number(quantity) })),
    }
    setSubmitting(true)
    setError('')

    try {
      const response = await submitQuoteRequest(payload)
      setResult(response.message)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return { submitting, error, result, reset, submit }
}
