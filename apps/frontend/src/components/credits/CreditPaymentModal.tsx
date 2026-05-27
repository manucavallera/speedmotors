import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'

interface Props {
  maxAmount: number
  currency: 'pesos' | 'usd'
  onClose: () => void
  onSubmit: (data: { amount: number; paymentDate: string; notes?: string }) => void
  isPending: boolean
}

export function CreditPaymentModal({ maxAmount, currency, onClose, onSubmit, isPending }: Props) {
  const [amount, setAmount] = useState<string>('')
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState<string>('')

  function handleSubmit() {
    if (!amount || Number(amount) <= 0) return
    onSubmit({ amount: Number(amount), paymentDate: new Date(paymentDate).toISOString(), notes: notes || undefined })
  }

  const symbol = currency === 'usd' ? 'US$' : '$'

  return (
    <Modal title="Registrar pago" onClose={onClose} width={420}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', color: '#475569' }}>
          Saldo actual: <strong style={{ color: '#0f172a' }}>{symbol}{maxAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
        </div>

        <FormField label="Monto entregado">
          <input style={inputStyle} type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
        </FormField>

        <FormField label="Fecha del pago">
          <input style={inputStyle} type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
        </FormField>

        <FormField label="Notas (opcional)">
          <textarea style={{ ...inputStyle, minHeight: '50px', resize: 'vertical', fontFamily: 'inherit' }} value={notes} onChange={e => setNotes(e.target.value)} />
        </FormField>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button onClick={onClose} style={btnSecondary} disabled={isPending}>Cancelar</button>
          <button onClick={handleSubmit} style={btnPrimary} disabled={isPending || !amount}>
            {isPending ? 'Guardando...' : 'Registrar pago'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
