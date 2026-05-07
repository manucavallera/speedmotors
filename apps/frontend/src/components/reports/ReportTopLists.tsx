// @file: ReportTopLists.tsx | Grid 2 columnas: top clientes y top productos del período.
interface ReportTopListsProps {
  topClients: any[]
  topProducts: any[]
}

function RankBadge({ index, color }: { index: number; color: string }) {
  return (
    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: index === 0 ? color : '#f1f5f9', color: index === 0 ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
      {index + 1}
    </div>
  )
}

const cardBase = { background: 'white', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }

export function ReportTopLists({ topClients, topProducts }: ReportTopListsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
      <div style={cardBase}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>🏆 Top clientes del período</h3>
        {topClients.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>Sin clientes con ventas en el período</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {topClients.map((c: any, i: number) => (
              <div key={c.clientId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: i < topClients.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <RankBadge index={i} color="linear-gradient(135deg,#fbbf24,#f59e0b)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{c.count} venta{c.count !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>${c.total.toLocaleString('es-AR')}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={cardBase}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>🔥 Top productos vendidos</h3>
        {topProducts.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>Sin productos vendidos en el período</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {topProducts.map((p: any, i: number) => (
              <div key={p.productId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: i < topProducts.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <RankBadge index={i} color="linear-gradient(135deg,#f97316,#ea580c)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{p.quantity} unidad{p.quantity !== 1 ? 'es' : ''}</div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>${p.total.toLocaleString('es-AR')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
