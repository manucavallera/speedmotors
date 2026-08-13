import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { btnPrimary, btnSecondary } from '../ui/FormField'
import type { ValuationProjection } from '../../types/stock-valuation.types'

interface Props {
  preview: ValuationProjection | null
  errors: string[]
  isPreviewing: boolean
  isClosing: boolean
  onPreview: () => void
  onClose: () => void
  onReset: () => void
}

const money = (value: number) => value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 })

export function ValuationSummary({ preview, errors, isPreviewing, isClosing, onPreview, onClose, onReset }: Props) {
  return (
    <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Resumen del cierre</h2>
          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#64748b' }}>La previsualización del servidor es la fuente final antes de guardar.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" onClick={onReset} style={btnSecondary}>Restablecer</button>
          <button type="button" onClick={onPreview} disabled={errors.length > 0 || isPreviewing} style={{ ...btnSecondary, opacity: errors.length > 0 || isPreviewing ? 0.55 : 1 }}>
            {isPreviewing ? 'Calculando…' : 'Previsualizar cierre'}
          </button>
          {preview && <button type="button" onClick={onClose} disabled={isClosing} style={{ ...btnPrimary, opacity: isClosing ? 0.6 : 1 }}>{isClosing ? 'Guardando…' : 'Confirmar cierre'}</button>}
        </div>
      </div>

      {errors.length > 0 && (
        <div style={{ marginTop: '14px', padding: '10px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '9px', color: '#9a3412', fontSize: '12px', display: 'flex', gap: '8px' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>{errors.length} campo{errors.length === 1 ? '' : 's'} pendiente{errors.length === 1 ? '' : 's'}. Corregilos para previsualizar.</span>
        </div>
      )}

      {preview && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#166534', fontSize: '12.5px', fontWeight: 700, marginBottom: '10px' }}><CheckCircle2 size={16} /> Previsualización vigente</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '10px' }}>
            {[
              ['Grupos', String(preview.groups.length)],
              ['Grupos con cambios', String(preview.groups.filter((group) => group.currentCostPrice !== group.costPrice || group.saleMode !== 'unchanged').length)],
              ['Unidades', String(preview.totals.totalUnits)],
              ['Disponibles', String(preview.totals.availableUnits)],
              ['Reservadas', String(preview.totals.reservedUnits)],
              ['Capital a costo', money(preview.totals.totalCost)],
              ['Venta potencial', money(preview.totals.totalSell)],
              ['Margen potencial', money(preview.totals.potentialMargin)],
              ['Sin precio', String(preview.totals.unpricedSaleUnits)],
            ].map(([label, value]) => (
              <div key={label} style={{ background: '#f8fafc', borderRadius: '9px', padding: '10px 12px' }}>
                <div style={{ color: '#64748b', fontSize: '11px' }}>{label}</div>
                <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '14px', marginTop: '3px' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
