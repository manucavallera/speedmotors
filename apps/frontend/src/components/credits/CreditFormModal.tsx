import { useMemo, useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import type { Credit } from '../../hooks/useCredits'
import { dateInputToIso, todayDateInput } from '../../lib/date'

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
  const [creditType, setCreditType] = useState<'saldo_compuesto' | 'cuotas_simples'>(credit?.creditType || 'saldo_compuesto')
  const [originalAmount, setOriginalAmount] = useState<string>(credit?.originalAmount || '')
  const [interestRate, setInterestRate] = useState<string>(credit?.interestRate || '5')
  const [startDate, setStartDate] = useState<string>(credit?.startDate ? credit.startDate.slice(0, 10) : todayDateInput())
  const [firstDueDate, setFirstDueDate] = useState<string>(credit?.firstDueDate ? credit.firstDueDate.slice(0, 10) : '')
  const [installmentsCount, setInstallmentsCount] = useState<string>(credit?.installmentsCount?.toString() || '12')
  const [notes, setNotes] = useState<string>(credit?.notes || '')

  const preview = useMemo(() => {
    if (creditType !== 'cuotas_simples') return null
    const capital = Number(originalAmount) || 0
    const rate = Number(interestRate) / 100 || 0
    const n = Number(installmentsCount) || 0
    if (!capital || !n) return null
    const total = capital * (1 + rate * n)
    const cuota = total / n
    return { total, cuota, n }
  }, [creditType, originalAmount, interestRate, installmentsCount])

  function handleSubmit() {
    if (mode === 'create' && !clientId) return
    if (creditType === 'cuotas_simples' && (!firstDueDate || !installmentsCount)) return

    const data: any = {
      originalAmount: Number(originalAmount),
      interestRate: Number(interestRate),
      startDate: dateInputToIso(startDate),
      notes: notes || undefined,
    }
    if (firstDueDate) {
      data.firstDueDate = dateInputToIso(firstDueDate)
    }
    if (creditType === 'cuotas_simples') {
      data.installmentsCount = Number(installmentsCount)
    }
    if (mode === 'create') {
      data.clientId = Number(clientId)
      data.currency = currency
      data.creditType = creditType
    }
    onSubmit(data)
  }

  const fmt = (n: number) => `${currency === 'usd' ? 'USD ' : '$'}${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <Modal title={mode === 'create' ? 'Nuevo crédito' : 'Editar crédito'} onClose={onClose} width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {mode === 'create' && (
          <FormField label="Tipo de crédito">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <label style={typeOption(creditType === 'saldo_compuesto')}>
                <input type="radio" name="creditType" checked={creditType === 'saldo_compuesto'} onChange={() => setCreditType('saldo_compuesto')} style={{ marginRight: 6 }} />
                <div>
                  <div style={{ fontWeight: 600 }}>Saldo compuesto</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Interés mensual sobre saldo. Para deudores viejos.</div>
                </div>
              </label>
              <label style={typeOption(creditType === 'cuotas_simples')}>
                <input type="radio" name="creditType" checked={creditType === 'cuotas_simples'} onChange={() => setCreditType('cuotas_simples')} style={{ marginRight: 6 }} />
                <div>
                  <div style={{ fontWeight: 600 }}>Cuotas simples</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>N cuotas fijas con fecha de inicio configurable.</div>
                </div>
              </label>
            </div>
          </FormField>
        )}

        {mode === 'create' && creditType === 'saldo_compuesto' && (
          <div style={infoBox}>
            💡 <strong>Para deudores viejos del Excel:</strong> poné en "Monto" el saldo que te deben <strong>hoy</strong>. Si dejás la <strong>fecha de vencimiento</strong> en blanco, el primer interés se cobra 30 días después del inicio. Si la cargás, el primer interés cae exacto en esa fecha.
          </div>
        )}
        {mode === 'create' && creditType === 'cuotas_simples' && (
          <div style={infoBox}>
            💡 <strong>Cuotas simples:</strong> capital + (capital × tasa × meses). Cuota fija = total / N. Monto fijo siempre (no hay descuento por adelanto). Si se atrasa, recargo = monto × tasa × meses_vencidos. Alerta 10 días antes del vencimiento.
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
          <FormField label={creditType === 'cuotas_simples' ? 'Capital a financiar' : 'Monto (saldo actual)'}>
            <input style={inputStyle} type="number" min="0" step="0.01" value={originalAmount} onChange={e => setOriginalAmount(e.target.value)} placeholder={creditType === 'cuotas_simples' ? 'Capital sin interés' : 'Lo que te debe hoy'} />
          </FormField>
          <FormField label="Tasa mensual (%)">
            <input style={inputStyle} type="number" min="0" step="0.1" value={interestRate} onChange={e => setInterestRate(e.target.value)} />
          </FormField>
          <FormField label="Fecha de inicio">
            <input style={inputStyle} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </FormField>
        </div>

        {creditType === 'saldo_compuesto' && (
          <FormField label="Fecha de vencimiento / primer interés (opcional)">
            <input style={inputStyle} type="date" value={firstDueDate} onChange={e => setFirstDueDate(e.target.value)} />
          </FormField>
        )}

        {creditType === 'cuotas_simples' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Fecha primera cuota">
                <input style={inputStyle} type="date" value={firstDueDate} onChange={e => setFirstDueDate(e.target.value)} />
              </FormField>
              <FormField label="Cantidad de cuotas">
                <input style={inputStyle} type="number" min="1" max="60" step="1" value={installmentsCount} onChange={e => setInstallmentsCount(e.target.value)} />
              </FormField>
            </div>
            {preview && (
              <div style={previewBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#475569' }}>Total a pagar ({preview.n} cuotas):</span>
                  <strong>{fmt(preview.total)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}>
                  <span style={{ color: '#475569' }}>Cuota fija:</span>
                  <strong style={{ color: '#0ea5e9' }}>{fmt(preview.cuota)}</strong>
                </div>
              </div>
            )}
          </>
        )}

        <FormField label="Notas (opcional)">
          <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical', fontFamily: 'inherit' }} value={notes} onChange={e => setNotes(e.target.value)} />
        </FormField>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button onClick={onClose} style={btnSecondary} disabled={isPending}>Cancelar</button>
          <button onClick={handleSubmit} style={btnPrimary} disabled={isPending || !originalAmount || (creditType === 'cuotas_simples' && (!firstDueDate || !installmentsCount))}>
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

const infoBox: React.CSSProperties = {
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  padding: '10px 14px',
  borderRadius: '8px',
  fontSize: '12.5px',
  color: '#1e40af',
  lineHeight: 1.5,
}

const previewBox: React.CSSProperties = {
  background: '#f0f9ff',
  border: '1px solid #bae6fd',
  padding: '10px 14px',
  borderRadius: '8px',
}

const typeOption = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'flex-start',
  padding: '10px 12px',
  border: `1.5px solid ${active ? '#0ea5e9' : '#e2e8f0'}`,
  background: active ? '#f0f9ff' : '#fff',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 13,
})
