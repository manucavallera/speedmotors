import { useState } from 'react'
import { toast } from '../../lib/toast'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../../components/ui/FormField'
import { type UnitDetail, type ChargeForm, type StorageService, type ChargeItemForm } from '../../types/guarderia.types'
import { generateGuarderiaReceipt } from '../../lib/pdf/receipt'

interface Props {
  unit: UnitDetail
  services: StorageService[]
  onClose: () => void
  onSubmit: (data: ChargeForm) => void
  submitting: boolean
}

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

export function ChargeModal({ unit, services, onClose, onSubmit, submitting }: Props) {
  const [cuna, setCuna] = useState(String(Number(unit.rate) || ''))
  // Servicios anexos elegidos: serviceId → monto editable
  const [picked, setPicked] = useState<Record<number, string>>({})
  const [periodLabel, setPeriodLabel] = useState('')
  const [paid, setPaid] = useState(true)
  const [printReceipt, setPrintReceipt] = useState(true)

  function toggle(s: StorageService) {
    setPicked(prev => {
      const next = { ...prev }
      if (s.id in next) delete next[s.id]
      else next[s.id] = String(Number(s.price) || '')
      return next
    })
  }

  const total = (Number(cuna) || 0) + Object.values(picked).reduce((acc, v) => acc + (Number(v) || 0), 0)

  function submit() {
    const items: ChargeItemForm[] = []
    if (Number(cuna) > 0) items.push({ concept: 'Cuna mensual', amount: Number(cuna) })
    for (const s of services) {
      if (s.id in picked) {
        const a = Number(picked[s.id])
        if (a > 0) items.push({ concept: s.name, amount: a, serviceId: s.id })
      }
    }
    if (!items.length) { toast.error('Cargá al menos un ítem'); return }
    onSubmit({ items, periodLabel: periodLabel.trim() || undefined, paid })
    // Recibo PDF con el mismo detalle del cobro
    if (printReceipt) {
      generateGuarderiaReceipt({
        clientName: unit.clientName,
        unitDescription: unit.description,
        spotCode: unit.spotCode,
        periodLabel: periodLabel.trim() || null,
        items: items.map(it => ({ concept: it.concept, amount: it.amount })),
        total,
        paymentDate: new Date(),
        paid,
      })
    }
  }

  return (
    <Modal title={`Cobrar — ${unit.description}`} onClose={onClose} width={460}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ fontSize: '13px', color: '#64748b' }}>Cliente: <strong style={{ color: '#0f172a' }}>{unit.clientName}</strong></div>

        <FormField label="Cuna mensual">
          <input style={inputStyle} type="number" value={cuna} onChange={e => setCuna(e.target.value)} autoFocus />
        </FormField>

        {services.length > 0 && (
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Servicios anexos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {services.map(s => {
                const on = s.id in picked
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, fontSize: '13.5px', color: '#374151', cursor: 'pointer' }}>
                      <input type="checkbox" checked={on} onChange={() => toggle(s)} />
                      {s.name}
                    </label>
                    {on && (
                      <input style={{ ...inputStyle, width: '110px' }} type="number" value={picked[s.id]} onChange={e => setPicked(prev => ({ ...prev, [s.id]: e.target.value }))} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <FormField label="Período / concepto (opcional)">
          <input style={inputStyle} placeholder="Ej: Junio 2026" value={periodLabel} onChange={e => setPeriodLabel(e.target.value)} />
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px', fontWeight: 700, color: '#0f172a', background: '#f8fafc', borderRadius: '9px', padding: '10px 12px' }}>
          <span>Total</span><span>{fmt(total)}</span>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#374151', cursor: 'pointer' }}>
          <input type="checkbox" checked={paid} onChange={e => setPaid(e.target.checked)} />
          Cobrado ahora (si lo destildás, queda como deuda en la cuenta del cliente)
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#374151', cursor: 'pointer' }}>
          <input type="checkbox" checked={printReceipt} onChange={e => setPrintReceipt(e.target.checked)} />
          Generar recibo PDF
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
          <button style={btnSecondary} onClick={onClose}>Cancelar</button>
          <button style={{ ...btnPrimary, background: 'linear-gradient(135deg,#16a34a,#15803d)' }} disabled={submitting} onClick={submit}>
            {paid ? 'Registrar cobro' : 'Cargar deuda'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
