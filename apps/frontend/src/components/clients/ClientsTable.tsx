// @file: ClientsTable.tsx | Tabla de clientes con avatar de iniciales y badge condición IVA.
import { btnSecondary } from '../ui/FormField'
import { condicionIvaLabel, condicionIvaColors, clientInitials } from '../../types/clients.types'

interface ClientsTableProps {
  clients: any[]
  isLoading: boolean
  onEdit: (c: any) => void
  onDelete: (id: number) => void
  onAccount: (c: any) => void
}

export function ClientsTable({ clients, isLoading, onEdit, onDelete, onAccount }: ClientsTableProps) {
  const thStyle = { padding: '11px 16px', textAlign: 'left' as const, fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }

  return (
    <div style={{ background: 'white', borderRadius: '14px', overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
      {isLoading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
      ) : clients.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>No hay clientes registrados</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              {['Cliente', 'Teléfono', 'CUIT / DNI', 'Condición IVA', ''].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((c: any, i: number) => {
              const iva = c.condicionIva || 'consumidor_final'
              const ivaStyle = condicionIvaColors[iva] || condicionIvaColors.consumidor_final
              return (
                <tr key={c.id} style={{ borderBottom: i < clients.length - 1 ? '1px solid #f8fafc' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 700 }}>
                        {clientInitials(c.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{c.name}</div>
                        {c.address && <div style={{ fontSize: '12px', color: '#94a3b8' }}>{c.address}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13.5px', color: '#374151' }}>{c.phone || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b', fontFamily: 'monospace' }}>
                    {c.cuit ? (
                      <div><div style={{ fontSize: '12px', color: '#94a3b8' }}>CUIT</div><div>{c.cuit}</div></div>
                    ) : c.dni ? (
                      <div><div style={{ fontSize: '12px', color: '#94a3b8' }}>DNI</div><div>{c.dni}</div></div>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: ivaStyle.bg, color: ivaStyle.color }}>
                      {condicionIvaLabel[iva] || iva}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => onAccount(c)} style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cuenta</button>
                      <button onClick={() => onEdit(c)} style={{ ...btnSecondary, padding: '5px 12px', fontSize: '12px' }}>Editar</button>
                      <button onClick={() => { if (confirm('¿Eliminar cliente?')) onDelete(c.id) }}
                        style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        Eliminar
                      </button>
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
