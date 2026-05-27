interface CashSessionsTableProps {
  sessions: any[]
  onDelete?: (id: number) => void
  deletePending?: boolean
}

export function CashSessionsTable({ sessions, onDelete, deletePending }: CashSessionsTableProps) {
  const thStyle = { padding: '10px 16px', textAlign: 'left' as const, fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }

  return (
    <div>
      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Historial de cajas</h3>
      <div style={{ background: 'white', borderRadius: '14px', overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              {['Apertura', 'Cierre', 'Saldo inicial', 'Esperado', 'Contado', 'Diferencia', 'Estado', ''].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.slice(0, 10).map((s: any, i: number) => {
              const diff = s.countedBalance !== null && s.expectedBalance !== null
                ? Number(s.countedBalance) - Number(s.expectedBalance) : null
              return (
                <tr key={s.id} style={{ borderBottom: i < sessions.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <td style={{ padding: '11px 16px', fontSize: '13px', color: '#374151' }}>{new Date(s.openedAt).toLocaleString('es-AR')}</td>
                  <td style={{ padding: '11px 16px', fontSize: '13px', color: '#374151' }}>{s.closedAt ? new Date(s.closedAt).toLocaleString('es-AR') : '—'}</td>
                  <td style={{ padding: '11px 16px', fontSize: '13px', fontWeight: 600 }}>${Number(s.openingBalance).toLocaleString('es-AR')}</td>
                  <td style={{ padding: '11px 16px', fontSize: '13px' }}>{s.expectedBalance ? `$${Number(s.expectedBalance).toLocaleString('es-AR')}` : '—'}</td>
                  <td style={{ padding: '11px 16px', fontSize: '13px' }}>{s.countedBalance ? `$${Number(s.countedBalance).toLocaleString('es-AR')}` : '—'}</td>
                  <td style={{ padding: '11px 16px', fontSize: '13px', fontWeight: 600, color: diff === null ? '#94a3b8' : diff >= 0 ? '#16a34a' : '#dc2626' }}>
                    {diff === null ? '—' : `${diff >= 0 ? '+' : ''}$${diff.toFixed(2)}`}
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: s.status === 'abierta' ? '#f0fdf4' : '#f1f5f9', color: s.status === 'abierta' ? '#16a34a' : '#64748b' }}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    {onDelete && s.status === 'cerrada' && (
                      <button
                        onClick={() => { if (confirm('¿Eliminar esta sesión de caja y todos sus movimientos?')) onDelete(s.id) }}
                        disabled={deletePending}
                        style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                        Eliminar
                      </button>
                    )}
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
