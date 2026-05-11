import { useState } from 'react'
import { inputStyle, btnSecondary } from '../ui/FormField'

const catColors: Record<string, { bg: string; color: string }> = {
  alquiler:  { bg: '#eff6ff', color: '#2563eb' },
  servicios: { bg: '#f0fdf4', color: '#16a34a' },
  compras:   { bg: '#fdf4ff', color: '#9333ea' },
  sueldos:   { bg: '#fff7ed', color: '#ea580c' },
  impuestos: { bg: '#fef2f2', color: '#dc2626' },
  otros:     { bg: '#f1f5f9', color: '#64748b' },
}

interface ExpensesTableProps {
  expenses: any[]
  summary: any[]
  isLoading: boolean
  onEdit: (e: any) => void
  onDelete?: (id: number) => void
}

export function ExpensesTable({ expenses, summary, isLoading, onEdit, onDelete }: ExpensesTableProps) {
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filtered = expenses.filter(e => {
    const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase()) || e.category.includes(search.toLowerCase())
    const d = new Date(e.date)
    const matchFrom = !dateFrom || d >= new Date(dateFrom)
    const matchTo = !dateTo || d <= new Date(dateTo + 'T23:59:59')
    return matchSearch && matchFrom && matchTo
  })
  const total = filtered.reduce((s, e) => s + Number(e.amount), 0)

  const thStyle = { padding: '11px 16px', textAlign: 'left' as const, fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar descripción o categoría..."
          style={{ ...inputStyle, maxWidth: '260px' }} />
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...inputStyle, width: '150px' }} />
        <span style={{ color: '#94a3b8', fontSize: '13px' }}>→</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...inputStyle, width: '150px' }} />
        {(search || dateFrom || dateTo) && (
          <button onClick={() => { setSearch(''); setDateFrom(''); setDateTo('') }} style={{ ...btnSecondary, fontSize: '12px', padding: '6px 12px' }}>Limpiar</button>
        )}
        <span style={{ fontSize: '13px', color: '#64748b', marginLeft: 'auto' }}>Total: <strong>${total.toLocaleString('es-AR')}</strong></span>
      </div>

      {summary.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {summary.map((s: any) => {
            const c = catColors[s.category] || catColors.otros
            return (
              <div key={s.category} style={{ background: 'white', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: c.bg, color: c.color }}>{s.category}</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '8px' }}>${Number(s.total).toLocaleString('es-AR')}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{s.count} registro{s.count !== '1' ? 's' : ''}</div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '14px', overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
        {isLoading ? <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
        : filtered.length === 0 ? <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>{expenses.length === 0 ? 'No hay gastos registrados' : 'Sin resultados'}</div>
        : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                {['Fecha', 'Descripción', 'Categoría', 'Monto', ''].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e: any, i: number) => {
                const c = catColors[e.category] || catColors.otros
                return (
                  <tr key={e.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none' }}
                    onMouseEnter={ev => (ev.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '11px 16px', fontSize: '13px', color: '#64748b' }}>{new Date(e.date).toLocaleDateString('es-AR')}</td>
                    <td style={{ padding: '11px 16px', fontSize: '13.5px', color: '#0f172a', fontWeight: 500 }}>
                      {e.description}
                      {e.notes && <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400 }}>{e.notes}</div>}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: c.bg, color: c.color }}>{e.category}</span>
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: '14px', fontWeight: 700, color: '#dc2626' }}>${Number(e.amount).toLocaleString('es-AR')}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => onEdit(e)} style={{ ...btnSecondary, padding: '5px 10px', fontSize: '12px' }}>Editar</button>
                        {onDelete && <button onClick={() => { if (confirm('¿Eliminar gasto?')) onDelete(e.id) }}
                          style={{ padding: '5px 10px', fontSize: '12px', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                          Eliminar
                        </button>}
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
