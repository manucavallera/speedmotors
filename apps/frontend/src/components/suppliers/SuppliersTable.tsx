import { btnSecondary } from '../ui/FormField'

interface SuppliersTableProps {
  suppliers: any[]
  isLoading: boolean
  onEdit: (s: any) => void
  onDelete: (id: number) => void
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export function SuppliersTable({ suppliers, isLoading, onEdit, onDelete }: SuppliersTableProps) {
  const thStyle = { padding: '11px 16px', textAlign: 'left' as const, fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }

  return (
    <div style={{ background: 'white', borderRadius: '14px', overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
      {isLoading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
      ) : suppliers.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>No hay proveedores registrados</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              {['Proveedor', 'Teléfono', 'Email', ''].map((h, i) => <th key={i} style={thStyle}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s: any, i: number) => (
              <tr key={s.id} style={{ borderBottom: i < suppliers.length - 1 ? '1px solid #f8fafc' : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 700 }}>
                      {initials(s.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{s.name}</div>
                      {s.notes && <div style={{ fontSize: '12px', color: '#94a3b8' }}>{s.notes}</div>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13.5px', color: '#374151' }}>{s.phone || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{s.email || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => onEdit(s)} style={{ ...btnSecondary, padding: '5px 12px', fontSize: '12px' }}>Editar</button>
                    <button onClick={() => { if (confirm('¿Eliminar proveedor?')) onDelete(s.id) }}
                      style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
