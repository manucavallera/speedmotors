// @file: ReportMonthlyChart.tsx | Gráfico de barras CSS de evolución mensual (últimos 6 meses).
interface ReportMonthlyChartProps {
  monthlyEvolution: any[]
}

export function ReportMonthlyChart({ monthlyEvolution }: ReportMonthlyChartProps) {
  const maxValue = monthlyEvolution.length
    ? Math.max(...monthlyEvolution.map((m: any) => Math.max(m.sales, m.expenses)))
    : 0

  return (
    <div style={{ background: 'white', borderRadius: '14px', padding: '20px 24px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>📅 Evolución últimos 6 meses</h3>
      {monthlyEvolution.every((m: any) => m.sales === 0 && m.expenses === 0) ? (
        <p style={{ color: '#94a3b8', fontSize: '13px' }}>Sin datos en los últimos 6 meses</p>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', height: '180px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
          {monthlyEvolution.map((m: any) => {
            const salesH = maxValue > 0 ? (m.sales / maxValue) * 100 : 0
            const expH = maxValue > 0 ? (m.expenses / maxValue) * 100 : 0
            return (
              <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '4px', width: '100%', justifyContent: 'center' }}>
                  <div title={`Ventas: $${m.sales.toLocaleString('es-AR')}`}
                    style={{ width: '40%', height: `${salesH}%`, background: 'linear-gradient(180deg,#3b82f6,#1d4ed8)', borderRadius: '6px 6px 0 0', minHeight: m.sales > 0 ? '4px' : '0' }} />
                  <div title={`Gastos: $${m.expenses.toLocaleString('es-AR')}`}
                    style={{ width: '40%', height: `${expH}%`, background: 'linear-gradient(180deg,#ef4444,#dc2626)', borderRadius: '6px 6px 0 0', minHeight: m.expenses > 0 ? '4px' : '0' }} />
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'capitalize' }}>{m.month}</div>
              </div>
            )
          })}
        </div>
      )}
      <div style={{ display: 'flex', gap: '20px', marginTop: '14px', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(180deg,#3b82f6,#1d4ed8)' }} />
          <span style={{ color: '#475569', fontWeight: 500 }}>Ventas</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(180deg,#ef4444,#dc2626)' }} />
          <span style={{ color: '#475569', fontWeight: 500 }}>Gastos</span>
        </div>
      </div>
    </div>
  )
}
