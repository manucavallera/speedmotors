// @file: ClientFormModal.tsx | Form create/edit cliente. Datos de contacto + fiscales.
import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import type { ClientForm } from '../../types/clients.types'
import { emptyClientForm, condicionIvaOptions } from '../../types/clients.types'

interface ClientFormModalProps {
  mode: 'create' | 'edit'
  editing: any | null
  onClose: () => void
  onSubmit: (data: ClientForm) => void
  isPending: boolean
}

function toForm(c: any): ClientForm {
  return {
    name: c.name, phone: c.phone || '', email: c.email || '',
    dni: c.dni || '', cuit: c.cuit || '',
    condicionIva: c.condicionIva || 'consumidor_final',
    address: c.address || '', notes: c.notes || '',
  }
}

export function ClientFormModal({ mode, editing, onClose, onSubmit, isPending }: ClientFormModalProps) {
  const [form, setForm] = useState<ClientForm>(() => editing ? toForm(editing) : emptyClientForm)
  const f = (key: keyof ClientForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  return (
    <Modal title={mode === 'edit' ? 'Editar cliente' : 'Nuevo cliente'} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <FormField label="Nombre completo">
          <input style={inputStyle} value={form.name} onChange={f('name')} required />
        </FormField>
        <div className="form-grid-2">
          <FormField label="Teléfono"><input style={inputStyle} value={form.phone} onChange={f('phone')} /></FormField>
          <FormField label="DNI"><input style={inputStyle} value={form.dni} onChange={f('dni')} placeholder="Para personas físicas" /></FormField>
        </div>
        <div className="form-grid-2">
          <FormField label="CUIT">
            <input style={inputStyle} value={form.cuit} onChange={f('cuit')} placeholder="XX-XXXXXXXX-X" />
          </FormField>
          <FormField label="Condición IVA">
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.condicionIva} onChange={f('condicionIva')}>
              {condicionIvaOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Email"><input style={inputStyle} type="email" value={form.email} onChange={f('email')} /></FormField>
        <FormField label="Dirección"><input style={inputStyle} value={form.address} onChange={f('address')} /></FormField>
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
