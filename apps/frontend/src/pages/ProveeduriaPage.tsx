import { useState } from 'react'
import { useProveeduria } from '../hooks/useProveeduria'
import { ProductGrid } from '../components/proveeduria/ProductGrid'
import { Cart } from '../components/proveeduria/Cart'
import { ProductManageModal } from '../components/proveeduria/ProductManageModal'
import { inputStyle, btnSecondary } from '../components/ui/FormField'
import { toast } from '../lib/toast'
import { type ProvProduct, type CartItem } from '../types/proveeduria.types'

export function ProveeduriaPage() {
  const { products, productsQuery, search, setSearch, createProduct, updateProduct, removeProduct, checkout } = useProveeduria()
  const [cart, setCart] = useState<CartItem[]>([])
  const [manage, setManage] = useState(false)

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
        <button style={btnSecondary} onClick={() => setManage(true)}>Productos</button>
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
            : <ProductGrid products={products} onAdd={addToCart} />}
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
