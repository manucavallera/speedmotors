// @file: ClientFormModal.tsx | Form create/edit cliente. Datos de contacto + fiscales.
import { useState, useRef } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import type { ClientForm } from '../../types/clients.types'
import { emptyClientForm, condicionIvaOptions } from '../../types/clients.types'
import { api } from '../../lib/api'

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
  const [scanning, setScanning] = useState(false)
  const dniInputRef = useRef<HTMLInputElement>(null)
  const f = (key: keyof ClientForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  async function handleDniScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post('/clients/parse-dni', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm(prev => ({
        ...prev,
        name: data.name || prev.name,
        dni: data.dni || prev.dni,
        address: data.address || prev.address,
      }))
    } catch {
      // silencioso — el usuario puede completar a mano
    } finally {
      setScanning(false)
      if (dniInputRef.current) dniInputRef.current.value = ''
    }
  }

  return (
    <Modal title={mode === 'edit' ? 'Editar cliente' : 'Nuevo cliente'} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '20px' }}>📷</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Escanear DNI</p>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Completá nombre, DNI y dirección automáticamente</p>
          </div>
          <input ref={dniInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleDniScan} />
          <button type="button" onClick={() => dniInputRef.current?.click()} disabled={scanning}
            style={{ ...btnSecondary, fontSize: '12px', padding: '6px 12px', opacity: scanning ? 0.6 : 1 }}>
            {scanning ? 'Leyendo...' : 'Subir foto'}
          </button>
        </div>

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
