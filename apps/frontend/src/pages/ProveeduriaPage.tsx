import { useState } from 'react'
import { useProveeduria } from '../hooks/useProveeduria'
import { ProductGrid } from '../components/proveeduria/ProductGrid'
import { Cart } from '../components/proveeduria/Cart'
import { ProductManageModal } from '../components/proveeduria/ProductManageModal'
import { ProvInsights } from '../components/proveeduria/ProvInsights'
import { HelpModal, HelpButton } from '../components/ui/HelpModal'
import { PROVEEDURIA_HELP } from '../lib/helpContent'
import { inputStyle, btnSecondary } from '../components/ui/FormField'
import { toast } from '../lib/toast'
import { type ProvProduct, type CartItem } from '../types/proveeduria.types'

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

function Stat({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', minWidth: 0 }}>
      <div style={{ fontSize: '22px', fontWeight: 700, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>{label}</div>
    </div>
  )
}

export function ProveeduriaPage() {
  const { products, productsQuery, stats, sales, search, setSearch, createProduct, updateProduct, removeProduct, checkout } = useProveeduria()
  const [cart, setCart] = useState<CartItem[]>([])
  const [manage, setManage] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const bajoStock = products.filter(p => p.stock <= p.minStock).length
  const valorInventario = products.reduce((a, p) => a + p.stock * Number(p.sellPrice), 0)

  function addToCart(p: ProvProduct) {
    setCart(prev => {
      const ex = prev.find(i => i.productId === p.id)
      if (ex) {
        if (ex.quantity >= p.stock) { toast.error('No hay más stock'); return prev }
        return prev.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { productId: p.id, name: p.name, price: Number(p.sellPrice), quantity: 1, stock: p.stock }]
    })
  }
  function inc(id: number) {
    setCart(prev => prev.map(i => {
      if (i.productId !== id) return i
      if (i.quantity >= i.stock) { toast.error('No hay más stock'); return i }
      return { ...i, quantity: i.quantity + 1 }
    }))
  }
  function dec(id: number) {
    setCart(prev => prev.flatMap(i => i.productId !== id ? [i] : i.quantity <= 1 ? [] : [{ ...i, quantity: i.quantity - 1 }]))
  }
  function removeItem(id: number) { setCart(prev => prev.filter(i => i.productId !== id)) }

  function doCheckout() {
    checkout.mutate(cart, { onSuccess: () => setCart([]) })
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Proveeduría</h1>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>Venta rápida</div>
        </div>
        <HelpButton onClick={() => setShowHelp(true)} />
        <button style={btnSecondary} onClick={() => setManage(true)}>Productos</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        <Stat value={stats.ventasHoy} label="Ventas hoy" color="#1d4ed8" />
        <Stat value={fmt(stats.totalHoy)} label="$ vendido hoy" color="#16a34a" />
        <Stat value={fmt(Math.round(stats.ticketProm))} label="Ticket promedio" color="#0f172a" />
        <Stat value={products.length} label="Productos" color="#2563eb" />
        <Stat value={bajoStock} label="Bajo stock" color={bajoStock > 0 ? '#dc2626' : '#16a34a'} />
        <Stat value={fmt(valorInventario)} label="Valor inventario" color="#0f172a" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '20px', alignItems: 'start' }} className="proveeduria-layout">
        <div>
          <input
            style={{ ...inputStyle, marginBottom: '14px' }}
            placeholder="Buscar producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          {productsQuery.isLoading
            ? <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
            : <ProductGrid products={products} onAdd={addToCart} onManage={() => setManage(true)} />}
        </div>
        <Cart
          items={cart}
          onInc={inc}
          onDec={dec}
          onRemove={removeItem}
          onCheckout={doCheckout}
          submitting={checkout.isPending}
        />
      </div>

      <ProvInsights products={products} sales={sales} top={stats.top} onManage={() => setManage(true)} />

      {showHelp && <HelpModal title="Cómo funciona la Proveeduría" sections={PROVEEDURIA_HELP} onClose={() => setShowHelp(false)} />}

      {manage && (
        <ProductManageModal
          products={products}
          submitting={createProduct.isPending || updateProduct.isPending}
          onClose={() => setManage(false)}
          onCreate={(data) => createProduct.mutate(data)}
          onUpdate={(id, data) => updateProduct.mutate({ id, data })}
          onRemove={(id) => removeProduct.mutate(id)}
        />
      )}
    </div>
  )
}
