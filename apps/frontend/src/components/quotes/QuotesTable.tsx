import { api } from '../../lib/api'
import { btnSecondary } from '../ui/FormField'

const statusColors: Record<string, { bg: string; color: string }> = {
  borrador:  { bg: '#f1f5f9', color: '#64748b' },
  enviado:   { bg: '#eff6ff', color: '#2563eb' },
  aceptado:  { bg: '#f0fdf4', color: '#16a34a' },
  rechazado: { bg: '#fef2f2', color: '#dc2626' },
  vencido:   { bg: '#fefce8', color: '#ca8a04' },
}

interface QuotesTableProps {
  quotes: any[]
  clients: any[]
  isLoading: boolean
  onView: (detail: any) => void
  onEdit: (quote: any) => void
  onConvert: (quote: any) => void
  onDelete: (id: number) => void
}

export function QuotesTable({ quotes, clients, isLoading, onView, onEdit, onConvert, onDelete }: QuotesTableProps) {
  const thStyle = { padding: '11px 16px', textAlign: 'left' as const, fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }

  return (
    <div style={{ background: 'white', borderRadius: '14px', overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
      {isLoading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
      ) : quotes.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>No hay presupuestos</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              {['#', 'Fecha', 'Cliente', 'Total', 'Estado', 'Vence', ''].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quotes.map((q: any, i: number) => {
              const st = statusColors[q.status] || statusColors.borrador
              const client = clients.find((c: any) => c.id === q.clientId)
              return (
                <tr key={q.id} style={{ borderBottom: i < quotes.length - 1 ? '1px solid #f8fafc' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#94a3b8', fontFamily: 'monospace' }}>#{q.id}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{new Date(q.createdAt).toLocaleDateString('es-AR')}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13.5px', color: '#0f172a' }}>{client?.name || <span style={{ color: '#94a3b8' }}>Sin cliente</span>}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>${Number(q.total).toLocaleString('es-AR')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: st.bg, color: st.color }}>{q.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                    {q.validUntil ? new Date(q.validUntil).toLocaleDateString('es-AR') : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={async () => { const { data } = await api.get(`/quotes/${q.id}`); onView(data) }}
                        style={{ ...btnSecondary, padding: '5px 10px', fontSize: '12px' }}>Ver</button>
                      {q.status === 'borrador' && (
                        <button onClick={async () => { const { data } = await api.get(`/quotes/${q.id}`); onEdit(data) }}
                          style={{ ...btnSecondary, padding: '5px 10px', fontSize: '12px' }}>Editar</button>
                      )}
                      {q.status !== 'aceptado' && q.status !== 'rechazado' && (
                        <button onClick={() => onConvert(q)}
                          style={{ padding: '5px 10px', fontSize: '12px', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                          → Venta
                        </button>
                      )}
                      <button onClick={() => { if (confirm('¿Eliminar?')) onDelete(q.id) }}
                        style={{ padding: '5px 10px', fontSize: '12px', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>✕</button>
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
