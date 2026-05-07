import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'

export interface StockMovementFormData {
  productId: number
  type: string
  quantity: number
  reason: string
}

interface StockMovementFormModalProps {
  products: any[]
  onClose: () => void
  onSubmit: (data: StockMovementFormData) => void
  isPending: boolean
}

export function StockMovementFormModal({ products, onClose, onSubmit, isPending }: StockMovementFormModalProps) {
  const [form, setForm] = useState({ productId: '', type: 'entrada', quantity: '', reason: '' })
  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  return (
    <Modal title="Registrar movimiento de stock" onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, productId: Number(form.productId), quantity: Number(form.quantity) }) }}
        style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <FormField label="Producto">
          <select style={inputStyle} value={form.productId} onChange={f('productId')} required>
            <option value="">Seleccioná un producto</option>
            {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>)}
          </select>
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <FormField label="Tipo">
            <select style={inputStyle} value={form.type} onChange={f('type')}>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
              <option value="ajuste">Ajuste (setear stock)</option>
            </select>
          </FormField>
          <FormField label={form.type === 'ajuste' ? 'Nuevo stock' : 'Cantidad'}>
            <input style={inputStyle} type="number" min="0" value={form.quantity} onChange={f('quantity')} required />
          </FormField>
        </div>
        <FormField label="Motivo">
          <input style={inputStyle} value={form.reason} onChange={f('reason')} placeholder="Ej: compra a proveedor, devolución..." />
        </FormField>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button type="submit" style={btnPrimary} disabled={isPending}>{isPending ? 'Guardando...' : 'Registrar'}</button>
        </div>
      </form>
    </Modal>
  )
}
