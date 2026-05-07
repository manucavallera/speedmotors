import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'

interface OrderItem { description: string; productId: string; quantity: string; unitPrice: string }

const emptyItem = (): OrderItem => ({ description: '', productId: '', quantity: '1', unitPrice: '0' })

export interface PurchaseOrderFormData {
  supplierId: number | null
  notes: string
  expectedDate: string | null
  amountFormal: number
  amountInformal: number
  items: { productId: number | null; description: string; quantity: number; unitPrice: number }[]
}

interface PurchaseOrderFormModalProps {
  mode: 'new' | 'edit'
  editing: any | null
  suppliers: any[]
  products: any[]
  onClose: () => void
  onSubmit: (data: PurchaseOrderFormData) => void
  isPending: boolean
}

function orderToItems(order: any): OrderItem[] {
  return order.items?.map((it: any) => ({
    description: it.description,
    productId: it.productId ? String(it.productId) : '',
    quantity: String(it.quantity),
    unitPrice: String(it.unitPrice),
  })) || [emptyItem()]
}

export function PurchaseOrderFormModal({ mode, editing, suppliers, products, onClose, onSubmit, isPending }: PurchaseOrderFormModalProps) {
  const [supplierId, setSupplierId] = useState(editing?.supplierId ? String(editing.supplierId) : '')
  const [notes, setNotes] = useState(editing?.notes || '')
  const [expectedDate, setExpectedDate] = useState(editing?.expectedDate ? editing.expectedDate.slice(0, 10) : '')
  const [items, setItems] = useState<OrderItem[]>(editing ? orderToItems(editing) : [emptyItem()])
  const [amountFormal, setAmountFormal] = useState(editing?.amountFormal ? String(Number(editing.amountFormal)) : '0')
  const [amountInformal, setAmountInformal] = useState(editing?.amountInformal ? String(Number(editing.amountInformal)) : '0')

  const total = items.reduce((s, it) => s + Number(it.quantity) * Number(it.unitPrice), 0)

  function updateItem(i: number, key: keyof OrderItem, val: string) {
    setItems(prev => {
      const next = [...prev]
      next[i] = { ...next[i], [key]: val }
      if (key === 'productId' && val) {
        const prod = products.find((p: any) => String(p.id) === val)
        if (prod) next[i].description = prod.name
      }
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      supplierId: supplierId ? Number(supplierId) : null,
      notes,
      expectedDate: expectedDate || null,
      amountFormal: Number(amountFormal),
      amountInformal: Number(amountInformal),
      items: items.filter(it => it.description).map(it => ({
        productId: it.productId ? Number(it.productId) : null,
        description: it.description,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
      })),
    })
  }

  return (
    <Modal title={mode === 'edit' ? 'Editar orden de compra' : 'Nueva orden de compra'} onClose={onClose} width={600}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="form-grid-2">
          <FormField label="Proveedor">
            <select style={inputStyle} value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              <option value="">Sin proveedor asignado</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>
          <FormField label="Fecha esperada de entrega">
            <input style={inputStyle} type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} />
          </FormField>
        </div>

        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Productos a pedir</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 110px 36px', gap: '8px', alignItems: 'center' }}>
                <div>
                  <select style={{ ...inputStyle, marginBottom: '4px' }} value={item.productId}
                    onChange={e => updateItem(i, 'productId', e.target.value)}>
                    <option value="">Descripción libre</option>
                    {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  {!item.productId && (
                    <input placeholder="Descripción del ítem" style={inputStyle} value={item.description}
                      onChange={e => updateItem(i, 'description', e.target.value)} required />
                  )}
                </div>
                <input placeholder="Cant." type="number" min="1" style={inputStyle} value={item.quantity}
                  onChange={e => updateItem(i, 'quantity', e.target.value)} />
                <input placeholder="Precio unit." type="number" style={inputStyle} value={item.unitPrice}
                  onChange={e => updateItem(i, 'unitPrice', e.target.value)} />
                <button type="button" onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}
                  style={{ padding: '8px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>×</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setItems(prev => [...prev, emptyItem()])}
            style={{ ...btnSecondary, marginTop: '8px', fontSize: '12px', padding: '6px 14px' }}>
            + Agregar ítem
          </button>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
          <span>Total estimado</span>
          <span>${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
        </div>

        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Distribución blanco / negro</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <FormField label="En blanco ($)">
              <input type="number" min="0" step="0.01" style={{ ...inputStyle, borderColor: '#86efac' }}
                value={amountFormal} onChange={e => setAmountFormal(e.target.value)} />
            </FormField>
            <FormField label="En negro ($)">
              <input type="number" min="0" step="0.01" style={{ ...inputStyle, borderColor: '#fca5a5' }}
                value={amountInformal} onChange={e => setAmountInformal(e.target.value)} />
            </FormField>
          </div>
        </div>

        <FormField label="Notas">
          <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} value={notes} onChange={e => setNotes(e.target.value)} />
        </FormField>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button type="submit" style={btnPrimary} disabled={isPending}>
            {isPending ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Crear orden'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
