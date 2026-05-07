import { api } from '../../lib/api'
import { generateInvoice, generateRemito } from '../../lib/pdf'

interface SalesHistoryListProps {
  sales: any[]
  client: any
}

export function SalesHistoryList({ sales, client }: SalesHistoryListProps) {
  if (sales.length === 0) return <p style={{ color: '#94a3b8', fontSize: '13px' }}>Sin compras registradas</p>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
      {sales.map((s: any) => (
        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', fontSize: '13px' }}>
          <div>
            <span style={{ fontFamily: 'monospace', color: '#94a3b8', marginRight: '8px' }}>{s.saleNumber || '#' + s.id}</span>
            <span style={{ color: '#374151' }}>{new Date(s.createdAt).toLocaleDateString('es-AR')}</span>
            {s.installmentCount > 0 && (
              <span style={{ marginLeft: '8px', fontSize: '11px', color: '#7c3aed', background: '#f5f3ff', padding: '1px 6px', borderRadius: '6px' }}>
                {s.paidCount}/{s.installmentCount} cuotas
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>${Number(s.total).toLocaleString('es-AR')}</span>
            <button onClick={async () => { const { data } = await api.get(`/sales/${s.id}`); generateRemito(data, client) }}
              style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 600, background: '#f5f3ff', color: '#7c3aed', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Remito
            </button>
            {s.invoiceType && s.invoiceType !== 'X' && (
              <button onClick={async () => { const { data } = await api.get(`/sales/${s.id}`); generateInvoice(data, client) }}
                style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 600, background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Factura {s.invoiceType}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
