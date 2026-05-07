import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'

interface Props {
  clientName: string
  onClose: () => void
  onSubmit: (data: { type: string; amount: number; description: string; date: string; notes?: string }) => void
  isPending: boolean
}

const typeOptions = [
  { value: 'pago_cuenta', label: 'Pago a cuenta', color: '#16a34a', desc: 'Reduce la deuda del cliente' },
  { value: 'nota_credito', label: 'Nota de crédito', color: '#2563eb', desc: 'Descuento o devolución' },
  { value: 'nota_debito', label: 'Nota de débito', color: '#dc2626', desc: 'Cargo adicional' },
]

export function ClientPaymentFormModal({ clientName, onClose, onSubmit, isPending }: Props) {
  const [type, setType] = useState('pago_cuenta')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const selected = typeOptions.find(t => t.value === type)!

  function submit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ type, amount: Number(amount), description, date, notes: notes || undefined })
  }

  return (
    <Modal title={`Movimiento de cuenta — ${clientName}`} onClose={onClose} width={460}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {typeOptions.map(t => (
            <button key={t.value} type="button" onClick={() => setType(t.value)}
              style={{ padding: '10px 8px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center', border: type === t.value ? `2px solid ${t.color}` : '2px solid #e2e8f0', background: type === t.value ? `${t.color}10` : 'white' }}>
              <div style={{ fontWeight: 700, fontSize: '12.5px', color: type === t.value ? t.color : '#374151' }}>{t.label}</div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>{t.desc}</div>
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FormField label="Monto ($)">
            <input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
              style={inputStyle} placeholder="50000" required />
          </FormField>
          <FormField label="Fecha">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} required />
          </FormField>
        </div>

        <FormField label="Descripción">
          <input value={description} onChange={e => setDescription(e.target.value)} style={inputStyle}
            placeholder={type === 'pago_cuenta' ? 'Pago en efectivo' : type === 'nota_credito' ? 'Descuento acordado' : 'Cargo adicional'}
            required />
        </FormField>

        <FormField label="Notas (opcional)">
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            style={{ ...inputStyle, minHeight: '56px', resize: 'vertical' }} />
        </FormField>

        <div style={{ background: `${selected.color}10`, border: `1px solid ${selected.color}30`, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: selected.color, fontWeight: 600 }}>
          {selected.label}{amount ? `: $${Number(amount).toLocaleString('es-AR')}` : ''}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button type="submit" disabled={isPending} style={btnPrimary}>{isPending ? 'Registrando...' : 'Registrar movimiento'}</button>
        </div>
      </form>
    </Modal>
  )
}
