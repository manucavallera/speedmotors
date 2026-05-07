import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'

export interface QuoteConvertData {
  type: string
  paymentMethod: string
  installmentCount: number
}

interface QuoteConvertModalProps {
  quote: any
  onClose: () => void
  onSubmit: (id: number, data: QuoteConvertData) => void
  isPending: boolean
}

export function QuoteConvertModal({ quote, onClose, onSubmit, isPending }: QuoteConvertModalProps) {
  const [form, setForm] = useState({ type: 'contado', paymentMethod: 'efectivo', installmentCount: '3' })
  const f = (key: string) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  return (
    <Modal title={`Convertir presupuesto #${quote.id} a venta`} onClose={onClose} width={400}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <FormField label="Tipo de venta">
          <select style={inputStyle} value={form.type} onChange={f('type')}>
            <option value="contado">Contado</option>
            <option value="cuotas">Cuotas</option>
          </select>
        </FormField>
        <FormField label="Forma de pago">
          <select style={inputStyle} value={form.paymentMethod} onChange={f('paymentMethod')}>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="mixto">Mixto</option>
          </select>
        </FormField>
        {form.type === 'cuotas' && (
          <FormField label="N° cuotas">
            <input style={inputStyle} type="number" min="2" value={form.installmentCount} onChange={f('installmentCount')} />
          </FormField>
        )}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button onClick={() => onSubmit(quote.id, { ...form, installmentCount: Number(form.installmentCount) })}
            style={btnPrimary} disabled={isPending}>
            {isPending ? 'Convirtiendo...' : 'Confirmar venta'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
