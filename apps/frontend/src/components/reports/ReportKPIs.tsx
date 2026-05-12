// @file: ReportKPIs.tsx | 4 tarjetas KPI (ingresos, ventas, gastos, ganancia) con ChangeBadge.
function ChangeBadge({ value, invertColor }: { value: number; invertColor?: boolean }) {
  const isPositive = value >= 0
  const isGood = invertColor ? !isPositive : isPositive
  const color = isGood ? '#16a34a' : '#dc2626'
  const bg = isGood ? '#f0fdf4' : '#fef2f2'
  return (
    <span style={{ fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: bg, color }}>
      {isPositive ? '↑' : '↓'} {Math.abs(value).toFixed(1)}%
    </span>
  )
}

const cardBase = { background: 'white', borderRadius: '14px', padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }

interface ReportKPIsProps {
  data: any
}

export function ReportKPIs({ data }: ReportKPIsProps) {
  const profitColor = data.current.profit >= 0 ? '#16a34a' : '#dc2626'
  const profitBg = data.current.profit >= 0 ? '#f0fdf4' : '#fef2f2'
  const profitBorder = data.current.profit >= 0 ? '#bbf7d0' : '#fecaca'

  return (
    <div className="grid-4" style={{ display: 'grid', gap: '14px', marginBottom: '24px' }}>
      <div style={cardBase}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>📈 INGRESOS</span>
          <ChangeBadge value={data.changes.sales} />
        </div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>${data.current.sales.total.toLocaleString('es-AR')}</div>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Antes: ${data.previous.sales.total.toLocaleString('es-AR')}</div>
      </div>

      <div style={cardBase}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>🛒 VENTAS</span>
          <ChangeBadge value={data.changes.salesCount} />
        </div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>{data.current.sales.count}</div>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Antes: {data.previous.sales.count}</div>
      </div>

      <div style={cardBase}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>📉 GASTOS</span>
          <ChangeBadge value={data.changes.expenses} invertColor />
        </div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>${data.current.expenses.total.toLocaleString('es-AR')}</div>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Antes: ${data.previous.expenses.total.toLocaleString('es-AR')}</div>
      </div>

      <div style={{ ...cardBase, background: profitBg, border: `1px solid ${profitBorder}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: profitColor }}>💰 GANANCIA</span>
          <ChangeBadge value={data.changes.profit} />
        </div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: profitColor }}>${data.current.profit.toLocaleString('es-AR')}</div>
        <div style={{ fontSize: '11px', color: profitColor, opacity: 0.8, marginTop: '4px' }}>Margen {data.current.margin.toFixed(1)}%</div>
      </div>
    </div>
  )
}
