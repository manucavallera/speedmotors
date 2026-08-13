import type { StockValuationDetail, StockValuationHeader } from '../../types/stock-valuation.types'

interface Props {
  history: StockValuationHeader[]
  detail?: StockValuationDetail
  selectedId: number | null
  isLoading: boolean
  onSelect: (id: number) => void
}

const money = (value: string | number) => Number(value).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 })

export function ValuationHistory({ history, detail, selectedId, isLoading, onSelect }: Props) {
  return (
    <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
        <h2 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Historial de cierres</h2>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12.5px' }}>Cada detalle queda congelado aunque después cambie el inventario.</p>
      </div>
      {history.length === 0 ? (
        <div style={{ padding: '24px', color: '#94a3b8', textAlign: 'center', fontSize: '13px' }}>Todavía no hay cierres mensuales.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(190px, 260px) minmax(0, 1fr)', minHeight: '260px' }}>
          <div style={{ borderRight: '1px solid #e2e8f0', padding: '8px', overflow: 'auto' }}>
            {history.map((item) => (
              <button key={item.id} type="button" onClick={() => onSelect(item.id)} style={{ width: '100%', textAlign: 'left', border: 0, borderRadius: '8px', padding: '10px', marginBottom: '4px', cursor: 'pointer', background: selectedId === item.id ? '#eff6ff' : 'transparent', color: selectedId === item.id ? '#1d4ed8' : '#334155' }}>
                <div style={{ fontWeight: 700 }}>{item.period}</div>
                <div style={{ fontSize: '11.5px', marginTop: '3px', color: '#64748b' }}>{item.totalUnits} motos · {money(item.totalCost)}</div>
              </button>
            ))}
          </div>
          <div style={{ padding: '14px', overflowX: 'auto' }}>
            {isLoading && <div style={{ color: '#94a3b8' }}>Cargando detalle…</div>}
            {!isLoading && !detail && <div style={{ color: '#94a3b8' }}>Elegí un cierre para ver su detalle.</div>}
            {detail && (
              <>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '12.5px', color: '#475569', marginBottom: '12px' }}>
                  <strong style={{ color: '#0f172a' }}>{detail.period}</strong>
                  <span>Cerrado {new Date(detail.closedAt).toLocaleString('es-AR')}</span>
                  <span>{detail.totalUnits} motos</span>
                  <span>{detail.availableUnits} disponibles</span>
                  <span>{detail.reservedUnits} reservadas</span>
                  <span>Costo {money(detail.totalCost)}</span>
                  <span>Venta {money(detail.totalSell)}</span>
                  <span>Margen {money(detail.potentialMargin)}</span>
                  <span style={{ color: detail.unpricedSaleUnits > 0 ? '#b45309' : '#475569', fontWeight: detail.unpricedSaleUnits > 0 ? 700 : 400 }}>{detail.unpricedSaleUnits} sin precio de venta</span>
                </div>
                <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead><tr style={{ textAlign: 'left', background: '#f8fafc' }}>{['Moto', 'Disp.', 'Reserv.', 'Costo', 'Venta', 'Total costo', 'Total venta'].map((title) => <th key={title} style={{ padding: '8px' }}>{title}</th>)}</tr></thead>
                  <tbody>{detail.lines.map((line) => (
                    <tr key={line.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px', fontWeight: 600 }}>{line.brand} {line.model} {line.version || 'Sin versión'}</td>
                      <td style={{ padding: '8px' }}>{line.availableUnits}</td>
                      <td style={{ padding: '8px' }}>{line.reservedUnits}</td>
                      <td style={{ padding: '8px' }}>{money(line.costPrice)}</td>
                      <td style={{ padding: '8px' }}>{line.sellPrice === null ? 'Varios' : money(line.sellPrice)}</td>
                      <td style={{ padding: '8px' }}>{money(line.totalCost)}</td>
                      <td style={{ padding: '8px' }}>{money(line.totalSell)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
