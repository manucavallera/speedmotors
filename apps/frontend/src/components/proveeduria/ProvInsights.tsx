import { type ProvProduct, type ProvSale, type ProvTopItem } from '../../types/proveeduria.types'

interface Props {
  products: ProvProduct[]
  sales: ProvSale[]
  top: ProvTopItem[]
  onManage: () => void
}

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')
const hora = (iso: string) => new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

function Card({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ fontSize: '12.5px', fontWeight: 700, color: accent, padding: '11px 14px', borderBottom: '1px solid #f1f5f9' }}>{title}</div>
      <div>{children}</div>
    </div>
  )
}

const empty = <div style={{ padding: '14px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>Sin datos todavía</div>

export function ProvInsights({ products, sales, top, onManage }: Props) {
  const bajo = products.filter(p => p.stock <= p.minStock).sort((a, b) => a.stock - b.stock)
  const maxQty = Math.max(1, ...top.map(t => t.qty))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '20px' }}>
      <Card title="Más vendidos" accent="#1d4ed8">
        {top.length === 0 ? empty : top.map((t, i) => (
          <div key={i} style={{ padding: '8px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 600, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
              <span style={{ fontWeight: 700, color: '#1d4ed8' }}>{t.qty}</span>
            </div>
            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${(t.qty / maxQty) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#60a5fa,#1d4ed8)' }} />
            </div>
          </div>
        ))}
      </Card>

      <Card title={`Bajo stock (${bajo.length})`} accent="#dc2626">
        {bajo.length === 0 ? <div style={{ padding: '14px', fontSize: '12px', color: '#16a34a', textAlign: 'center' }}>✓ Todo con stock</div> : bajo.map(p => (
          <button key={p.id} onClick={onManage} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '9px 14px', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: p.stock === 0 ? '#dc2626' : '#d97706', whiteSpace: 'nowrap' }}>{p.stock} u.</span>
          </button>
        ))}
      </Card>

      <Card title="Últimas ventas" accent="#0f172a">
        {sales.length === 0 ? empty : sales.slice(0, 8).map(s => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid #f1f5f9', fontSize: '12.5px' }}>
            <span style={{ color: '#94a3b8' }}>#{s.id} · {hora(s.createdAt)}</span>
            <span style={{ fontWeight: 700, color: '#16a34a' }}>{fmt(Number(s.total))}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}
