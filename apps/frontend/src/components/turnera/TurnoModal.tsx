import { useState } from 'react'
import { toast } from '../../lib/toast'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import { SearchableSelect } from '../ui/SearchableSelect'
import { type GuarderiaUnitOption, type SlotForm } from '../../types/turnera.types'
import { type StorageService } from '../../types/guarderia.types'

interface Props {
  units: GuarderiaUnitOption[]
  services: StorageService[]
  date: string
  presetStart?: string
  presetEnd?: string
  onClose: () => void
  onSubmit: (data: SlotForm) => void
  submitting: boolean
}

export function TurnoModal({ units, services, date, presetStart, presetEnd, onClose, onSubmit, submitting }: Props) {
  const [unitId, setUnitId] = useState('')
  const [startTime, setStartTime] = useState(presetStart ?? '')
  const [endTime, setEndTime] = useState(presetEnd ?? '')
  // El cliente puede pedir varios servicios en el mismo turno: batería + combustible + parrilla
  const [picked, setPicked] = useState<Record<number, number>>({})

  const unit = units.find(u => String(u.id) === unitId)
  const total = Object.values(picked).reduce((a, b) => a + b, 0)

  function toggle(s: StorageService) {
    setPicked(prev => {
      const next = { ...prev }
      if (s.id in next) delete next[s.id]
      else next[s.id] = Number(s.price) || 0
      return next
    })
  }

  function submit() {
    if (!unitId) { toast.error('Elegí la lancha'); return }
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) { toast.error('Cargá horario inicio y fin'); return }
    if (endTime <= startTime) { toast.error('La hora de fin debe ser posterior'); return }
    onSubmit({
      unitId: Number(unitId),
      date,
      startTime,
      endTime,
      items: Object.entries(picked).map(([id, amount]) => ({
        serviceId: Number(id),
        concept: services.find(s => s.id === Number(id))?.name ?? 'Servicio',
        amount,
      })),
    })
  }

  return (
    <Modal title="Agendar salida al agua" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <FormField label="Lancha (guardería)">
          <SearchableSelect
            value={unitId}
            onChange={setUnitId}
            options={units.map(u => ({ value: String(u.id), label: `${u.description} — ${u.clientName ?? 'sin cliente'}` }))}
            placeholder="Buscar lancha..."
            emptyLabel="— Elegir —"
          />
        </FormField>

        {unit && <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '-6px' }}>Cliente: <strong style={{ color: '#0f172a' }}>{unit.clientName ?? 'sin cliente'}</strong></div>}

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}><FormField label="Desde"><input style={inputStyle} type="time" value={startTime} onChange={e => setStartTime(e.target.value)} /></FormField></div>
          <div style={{ flex: 1 }}><FormField label="Hasta"><input style={inputStyle} type="time" value={endTime} onChange={e => setEndTime(e.target.value)} /></FormField></div>
        </div>

        <FormField label="Servicios que pide">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '210px', overflowY: 'auto' }}>
            {services.map(s => {
              const on = s.id in picked
              return (
                <div
                  key={s.id}
                  onClick={() => toggle(s)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                    background: on ? '#eff6ff' : '#f8fafc',
                    border: `1.5px solid ${on ? '#bfdbfe' : '#e2e8f0'}`,
                    borderRadius: '9px', padding: '8px 11px',
                  }}
                >
                  <input type="checkbox" checked={on} readOnly style={{ pointerEvents: 'none' }} />
                  <span style={{ flex: 1, fontSize: '13px', color: '#0f172a' }}>{s.name}</span>
                  {on ? (
                    <input
                      style={{ ...inputStyle, width: '95px', padding: '4px 8px', fontSize: '12.5px' }}
                      type="number"
                      value={picked[s.id]}
                      onClick={e => e.stopPropagation()}
                      onChange={e => setPicked(p => ({ ...p, [s.id]: Number(e.target.value) || 0 }))}
                    />
                  ) : (
                    <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>${Number(s.price).toLocaleString('es-AR')}</span>
                  )}
                </div>
              )
            })}
          </div>
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>Total del turno</span>
          <span style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>${total.toLocaleString('es-AR')}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button style={btnSecondary} onClick={onClose}>Cancelar</button>
          <button style={btnPrimary} disabled={submitting} onClick={submit}>Agendar</button>
        </div>
      </div>
    </Modal>
  )
}
