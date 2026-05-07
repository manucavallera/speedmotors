import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'

export interface SupplierFormData { name: string; phone: string; email: string; notes: string }

interface SupplierFormModalProps {
  mode: 'create' | 'edit'
  editing: any | null
  onClose: () => void
  onSubmit: (data: SupplierFormData) => void
  isPending: boolean
}

export function SupplierFormModal({ mode, editing, onClose, onSubmit, isPending }: SupplierFormModalProps) {
  const [form, setForm] = useState<SupplierFormData>({
    name: editing?.name || '', phone: editing?.phone || '',
    email: editing?.email || '', notes: editing?.notes || '',
  })
  const f = (key: keyof SupplierFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  return (
    <Modal title={mode === 'edit' ? 'Editar proveedor' : 'Nuevo proveedor'} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <FormField label="Nombre / Razón social">
          <input style={inputStyle} value={form.name} onChange={f('name')} required />
        </FormField>
        <div className="form-grid-2">
          <FormField label="Teléfono"><input style={inputStyle} value={form.phone} onChange={f('phone')} /></FormField>
          <FormField label="Email"><input style={inputStyle} type="email" value={form.email} onChange={f('email')} /></FormField>
        </div>
        <FormField label="Notas">
          <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '72px' }} value={form.notes} onChange={f('notes')} />
        </FormField>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button type="submit" style={btnPrimary} disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
