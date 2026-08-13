import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { InfoBanner } from '../components/ui/InfoBanner'
import { ValuationEditor } from '../components/stock-valuation/ValuationEditor'
import { ValuationHistory } from '../components/stock-valuation/ValuationHistory'
import { ValuationSummary } from '../components/stock-valuation/ValuationSummary'
import { useAuth } from '../hooks/useAuth'
import { useStockValuation } from '../hooks/useStockValuation'
import { apiError } from '../lib/api'
import { toast } from '../lib/toast'
import { validateDraft } from '../lib/stockValuation'

const currentPeriod = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function StockValuationPage() {
  const { isAdmin } = useAuth()
  const [period, setPeriod] = useState(currentPeriod)
  const valuation = useStockValuation(period)
  const errors = useMemo(() => validateDraft(valuation.draft, valuation.generalMargin), [valuation.draft, valuation.generalMargin])

  if (!isAdmin) return <Navigate to="/vehicles" replace />

  const preview = async () => {
    if (errors.length > 0) return toast.error(errors[0])
    try {
      await valuation.previewMutation.mutateAsync()
    } catch (error) {
      toast.error(apiError(error))
    }
  }

  const close = async () => {
    if (!valuation.preview) return
    const totals = valuation.preview.totals
    if (!window.confirm(`Confirmar cierre ${period}\n${totals.totalUnits} motos\nCosto total: ${totals.totalCost.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}\nVenta potencial: ${totals.totalSell.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}`)) return
    try {
      await valuation.close()
      toast.success(`Cierre ${period} guardado`)
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 409 && window.confirm(`Ya existe el cierre ${period}. ¿Querés reemplazarlo con el stock y precios actuales?`)) {
        try {
          await valuation.close(true)
          toast.success(`Cierre ${period} reemplazado`)
        } catch (replaceError) {
          toast.error(apiError(replaceError))
        }
      } else if (status !== 409) {
        toast.error(apiError(error))
      }
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Valuación de stock</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>Actualización mensual por marca, modelo y versión</p>
        </div>
        <label style={{ color: '#475569', fontSize: '12px', fontWeight: 700 }}>
          Período
          <input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} style={{ display: 'block', marginTop: '5px', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '9px', color: '#0f172a' }} />
        </label>
      </div>

      <InfoBanner title="Cierre mensual del stock de motos">
        Se incluyen todas las marcas de motos <strong>disponibles y reservadas</strong>, agrupadas por marca, modelo y versión. Las vendidas y las lanchas quedan fuera. Nada cambia hasta confirmar el cierre.
      </InfoBanner>

      {valuation.currentQuery.isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Cargando stock…</div>
      ) : valuation.currentQuery.isError ? (
        <div style={{ padding: '18px', background: '#fef2f2', color: '#b91c1c', borderRadius: '10px' }}>No se pudo cargar el stock. {apiError(valuation.currentQuery.error)}</div>
      ) : valuation.draft.length === 0 ? (
        <div style={{ padding: '32px', background: 'white', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>No hay motos disponibles o reservadas para valuar.</div>
      ) : (
        <>
          <ValuationEditor groups={valuation.draft} generalMargin={valuation.generalMargin} onGeneralMarginChange={valuation.setGeneralMargin} onGroupsChange={valuation.setDraft} />
          <ValuationSummary preview={valuation.preview} errors={errors} isPreviewing={valuation.previewMutation.isPending} isClosing={valuation.closeMutation.isPending} onPreview={preview} onClose={close} onReset={valuation.resetDraft} />
        </>
      )}

      <ValuationHistory history={valuation.history} detail={valuation.detail} selectedId={valuation.selectedHistoryId} isLoading={valuation.detailQuery.isLoading} onSelect={valuation.selectHistory} />
    </div>
  )
}
