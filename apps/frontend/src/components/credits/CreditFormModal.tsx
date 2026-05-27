import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import type { Credit } from '../../hooks/useCredits'

interface Props {
  mode: 'create' | 'edit'
  credit?: Credit | null
  clients: any[]
  onClose: () => void
  onSubmit: (data: any) => void
  isPending: boolean
}

export function CreditFormModal({ mode, credit, clients, onClose, onSubmit, isPending }: Props) {
  const [clientId, setClientId] = useState<number | ''>(credit?.clientId || '')
  const [currency, setCurrency] = useState<'pesos' | 'usd'>(credit?.currency || 'pesos')
  const [originalAmount, setOriginalAmount] = useState<string>(credit?.originalAmount || '')
  const [interestRate, setInterestRate] = useState<string>(credit?.interestRate || '5')
  const [startDate, setStartDate] = useState<string>(credit?.startDate ? credit.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState<string>(credit?.notes || '')

  function handleSubmit() {
    if (mode === 'create' && !clientId) return
    const data: any = {
      originalAmount: Number(originalAmount),
      interestRate: Number(interestRate),
      startDate: new Date(startDate).toISOString(),
      notes: notes || undefined,
    }
    if (mode === 'create') {
      data.clientId = Number(clientId)
      data.currency = currency
    }
    onSubmit(data)
  }

  return (
    <Modal title={mode === 'create' ? 'Nuevo crédito' : 'Editar crédito'} onClose={onClose} width={520}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {mode === 'create' && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', color: '#1e40af', lineHeight: 1.5 }}>
            💡 <strong>Para deudores viejos del Excel:</strong> poné en "Monto" el saldo que te deben <strong>hoy</strong> y en "Fecha de inicio" la fecha de hoy. Así el primer interés se cobra a los 30 días desde hoy.
          </div>
        )}
        {mode === 'create' && (
          <FormField label="Cliente">
            <select style={inputStyle} value={clientId} onChange={e => setClientId(Number(e.target.value) || '')}>
              <option value="">Seleccionar cliente...</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {mode === 'create' && (
            <FormField label="Moneda">
              <select style={inputStyle} value={currency} onChange={e => setCurrency(e.target.value as any)}>
                <option value="pesos">Pesos</option>
                <option value="usd">USD</option>
              </select>
            </FormField>
          )}
          <FormField label="Monto (saldo actual)">
            <input style={inputStyle} type="number" min="0" step="0.01" value={originalAmount} onChange={e => setOriginalAmount(e.target.value)} placeholder="Lo que te debe hoy" />
          </FormField>
          <FormField label="Tasa mensual (%)">
            <input style={inputStyle} type="number" min="0" step="0.1" value={interestRate} onChange={e => setInterestRate(e.target.value)} />
          </FormField>
          <FormField label="Fecha de inicio">
            <input style={inputStyle} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </FormField>
        </div>

        <FormField label="Notas (opcional)">
          <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical', fontFamily: 'inherit' }} value={notes} onChange={e => setNotes(e.target.value)} />
        </FormField>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button onClick={onClose} style={btnSecondary} disabled={isPending}>Cancelar</button>
          <button onClick={handleSubmit} style={btnPrimary} disabled={isPending || !originalAmount}>
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
