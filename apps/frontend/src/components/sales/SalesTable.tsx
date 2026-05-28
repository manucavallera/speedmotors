// @file: SalesTable.tsx | Tabla de ventas filtradas. Props: filtered[], clients[], isLoading, onView(id).
import { api } from '../../lib/api'
import { btnSecondary } from '../ui/FormField'

const statusColors: Record<string, { bg: string; color: string }> = {
  completado: { bg: '#f0fdf4', color: '#16a34a' },
  pendiente:  { bg: '#fffbeb', color: '#d97706' },
  cancelado:  { bg: '#fef2f2', color: '#dc2626' },
}

const invoiceColors: Record<string, { bg: string; color: string; label: string }> = {
  A:     { bg: '#eff6ff', color: '#2563eb', label: '🧾 Fctura A' },
  B:     { bg: '#f5f3ff', color: '#7c3aed', label: '🧾 Fctura B' },
  X:     { bg: '#fef9c3', color: '#854d0e', label: '🤝 En negro' },
  mixto: { bg: '#fff7ed', color: '#c2410c', label: '🔀 Mixto' },
}

interface SalesTableProps {
  filtered: any[]
  clients: any[]
  isLoading: boolean
  onView: (sale: any) => void
}

export function SalesTable({ filtered, clients, isLoading, onView }: SalesTableProps) {
  if (isLoading) return <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
  if (filtered.length === 0) return <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Sin resultados</div>

  return (
    <div className="table-wrap">
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          {['#', 'Fecha', 'Cliente', 'Fctura', 'Tipo', 'Total', 'Estado', ''].map(h => (
            <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filtered.map((s: any, i: number) => {
          const st = statusColors[s.status] || statusColors.completado
          const invStyle = invoiceColors[s.invoiceType || 'X'] || invoiceColors.X
          const clientName = clients.find((c: any) => c.id === s.clientId)?.name
          return (
            <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <td style={{ padding: '12px 16px', fontSize: '13px', color: '#94a3b8', fontFamily: 'monospace' }}>{s.saleNumber || `#${s.id}`}</td>
              <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{new Date(s.createdAt).toLocaleDateString('es-AR')}</td>
              <td style={{ padding: '12px 16px', fontSize: '13.5px', color: '#0f172a' }}>
                {clientName || <span style={{ color: '#94a3b8' }}>Sin cliente</span>}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, background: invStyle.bg, color: invStyle.color }}>
                  {invStyle.label}
                </span>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: s.type === 'cuotas' ? '#7c3aed' : s.type === 'cuenta_corriente' ? '#d97706' : '#0284c7', background: s.type === 'cuotas' ? '#f5f3ff' : s.type === 'cuenta_corriente' ? '#fffbeb' : '#e0f2fe', padding: '2px 9px', borderRadius: '20px' }}>
                  {s.type === 'cuotas' ? 'Financiado' : s.type === 'cuenta_corriente' ? 'Cta. corriente' : 'Contado'}
                </span>
              </td>
              <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 700, color: s.status === 'cancelado' ? '#94a3b8' : '#0f172a', textDecoration: s.status === 'cancelado' ? 'line-through' : 'none' }}>
                ${Number(s.total).toLocaleString('es-AR')}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: st.bg, color: st.color }}>{s.status}</span>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <button onClick={async () => { const { data } = await api.get(`/sales/${s.id}`); onView(data) }}
                  style={{ ...btnSecondary, padding: '5px 10px', fontSize: '12px' }}>Ver</button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
    </div>
  )
}
