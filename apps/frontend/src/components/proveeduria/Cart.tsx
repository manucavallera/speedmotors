import { type CartItem } from '../../types/proveeduria.types'

interface Props {
  items: CartItem[]
  onInc: (productId: number) => void
  onDec: (productId: number) => void
  onRemove: (productId: number) => void
  onCheckout: () => void
  submitting: boolean
}

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

export function Cart({ items, onInc, onDec, onRemove, onCheckout, submitting }: Props) {
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const qtyBtn: React.CSSProperties = {
    width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #e2e8f0',
    background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: '#475569', lineHeight: 1,
  }

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Venta</h3>

      {!items.length ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>
          Tocá productos para agregarlos
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map(i => (
            <div key={i.productId} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.name}</div>
                <div style={{ color: '#94a3b8', fontSize: '11.5px' }}>{fmt(i.price)} c/u</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button style={qtyBtn} onClick={() => onDec(i.productId)}>−</button>
                <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 600 }}>{i.quantity}</span>
                <button style={qtyBtn} onClick={() => onInc(i.productId)}>+</button>
              </div>
              <div style={{ minWidth: '70px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{fmt(i.price * i.quantity)}</div>
              <button onClick={() => onRemove(i.productId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: '16px' }}>×</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '12px', paddingTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '14px', color: '#64748b' }}>Total</span>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>{fmt(total)}</span>
        </div>
        <button
          disabled={!items.length || submitting}
          onClick={onCheckout}
          style={{
            width: '100%', padding: '12px', fontSize: '15px', fontWeight: 700, color: 'white',
            border: 'none', borderRadius: '10px', cursor: items.length ? 'pointer' : 'not-allowed',
            background: items.length ? 'linear-gradient(135deg,#16a34a,#15803d)' : '#cbd5e1',
          }}
        >
          Cobrar {fmt(total)}
        </button>
      </div>
    </div>
  )
}
