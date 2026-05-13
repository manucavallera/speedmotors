import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import { SearchableSelect } from '../ui/SearchableSelect'

interface Item { description: string; quantity: number; unitPrice: number }

export interface QuoteFormData {
  clientId?: number
  discount: number
  notes: string
  items: { description: string; quantity: number; unitPrice: number }[]
}

interface QuoteFormModalProps {
  mode: 'new' | 'edit'
  editing: any | null
  clients: any[]
  onClose: () => void
  onSubmit: (data: QuoteFormData) => void
  isPending: boolean
}

const emptyItem = (): Item => ({ description: '', quantity: 1, unitPrice: 0 })

function quoteToItems(q: any): Item[] {
  return q.items?.map((i: any) => ({ description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })) || [emptyItem()]
}

export function QuoteFormModal({ mode, editing, clients, onClose, onSubmit, isPending }: QuoteFormModalProps) {
  const [items, setItems] = useState<Item[]>(editing ? quoteToItems(editing) : [emptyItem()])
  const [clientId, setClientId] = useState(editing?.clientId ? String(editing.clientId) : '')
  const [discount, setDiscount] = useState(String(editing?.discount || '0'))
  const [notes, setNotes] = useState(editing?.notes || '')

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const total = subtotal - (parseFloat(discount) || 0)

  function updateItem(i: number, k: string, v: any) {
    setItems(p => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      clientId: clientId ? Number(clientId) : undefined,
      discount: parseFloat(discount) || 0,
      notes,
      items: items.map(i => ({ ...i, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
    })
  }

  return (
    <Modal title={mode === 'edit' ? 'Editar presupuesto' : 'Nuevo presupuesto'} onClose={onClose} width={600}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <FormField label="Cliente (opcional)">
          <SearchableSelect
            value={clientId}
            onChange={setClientId}
            options={clients.map((c: any) => ({ value: String(c.id), label: c.name }))}
            placeholder="Buscar cliente..."
            emptyLabel="Sin cliente"
          />
        </FormField>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Ítems</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map((it, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 70px 120px 36px', gap: '8px' }}>
                <input placeholder="Descripción" style={inputStyle} value={it.description} onChange={e => updateItem(i, 'description', e.target.value)} required />
                <input placeholder="Cant." type="number" min="1" style={inputStyle} value={it.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                <input placeholder="Precio" type="number" style={inputStyle} value={it.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} />
                <button type="button" onClick={() => setItems(p => p.filter((_, idx) => idx !== i))}
                  style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>×</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setItems(p => [...p, emptyItem()])}
            style={{ ...btnSecondary, marginTop: '8px', fontSize: '12px', padding: '6px 14px' }}>+ Agregar ítem</button>
        </div>
        <div className="form-grid-2">
          <FormField label="Descuento ($)"><input style={inputStyle} type="number" value={discount} onChange={e => setDiscount(e.target.value)} /></FormField>
          <FormField label="Notas"><input style={inputStyle} value={notes} onChange={e => setNotes(e.target.value)} /></FormField>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '15px' }}>
          <span>Total</span><span>${total.toLocaleString('es-AR')}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button type="submit" style={btnPrimary} disabled={isPending}>
            {isPending ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Guardar presupuesto'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
