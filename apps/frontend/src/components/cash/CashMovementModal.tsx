import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'

export interface CashMovementData {
  sessionId: number
  type: string
  amount: number
  reason: string
}

interface CashMovementModalProps {
  sessionId: number
  onClose: () => void
  onSubmit: (data: CashMovementData) => void
  isPending: boolean
}

export function CashMovementModal({ sessionId, onClose, onSubmit, isPending }: CashMovementModalProps) {
  const [form, setForm] = useState({ type: 'retiro', amount: '', reason: '' })
  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  return (
    <Modal title="Movimiento manual de caja" onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSubmit({ sessionId, ...form, amount: Number(form.amount) }) }}
        style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <FormField label="Tipo">
          <select style={inputStyle} value={form.type} onChange={f('type')}>
            <option value="retiro">Retiro de efectivo</option>
            <option value="deposito">Depósito de efectivo</option>
          </select>
        </FormField>
        <FormField label="Monto ($)">
          <input style={inputStyle} type="number" min="0.01" step="0.01" value={form.amount} onChange={f('amount')} required />
        </FormField>
        <FormField label="Motivo (opcional)">
          <input style={inputStyle} value={form.reason} onChange={f('reason')} placeholder="Ej: pago proveedor, fondo chico..." />
        </FormField>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button type="submit" style={btnPrimary} disabled={isPending}>
            {isPending ? 'Guardando...' : 'Registrar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
