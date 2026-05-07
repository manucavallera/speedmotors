import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'

const categories = ['alquiler', 'servicios', 'compras', 'sueldos', 'impuestos', 'otros']

export interface ExpenseFormData {
  description: string
  amount: number
  category: string
  notes: string
}

interface ExpenseFormModalProps {
  mode: 'create' | 'edit'
  editing?: any
  onClose: () => void
  onSubmit: (data: ExpenseFormData) => void
  isPending: boolean
}

export function ExpenseFormModal({ mode, editing, onClose, onSubmit, isPending }: ExpenseFormModalProps) {
  const [form, setForm] = useState({
    description: editing?.description || '',
    amount: editing?.amount || '',
    category: editing?.category || 'otros',
    notes: editing?.notes || '',
  })
  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  return (
    <Modal title={mode === 'edit' ? 'Editar gasto' : 'Registrar gasto'} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, amount: Number(form.amount) }) }}
        style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <FormField label="Descripción">
          <input style={inputStyle} value={form.description} onChange={f('description')} required />
        </FormField>
        <div className="form-grid-2">
          <FormField label="Monto ($)">
            <input style={inputStyle} type="number" value={form.amount} onChange={f('amount')} required />
          </FormField>
          <FormField label="Categoría">
            <select style={inputStyle} value={form.category} onChange={f('category')}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Notas (opcional)">
          <input style={inputStyle} value={form.notes} onChange={f('notes')} />
        </FormField>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button type="submit" style={btnPrimary} disabled={isPending}>
            {isPending ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Registrar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
