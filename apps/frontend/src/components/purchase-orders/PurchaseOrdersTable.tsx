import { btnSecondary } from '../ui/FormField'
import { api } from '../../lib/api'

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  borrador:  { bg: '#f8fafc', color: '#64748b', label: 'Borrador' },
  enviada:   { bg: '#fffbeb', color: '#d97706', label: 'Enviada' },
  recibida:  { bg: '#f0fdf4', color: '#16a34a', label: 'Recibida' },
  cancelada: { bg: '#fef2f2', color: '#dc2626', label: 'Cancelada' },
}

interface PurchaseOrdersTableProps {
  orders: any[]
  isLoading: boolean
  onView: (detail: any) => void
  onEdit: (order: any) => void
  onDelete?: (id: number) => void
}

export function PurchaseOrdersTable({ orders, isLoading, onView, onEdit, onDelete }: PurchaseOrdersTableProps) {
  const thStyle = { padding: '11px 16px', textAlign: 'left' as const, fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }

  return (
    <div style={{ background: 'white', borderRadius: '14px', overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
      {isLoading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
      ) : orders.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>No hay órdenes de compra</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              {['#', 'Proveedor', 'Fecha', 'Fecha esperada', 'Estado', 'Total', ''].map((h, i) => (
                <th key={i} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o: any, i: number) => {
              const st = statusColors[o.status] || statusColors.borrador
              return (
                <tr key={o.id} style={{ borderBottom: i < orders.length - 1 ? '1px solid #f8fafc' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#94a3b8', fontSize: '13px' }}>#{o.id}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{o.supplierName || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>{new Date(o.createdAt).toLocaleDateString('es-AR')}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>
                    {o.expectedDate ? new Date(o.expectedDate).toLocaleDateString('es-AR') : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: st.bg, color: st.color }}>{st.label}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>${Number(o.total).toLocaleString('es-AR')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={async () => { const { data } = await api.get(`/purchase-orders/${o.id}`); onView(data) }}
                        style={{ ...btnSecondary, padding: '5px 10px', fontSize: '12px' }}>Ver</button>
                      {o.status === 'borrador' && (
                        <button onClick={async () => { const { data } = await api.get(`/purchase-orders/${o.id}`); onEdit(data) }}
                          style={{ ...btnSecondary, padding: '5px 10px', fontSize: '12px' }}>Editar</button>
                      )}
                      {o.status === 'borrador' && onDelete && (
                        <button onClick={() => { if (confirm('¿Eliminar orden?')) onDelete(o.id) }}
                          style={{ padding: '5px 10px', fontSize: '12px', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                          Eliminar
                        </button>
                      )}
                    </div>
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
