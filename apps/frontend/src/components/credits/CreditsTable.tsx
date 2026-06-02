import type { Credit } from '../../hooks/useCredits'

interface Props {
  credits: Credit[]
  isLoading: boolean
  onView: (id: number) => void
}

const statusStyles: Record<string, { bg: string; color: string }> = {
  activo: { bg: '#eff6ff', color: '#2563eb' },
  pagado: { bg: '#f0fdf4', color: '#16a34a' },
  cancelado: { bg: '#fef2f2', color: '#dc2626' },
}

// Etiqueta de qué deuda es: financiación (cuotas) vs cuenta corriente / saldo variable (según tenga interés)
function tipoLabel(c: Credit): string {
  if (c.creditType === 'cuotas_simples') return `Financiación · ${c.installmentsCount ?? '?'} cuotas`
  return Number(c.interestRate) > 0 ? 'Saldo variable' : 'Cuenta corriente'
}

export function CreditsTable({ credits, isLoading, onView }: Props) {
  const thStyle: React.CSSProperties = { padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }

  if (isLoading) return <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
  if (!credits.length) return <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No hay créditos registrados</div>

  return (
    <div style={{ background: 'white', borderRadius: '14px', overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            {['Cliente', 'Tipo', 'Inicio', 'Moneda', 'Monto original', 'Saldo actual', 'Tasa', 'Estado', ''].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {credits.map((c, i) => {
            const sym = c.currency === 'usd' ? 'US$' : '$'
            const stStyle = statusStyles[c.status]
            return (
              <tr key={c.id} style={{ borderBottom: i < credits.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <td style={{ padding: '11px 16px', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{c.client?.name || '—'}</td>
                <td style={{ padding: '11px 16px', fontSize: '13px', color: '#374151' }}>{tipoLabel(c)}</td>
                <td style={{ padding: '11px 16px', fontSize: '13px', color: '#374151' }}>{new Date(c.startDate).toLocaleDateString('es-AR')}</td>
                <td style={{ padding: '11px 16px', fontSize: '13px', color: '#374151', textTransform: 'uppercase' }}>{c.currency}</td>
                <td style={{ padding: '11px 16px', fontSize: '13px' }}>{sym}{Number(c.originalAmount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '11px 16px', fontSize: '13px', fontWeight: 700, color: c.balance > 0 ? '#dc2626' : '#16a34a' }}>{sym}{c.balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '11px 16px', fontSize: '13px' }}>{c.interestRate}%</td>
                <td style={{ padding: '11px 16px' }}>
                  <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: stStyle.bg, color: stStyle.color }}>{c.status}</span>
                </td>
                <td style={{ padding: '11px 16px' }}>
                  <button onClick={() => onView(c.id)} style={{ padding: '5px 10px', fontSize: '12px', fontWeight: 600, background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Ver</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
