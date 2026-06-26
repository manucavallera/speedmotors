import { type ProvProduct } from '../../types/proveeduria.types'

interface Props {
  products: ProvProduct[]
  onAdd: (p: ProvProduct) => void
}

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

export function ProductGrid({ products, onAdd }: Props) {
  if (!products.length) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', border: '1.5px dashed #e2e8f0', borderRadius: '12px' }}>
        No hay productos. Tocá "Productos" para cargar comida, bebidas, etc.
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
