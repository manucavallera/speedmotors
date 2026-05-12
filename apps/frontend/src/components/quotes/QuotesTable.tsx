import { useState } from 'react'
import { api } from '../../lib/api'
import { btnSecondary, inputStyle } from '../ui/FormField'

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  borrador:  { bg: '#f1f5f9', color: '#64748b', label: 'Borrador' },
  enviado:   { bg: '#eff6ff', color: '#2563eb', label: 'Enviado' },
  aceptado:  { bg: '#f0fdf4', color: '#16a34a', label: 'Aceptado' },
  rechazado: { bg: '#fef2f2', color: '#dc2626', label: 'Rechazado' },
  vencido:   { bg: '#fefce8', color: '#ca8a04', label: 'Vencido' },
}

interface QuotesTableProps {
  quotes: any[]
  clients: any[]
  isLoading: boolean
  onView: (detail: any) => void
  onEdit: (quote: any) => void
  onConvert: (quote: any) => void
  onDelete?: (id: number) => void
}

export function QuotesTable({ quotes, clients, isLoading, onView, onEdit, onConvert, onDelete }: QuotesTableProps) {
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const thStyle = { padding: '11px 16px', textAlign: 'left' as const, fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }

  const today = new Date()

  const filtered = quotes
    .filter(q => !statusFilter || q.status === statusFilter)
    .filter(q => {
      if (!search) return true
      const name = q.clientName || clients.find((c: any) => c.id === q.clientId)?.name || ''
      return name.toLowerCase().includes(search.toLowerCase())
    })

  const canEdit = (q: any) => q.status === 'borrador'
  const canConvert = (q: any) => !['rechazado', 'vencido'].includes(q.status)

  return (
    <div>
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '180px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Buscar cliente</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nombre..." style={{ ...inputStyle }} />
        </div>

        <div style={{ width: '1px', background: '#e2e8f0', alignSelf: 'stretch' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estado</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {([['', 'Todos'], ['borrador', 'Borrador'], ['enviado', 'Enviado'], ['aceptado', 'Aceptado'], ['rechazado', 'Rechazado']] as [string, string][]).map(([val, lbl]) => (
              <button key={val} onClick={() => setStatusFilter(val)}
                style={{ padding: '7px 14px', borderRadius: '9px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer', background: statusFilter === val ? '#1d4ed8' : '#f1f5f9', color: statusFilter === val ? 'white' : '#374151' }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

      </div>

      <div className="table-wrap" style={{ background: 'white', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>No hay presupuestos</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                {['#', 'Fecha', 'Cliente', 'Total', 'Estado', 'Vence', 'Acciones'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((q: any, i: number) => {
                const st = statusConfig[q.status] || statusConfig.borrador
                const clientName = q.clientName || clients.find((c: any) => c.id === q.clientId)?.name
                const isExpired = q.validUntil && new Date(q.validUntil) < today && !['aceptado', 'rechazado'].includes(q.status)
                return (
                  <tr key={q.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#94a3b8', fontFamily: 'monospace' }}>#{q.id}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{new Date(q.createdAt).toLocaleDateString('es-AR')}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13.5px', color: '#0f172a', fontWeight: 500 }}>
                      {clientName || <span style={{ color: '#94a3b8' }}>Sin cliente</span>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      ${Number(q.total).toLocaleString('es-AR')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: isExpired ? '#dc2626' : '#64748b', fontWeight: isExpired ? 600 : 400 }}>
                      {q.validUntil ? new Date(q.validUntil).toLocaleDateString('es-AR') : '—'}
                      {isExpired && <span style={{ display: 'block', fontSize: '11px' }}>Vencido</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button onClick={async () => { const { data } = await api.get(`/quotes/${q.id}`); onView(data) }}
                          style={{ ...btnSecondary, padding: '5px 12px', fontSize: '12px' }}>Ver</button>
                        {canEdit(q) && (
                          <button onClick={async () => { const { data } = await api.get(`/quotes/${q.id}`); onEdit(data) }}
                            style={{ ...btnSecondary, padding: '5px 12px', fontSize: '12px' }}>Editar</button>
                        )}
                        {canConvert(q) && (
                          <button onClick={() => onConvert(q)}
                            style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            Convertir a venta
                          </button>
                        )}
                        {onDelete && (
                          <button onClick={() => { if (confirm('¿Eliminar presupuesto?')) onDelete(q.id) }}
                            style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
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
    </div>
  )
}
