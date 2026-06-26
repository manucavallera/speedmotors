import { useState } from 'react'
import { toast } from '../../lib/toast'
import { Modal } from '../ui/Modal'
import { inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import { type ProvProduct, type ProvProductForm } from '../../types/proveeduria.types'

interface Props {
  products: ProvProduct[]
  onClose: () => void
  onCreate: (data: ProvProductForm) => void
  onUpdate: (id: number, data: ProvProductForm) => void
  onRemove: (id: number) => void
  submitting: boolean
}

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')
const empty = { name: '', sellPrice: '', stock: '', barcode: '' }

export function ProductManageModal({ products, onClose, onCreate, onUpdate, onRemove, submitting }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [f, setF] = useState(empty)

  function startEdit(p: ProvProduct) {
    setEditingId(p.id)
    setF({ name: p.name, sellPrice: p.sellPrice, stock: String(p.stock), barcode: p.barcode ?? '' })
  }
  function reset() { setEditingId(null); setF(empty) }

  function submit() {
    if (!f.name.trim()) { toast.error('Nombre requerido'); return }
    const data: ProvProductForm = {
      name: f.name.trim(),
      sellPrice: Number(f.sellPrice) || 0,
      stock: f.stock ? Number(f.stock) : 0,
      barcode: f.barcode.trim() || undefined,
    }
    if (editingId) onUpdate(editingId, data)
    else onCreate(data)
    reset()
  }

  return (
    <Modal title="Productos de proveeduría" onClose={onClose} width={560}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px auto', gap: '8px', alignItems: 'end', marginBottom: '14px' }}>
        <input style={inputStyle} placeholder="Nombre" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <input style={inputStyle} type="number" placeholder="Precio" value={f.sellPrice} onChange={e => setF({ ...f, sellPrice: e.target.value })} />
        <input style={inputStyle} type="number" placeholder="Stock" value={f.stock} onChange={e => setF({ ...f, stock: e.target.value })} />
        <button style={btnPrimary} disabled={submitting} onClick={submit}>{editingId ? 'Guardar' : '+ Agregar'}</button>
      </div>
      {editingId && <button style={{ ...btnSecondary, marginBottom: '12px' }} onClick={reset}>Cancelar edición</button>}

      <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
        {!products.length && <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Sin productos todavía</div>}
        {products.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
              <div style={{ color: '#94a3b8', fontSize: '11.5px' }}>{fmt(Number(p.sellPrice))} · stock {p.stock}</div>
            </div>
            <button onClick={() => startEdit(p)} style={{ ...btnSecondary, padding: '5px 10px', fontSize: '12px' }}>Editar</button>
            <button onClick={() => { if (window.confirm(`¿Eliminar ${p.name}?`)) onRemove(p.id) }} style={{ padding: '5px 10px', fontSize: '12px', fontWeight: 600, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer' }}>Eliminar</button>
          </div>
        ))}
      </div>
    </Modal>
  )
}
