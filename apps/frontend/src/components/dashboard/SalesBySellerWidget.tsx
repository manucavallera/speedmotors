interface Seller {
  userId: number | null
  name: string
  total: number
  count: number
}

interface Props {
  sellers: Seller[]
  totalSales: number
}

export function SalesBySellerWidget({ sellers, totalSales }: Props) {
  const colors = [
    'linear-gradient(90deg,#3b82f6,#1d4ed8)',
    'linear-gradient(90deg,#8b5cf6,#6d28d9)',
    'linear-gradient(90deg,#10b981,#059669)',
    'linear-gradient(90deg,#f59e0b,#d97706)',
    'linear-gradient(90deg,#ef4444,#dc2626)',
  ]

  return (
    <div style={{ background: 'white', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Ventas por vendedor</h3>
      {sellers.length === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: '13px' }}>Sin ventas este mes</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sellers.map((s, i) => {
            const pct = totalSales > 0 ? (s.total / totalSales) * 100 : 0
            return (
              <div key={s.userId ?? i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                      background: colors[i % colors.length],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '10px', fontWeight: 700,
                    }}>
                      {s.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                    </div>
                    <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{s.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>${s.total.toLocaleString('es-AR')}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{s.count} venta{s.count !== 1 ? 's' : ''} · {pct.toFixed(0)}%</div>
                  </div>
                </div>
                <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: colors[i % colors.length], borderRadius: '99px', transition: 'width 0.4s ease' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
