import { useEffect, useMemo, useState } from 'react'
import { getToken } from '../services/api'
import {
  completeInventoryControl,
  createInventoryControl,
  getInventoryControl,
  getInventoryControlReport,
  getInventoryControls,
  saveInventoryControlCount,
} from '../services/inventoryControls.service'
import { getInventoryControlSummary } from '../utils/inventoryControls'

function isAbortError(error) {
  return error?.name === 'AbortError'
}

export default function useInventoryControls(onSessionExpired) {
  const [controls, setControls] = useState([])
  const [control, setControl] = useState(null)
  const [countDrafts, setCountDrafts] = useState({})
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [savingItemId, setSavingItemId] = useState(null)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const summary = useMemo(() => getInventoryControlSummary(control?.items), [control?.items])
  const activeControl = controls.find((entry) => entry.status === 'in_progress')

  useEffect(() => {
    const controller = new AbortController()

    async function loadControls() {
      setLoading(true)
      try {
        const result = await getInventoryControls({ per_page: '50' }, { signal: controller.signal })
        const entries = result.data || []
        setControls(entries)
        const selected = entries.find((entry) => entry.status === 'in_progress')
        setControl(selected ? await getInventoryControl(selected.id, { signal: controller.signal }) : null)
      } catch (loadError) {
        if (isAbortError(loadError)) return
        setError(loadError.message)
        if (!getToken()) onSessionExpired()
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadControls()
    return () => controller.abort()
  }, [onSessionExpired])

  useEffect(() => {
    setCountDrafts(Object.fromEntries((control?.items || []).map((item) => [item.id, item.counted_stock ?? ''])))
  }, [control?.id])

  async function handleStart() {
    setCreating(true)
    setError('')
    setNotice('')
    try {
      const created = await createInventoryControl()
      setControl(created)
      setControls((current) => [created, ...current.filter((entry) => entry.id !== created.id)])
      setNotice(`Se inició el control ${created.number}.`)
    } catch (createError) {
      setError(createError.message)
      if (!getToken()) onSessionExpired()
    } finally {
      setCreating(false)
    }
  }

  async function handleSelect(controlId) {
    setError('')
    try {
      setControl(await getInventoryControl(controlId))
    } catch (loadError) {
      setError(loadError.message)
      if (!getToken()) onSessionExpired()
    }
  }

  function handleDraftChange(itemId, value) {
    setCountDrafts((current) => ({ ...current, [itemId]: value }))
  }

  async function handleSaveCount(item) {
    const value = countDrafts[item.id]
    if (value === '' || value === undefined || Number(value) < 0) return

    setSavingItemId(item.id)
    setError('')
    setNotice('')
    try {
      const updatedItem = await saveInventoryControlCount(control.id, item.id, {
        counted_stock: Number(value),
      })
      setControl((current) => ({
        ...current,
        items: current.items.map((row) => row.id === item.id ? updatedItem : row),
      }))
      setNotice(`Conteo guardado: ${item.product_name}.`)
    } catch (saveError) {
      setError(saveError.message)
      if (!getToken()) onSessionExpired()
    } finally {
      setSavingItemId(null)
    }
  }

  async function openReport(controlId, openedWindow) {
    const reportWindow = openedWindow === undefined ? window.open('', '_blank') : openedWindow
    if (!reportWindow) {
      setError('El navegador bloqueó la nueva pestaña. Permite ventanas emergentes para ver el informe.')
      return
    }

    reportWindow.document.title = 'Preparando informe de inventario'
    reportWindow.document.body.textContent = 'Preparando informe…'
    try {
      const pdf = await getInventoryControlReport(controlId)
      reportWindow.location.href = URL.createObjectURL(pdf)
    } catch (reportError) {
      reportWindow.close()
      setError(reportError.message)
      if (!getToken()) onSessionExpired()
    }
  }

  async function handleComplete() {
    if (!window.confirm('Al confirmar, los ajustes se aplicarán al inventario y no podrán editarse. ¿Continuar?')) return

    const reportWindow = window.open('', '_blank')
    if (reportWindow) {
      reportWindow.document.title = 'Preparando informe de inventario'
      reportWindow.document.body.textContent = 'Preparando informe…'
    }

    setCompleting(true)
    setError('')
    setNotice('')
    try {
      const completed = await completeInventoryControl(control.id)
      setControl(null)
      setControls((current) => current.map((entry) => entry.id === completed.id ? completed : entry))
      setNotice(`Control ${completed.number} finalizado. Selecciónalo en el historial para revisar sus datos.`)
      await openReport(completed.id, reportWindow)
    } catch (completeError) {
      reportWindow?.close()
      setError(completeError.message)
      if (!getToken()) onSessionExpired()
    } finally {
      setCompleting(false)
    }
  }

  return {
    controls,
    control,
    countDrafts,
    loading,
    creating,
    savingItemId,
    completing,
    error,
    notice,
    summary,
    activeControl,
    handleStart,
    handleSelect,
    handleDraftChange,
    handleSaveCount,
    handleComplete,
    openReport,
  }
}