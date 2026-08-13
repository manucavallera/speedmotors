import { useMemo } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { InfoBanner } from '../components/ui/InfoBanner'
import { ValuationActionBar } from '../components/stock-valuation/ValuationActionBar'
import { ValuationEditor } from '../components/stock-valuation/ValuationEditor'
import { ValuationHistory } from '../components/stock-valuation/ValuationHistory'
import { ValuationSummary } from '../components/stock-valuation/ValuationSummary'
import { useAuth } from '../hooks/useAuth'
import { useStockValuation } from '../hooks/useStockValuation'
import { apiError } from '../lib/api'
import { toast } from '../lib/toast'
import { validateDraft, vehicleEditUrl } from '../lib/stockValuation'

const currentPeriod = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const isValidPeriod = (value: string | null): value is string =>
  value !== null && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)

export function StockValuationPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAdmin } = useAuth()
  const requestedPeriod = searchParams.get('period')
  const period = isValidPeriod(requestedPeriod) ? requestedPeriod : currentPeriod()
  const valuation = useStockValuation(period, isAdmin)
  const errors = useMemo(() => validateDraft(valuation.draft, valuation.generalMargin), [valuation.draft, valuation.generalMargin])
  const previewReady = valuation.previewReady && errors.length === 0

  const setPeriod = (nextPeriod: string) => {
    if (!isValidPeriod(nextPeriod)) return
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('period', nextPeriod)
      return next
    })
  }

  if (!isAdmin) return <Navigate to="/vehicles" replace />

  const preview = async () => {
    if (valuation.previewBlockReason) return toast.error(valuation.previewBlockReason)
    if (errors.length > 0) return toast.error(errors[0])
    if (valuation.previewMutation.isPending) return
    try {
      await valuation.requestPreview()
    } catch (error) {
      toast.error((error as { response?: unknown }).response
        ? apiError(error)
        : error instanceof Error ? error.message : apiError(error))
    }
  }

  const close = async () => {
    if (!previewReady || !valuation.preview) return
    const totals = valuation.preview.totals
    if (!window.confirm(`Confirmar cierre ${period}\n${totals.totalUnits} motos\nCosto total: ${totals.totalCost.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}\nVenta potencial: ${totals.totalSell.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}`)) return
    try {
      await valuation.close()
      toast.success(`Cierre ${period} guardado`)
    } catch (error) {
      const response = (error as { response?: { status?: number; data?: { code?: string } } })?.response
      if (response?.status === 409 && response.data?.code === 'PERIOD_EXISTS' && window.confirm(`Ya existe el cierre ${period}. ¿Querés reemplazarlo con el stock y precios actuales?`)) {
        try {
          await valuation.close(true)
          toast.success(`Cierre ${period} reemplazado`)
        } catch (replaceError) {
          toast.error((replaceError as { response?: unknown }).response
            ? apiError(replaceError)
            : replaceError instanceof Error ? replaceError.message : apiError(replaceError))
        }
      } else {
        toast.error(apiError(error))
      }
    }
  }

  const refresh = async () => {
    if (valuation.isDirty && !window.confirm('Hay cambios sin confirmar. ¿Querés descartarlos y actualizar el stock?')) return
    try {
      const result = await valuation.refreshStock()
      if (result === 'updated') toast.success('Stock actualizado')
      else toast.info('Conservamos los cambios hechos mientras se actualizaba. Actualizá nuevamente para descartarlos.')
    } catch (error) {
      toast.error(apiError(error))
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

      <ValuationActionBar
        existingValuation={valuation.current?.existingValuation ?? null}
        previewReady={previewReady}
        previewBlockReason={valuation.previewBlockReason}
        isDirty={valuation.isDirty}
        errors={errors}
        isRefreshing={valuation.currentQuery.isRefetching}
        isPreviewing={valuation.previewMutation.isPending}
        isClosing={valuation.closeMutation.isPending}
        onManage={() => navigate('/vehicles')}
        onRefresh={refresh}
        onPreview={preview}
        onClose={close}
      />

      {valuation.current?.existingValuation && (
        <div style={{ marginBottom: '18px', padding: '10px 12px', border: '1px solid #fed7aa', borderRadius: '9px', background: '#fff7ed', color: '#9a3412', fontSize: '12.5px' }}>
          Este período ya tiene cierre. Confirmarlo nuevamente reemplazará la fotografía existente.
        </div>
      )}

      {valuation.currentQuery.isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Cargando stock…</div>
      ) : valuation.currentQuery.isError && !valuation.currentQuery.data ? (
        <div style={{ padding: '18px', background: '#fef2f2', color: '#b91c1c', borderRadius: '10px' }}>No se pudo cargar el stock. {apiError(valuation.currentQuery.error)}</div>
      ) : valuation.draft.length === 0 ? (
        <div style={{ padding: '32px', background: 'white', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>No hay motos disponibles o reservadas para valuar.</div>
      ) : (
        <>
          <ValuationEditor groups={valuation.draft} generalMargin={valuation.generalMargin} onGeneralMarginChange={valuation.setGeneralMargin} onGroupsChange={valuation.setDraft} onEditUnit={(unit) => navigate(vehicleEditUrl(unit.id, unit.internalCode, period))} />
          <ValuationSummary preview={valuation.preview} errors={errors} onReset={valuation.resetDraft} />
        </>
      )}

      <ValuationHistory history={valuation.history} detail={valuation.detail} selectedId={valuation.selectedHistoryId} isLoading={valuation.detailQuery.isLoading} onSelect={valuation.selectHistory} />
    </div>
  )
}
