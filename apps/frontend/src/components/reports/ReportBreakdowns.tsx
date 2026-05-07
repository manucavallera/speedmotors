// @file: ReportBreakdowns.tsx | Grid 3 columnas: estado de cuotas, forma de pago, gastos por categoría.
import { METHOD_LABELS } from '../../lib/reports/presets'

const cardBase = { background: 'white', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '99px' }} />
    </div>
  )
}

interface ReportBreakdownsProps {
  installments: any
  byPaymentMethod: any[]
  expensesByCategory: any[]
  totalSales: number
  totalExpenses: number
  billingFormal: number
  billingInformal: number
}

export function ReportBreakdowns({ installments, byPaymentMethod, expensesByCategory, totalSales, totalExpenses, billingFormal, billingInformal }: ReportBreakdownsProps) {
  const billingTotal = billingFormal + billingInformal
  const formalPct = billingTotal > 0 ? (billingFormal / billingTotal) * 100 : 0
  const informalPct = billingTotal > 0 ? (billingInformal / billingTotal) * 100 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
      {/* Cuotas */}
      <div style={cardBase}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>💳 Cuotas</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '12px 14px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#15803d' }}>COBRADAS EN EL PERÍODO</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>${installments.paid.total.toLocaleString('es-AR')}</div>
            <div style={{ fontSize: '11px', color: '#15803d' }}>{installments.paid.count} cuota{installments.paid.count !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '12px 14px', border: '1px solid #fecaca' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#dc2626' }}>VENCIDAS (HOY)</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>${installments.overdue.total.toLocaleString('es-AR')}</div>
            <div style={{ fontSize: '11px', color: '#dc2626' }}>{installments.overdue.count} cuota{installments.overdue.count !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ background: '#fffbeb', borderRadius: '10px', padding: '12px 14px', border: '1px solid #fde68a' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#d97706' }}>POR COBRAR (TOTAL)</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>${installments.pending.total.toLocaleString('es-AR')}</div>
            <div style={{ fontSize: '11px', color: '#d97706' }}>{installments.pending.count} cuota{installments.pending.count !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      {/* Forma de pago */}
      <div style={cardBase}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>💵 Forma de pago</h3>
        {byPaymentMethod.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>Sin ventas en el período</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {byPaymentMethod.map((m: any) => {
              const pct = totalSales > 0 ? (m.total / totalSales) * 100 : 0
              return (
                <div key={m.method}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{METHOD_LABELS[m.method] || m.method}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>${m.total.toLocaleString('es-AR')}</span>
                  </div>
                  <ProgressBar pct={pct} color="linear-gradient(90deg,#3b82f6,#1d4ed8)" />
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{pct.toFixed(0)}%</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Gastos por categoría */}
      <div style={cardBase}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>📁 Gastos por categoría</h3>
        {expensesByCategory.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>Sin gastos en el período</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[...expensesByCategory].sort((a: any, b: any) => b.total - a.total).map((e: any) => {
              const pct = totalExpenses > 0 ? (e.total / totalExpenses) * 100 : 0
              return (
                <div key={e.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500, textTransform: 'capitalize' }}>{e.category}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626' }}>${e.total.toLocaleString('es-AR')}</span>
                  </div>
                  <ProgressBar pct={pct} color="linear-gradient(90deg,#ef4444,#dc2626)" />
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{pct.toFixed(0)}%</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>

    {/* Blanco / Negro */}
    <div style={cardBase}>
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Ventas: blanco / negro</h3>
      {billingTotal === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: '13px' }}>Sin datos de distribución en el período</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '14px 16px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#15803d', marginBottom: '4px' }}>EN BLANCO</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>${billingFormal.toLocaleString('es-AR')}</div>
            <ProgressBar pct={formalPct} color="linear-gradient(90deg,#22c55e,#16a34a)" />
            <div style={{ fontSize: '11px', color: '#15803d', marginTop: '4px' }}>{formalPct.toFixed(0)}%</div>
          </div>
          <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '14px 16px', border: '1px solid #fecaca' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#dc2626', marginBottom: '4px' }}>EN NEGRO</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>${billingInformal.toLocaleString('es-AR')}</div>
            <ProgressBar pct={informalPct} color="linear-gradient(90deg,#f87171,#dc2626)" />
            <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>{informalPct.toFixed(0)}%</div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}
