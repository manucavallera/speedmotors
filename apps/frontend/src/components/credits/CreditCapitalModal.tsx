import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'

interface Props {
  onClose: () => void
  onSubmit: (data: { amount: number; effectiveDate: string; notes?: string }) => void
  isPending: boolean
}

export function CreditCapitalModal({ onClose, onSubmit, isPending }: Props) {
  const [amount, setAmount] = useState('')
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  return (
    <Modal title="Agregar capital a la deuda" onClose={onClose} width={440}>
      <form onSubmit={e => { e.preventDefault(); onSubmit({ amount: Number(amount), effectiveDate: new Date(`${effectiveDate}T00:00:00`).toISOString(), notes: notes || undefined }) }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Usalo cuando el cliente incorpora una compra nueva, como un tráiler, a su cuenta corriente.</p>
        <FormField label="Nuevo capital"><input autoFocus required min="0.01" step="0.01" type="number" style={inputStyle} value={amount} onChange={e => setAmount(e.target.value)} /></FormField>
        <FormField label="Fecha efectiva"><input required type="date" style={inputStyle} value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} /></FormField>
        <FormField label="Concepto"><input style={inputStyle} placeholder="Ej: Tráiler" value={notes} onChange={e => setNotes(e.target.value)} /></FormField>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button type="submit" disabled={isPending || Number(amount) <= 0} style={btnPrimary}>{isPending ? 'Guardando...' : 'Agregar capital'}</button>
        </div>
      </form>
    </Modal>
  )
}
