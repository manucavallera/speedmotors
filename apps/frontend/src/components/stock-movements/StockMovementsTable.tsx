const typeColors = {
  entrada: { bg: '#f0fdf4', color: '#16a34a', label: '↑ Entrada' },
  salida:  { bg: '#fef2f2', color: '#dc2626', label: '↓ Salida' },
  ajuste:  { bg: '#eff6ff', color: '#2563eb', label: '⇄ Ajuste' },
}

interface StockMovementsTableProps {
  movements: any[]
  products: any[]
  isLoading: boolean
  onEdit?: (movement: any) => void
  onDelete?: (movement: any) => void
}

export function StockMovementsTable({ movements, products, isLoading, onEdit, onDelete }: StockMovementsTableProps) {
  const thStyle = { padding: '11px 16px', textAlign: 'left' as const, fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }

  return (
    <div style={{ background: 'white', borderRadius: '14px', overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
      {isLoading ? <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
      : movements.length === 0 ? <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>No hay movimientos registrados</div>
      : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              {['Fecha', 'Producto', 'Tipo', 'Cant.', 'Stock anterior', 'Stock nuevo', 'Motivo', 'Acciones'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {movements.map((m: any, i: number) => {
              const type = typeColors[m.type as keyof typeof typeColors] || typeColors.ajuste
              const product = products.find((p: any) => p.id === m.productId)
              return (
                <tr key={m.id} style={{ borderBottom: i < movements.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <td style={{ padding: '11px 16px', fontSize: '12px', color: '#64748b' }}>{new Date(m.createdAt).toLocaleString('es-AR')}</td>
                  <td style={{ padding: '11px 16px', fontSize: '13px', color: '#0f172a', fontWeight: 500, maxWidth: '200px' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product?.name || `#${m.productId}`}</div>
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: type.bg, color: type.color }}>{type.label}</span>
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: '14px', fontWeight: 700, color: m.type === 'entrada' ? '#16a34a' : '#dc2626' }}>
                    {m.type === 'entrada' ? '+' : m.type === 'salida' ? '-' : ''}{m.quantity}
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: '13px', color: '#64748b' }}>{m.previousStock}</td>
                  <td style={{ padding: '11px 16px', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{m.newStock}</td>
                  <td style={{ padding: '11px 16px', fontSize: '13px', color: '#64748b' }}>{m.reason || '—'}</td>
                  <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                    {m.saleId ? (
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Desde venta</span>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {onEdit && <button onClick={() => onEdit(m)} style={{ padding: '5px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>Editar</button>}
                        {onDelete && <button onClick={() => onDelete(m)} style={{ padding: '5px 9px', borderRadius: '6px', border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>Eliminar</button>}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
