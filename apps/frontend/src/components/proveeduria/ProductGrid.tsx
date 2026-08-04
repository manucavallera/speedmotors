import { type ProvProduct } from '../../types/proveeduria.types'

interface Props {
  products: ProvProduct[]
  onAdd: (p: ProvProduct) => void
  onManage?: () => void
}

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

export function ProductGrid({ products, onAdd, onManage }: Props) {
  if (!products.length) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', border: '1.5px dashed #bfdbfe', background: '#f8fbff', borderRadius: '12px' }}>
        <div style={{ color: '#334155', fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>Todavía no hay productos</div>
        <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>Cargá el primer producto para empezar a vender en la proveeduría.</div>
        {onManage && (
          <button onClick={onManage} style={{ padding: '9px 15px', border: 'none', borderRadius: '9px', background: '#2563eb', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            Cargar primer producto
          </button>
        )}
      </div>
    )
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
      {products.map(p => {
        const out = p.stock <= 0
        return (
          <button
            key={p.id}
            disabled={out}
            onClick={() => onAdd(p)}
            style={{
              textAlign: 'left', cursor: out ? 'not-allowed' : 'pointer', opacity: out ? 0.5 : 1,
              background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '11px',
              padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '90px',
            }}
            onMouseEnter={e => { if (!out) e.currentTarget.style.borderColor = '#3b82f6' }}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
          >
            <span style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a', lineHeight: 1.25 }}>{p.name}</span>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#16a34a' }}>{fmt(Number(p.sellPrice))}</span>
            <span style={{ fontSize: '11px', color: out ? '#dc2626' : '#94a3b8' }}>{out ? 'Sin stock' : `Stock: ${p.stock}`}</span>
          </button>
        )
      })}
    </div>
  )
}
