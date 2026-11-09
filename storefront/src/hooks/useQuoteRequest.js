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

  const submit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const quoteRequest = Object.fromEntries(new FormData(form))
    setSubmitting(true)
    setError('')

    try {
      const response = await submitQuoteRequest(quoteRequest)
      setResult(response.message)
      form.reset()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return { submitting, error, result, reset, submit }
}
