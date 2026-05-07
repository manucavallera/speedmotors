import { btnPrimary } from '../ui/FormField'

interface InstallmentsSectionProps {
  title: string
  items: any[]
  color: string
  today: Date
  onPay: (id: number) => void
  isPending: boolean
}

export function InstallmentsSection({ title, items, color, today, onPay, isPending }: InstallmentsSectionProps) {
  if (items.length === 0) return null

  const thStyle = { padding: '10px 16px', textAlign: 'left' as const, fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{title}</h3>
        <span style={{ fontSize: '12px', fontWeight: 600, color, background: color + '20', padding: '2px 8px', borderRadius: '20px' }}>{items.length}</span>
      </div>
      <div style={{ background: 'white', borderRadius: '14px', overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              {['Venta', 'Cliente', 'Cuota', 'Vencimiento', 'Monto', 'Días', ''].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((inst: any, i: number) => {
              const due = new Date(inst.dueDate)
              const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              const isOverdue = diffDays < 0
              return (
                <tr key={inst.id} style={{ borderBottom: i < items.length - 1 ? '1px solid #f8fafc' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b', fontFamily: 'monospace' }}>#{inst.saleId}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13.5px', color: '#0f172a' }}>
                    {inst.clientName || <span style={{ color: '#94a3b8' }}>Sin cliente</span>}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13.5px', fontWeight: 500, color: '#0f172a' }}>Cuota {inst.number}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: isOverdue ? '#dc2626' : '#374151', fontWeight: isOverdue ? 600 : 400 }}>
                    {due.toLocaleDateString('es-AR')}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    ${Number(inst.amount).toLocaleString('es-AR')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 9px', borderRadius: '20px', background: isOverdue ? '#fef2f2' : '#fffbeb', color: isOverdue ? '#dc2626' : '#d97706' }}>
                      {isOverdue ? `${Math.abs(diffDays)}d vencida` : `en ${diffDays}d`}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => { if (confirm('¿Marcar como pagada?')) onPay(inst.id) }}
                      style={{ ...btnPrimary, padding: '5px 14px', fontSize: '12px' }} disabled={isPending}>
                      Cobrar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
