import { AlertCircle, Check, ClipboardCheck, LoaderCircle, Plus } from 'lucide-react'
import InventoryControlDetail from '../components/InventoryControlDetail'
import InventoryControlHistory from '../components/InventoryControlHistory'
import useInventoryControls from '../hooks/useInventoryControls'

export default function InventoryControlPage({ onSessionExpired }) {
  const inventoryControl = useInventoryControls(onSessionExpired)
  const {
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
  } = inventoryControl

  return (
    <div className="inventory-control-page">
      <div className="page-heading">
        <div>
          <h1>Control de inventario.</h1>
          <p>Compara las existencias del sistema con el conteo físico de la tienda.</p>
        </div>
        {!activeControl && (
          <button className="button button-primary" type="button" disabled={creating || loading} onClick={handleStart}>
            <Plus size={17} />{creating ? 'Iniciando…' : 'Iniciar control'}
          </button>
        )}
      </div>

      {error && <div className="inline-alert"><AlertCircle size={17} /><span>{error}</span></div>}
      {notice && <div className="inline-success"><Check size={17} /><span>{notice}</span></div>}

      {loading ? (
        <div className="inventory-control-loading"><LoaderCircle className="spin" size={20} />Cargando controles…</div>
      ) : controls.length === 0 ? (
        <section className="inventory-section inventory-control-empty">
          <div className="empty-symbol"><ClipboardCheck size={24} /></div>
          <strong>Aún no hay controles</strong>
          <span>Inicia un control para comparar el stock registrado con el conteo de la tienda.</span>
        </section>
      ) : (
        <div className="inventory-control-layout">
          <InventoryControlHistory
            controls={controls}
            selectedControlId={control?.id}
            onSelect={handleSelect}
          />
          {control && (
            <InventoryControlDetail
              control={control}
              summary={summary}
              countDrafts={countDrafts}
              savingItemId={savingItemId}
              completing={completing}
              onComplete={handleComplete}
              onOpenReport={openReport}
              onDraftChange={handleDraftChange}
              onSaveCount={handleSaveCount}
            />
          )}
        </div>
      )}
    </div>
  )
}