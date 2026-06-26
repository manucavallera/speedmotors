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
  onClose: () => void
  onSubmit: (data: SlotForm) => void
  submitting: boolean
}

export function TurnoModal({ units, services, date, onClose, onSubmit, submitting }: Props) {
  const [unitId, setUnitId] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [price, setPrice] = useState('')

  const unit = units.find(u => String(u.id) === unitId)

  // Al elegir servicio, prellenar precio con la tarifa del catálogo
  function pickService(v: string) {
    setServiceId(v)
    const s = services.find(x => String(x.id) === v)
    setPrice(s ? String(Number(s.price) || '') : '')
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
      serviceId: serviceId ? Number(serviceId) : undefined,
      price: price ? Number(price) : 0,
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

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1.4 }}>
            <FormField label="Servicio (opcional)">
              <SearchableSelect
                value={serviceId}
                onChange={pickService}
                options={services.map(s => ({ value: String(s.id), label: s.name }))}
                placeholder="Servicio..."
                emptyLabel="— Sin servicio —"
              />
            </FormField>
          </div>
          <div style={{ flex: 1 }}><FormField label="Precio"><input style={inputStyle} type="number" value={price} onChange={e => setPrice(e.target.value)} /></FormField></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button style={btnSecondary} onClick={onClose}>Cancelar</button>
          <button style={btnPrimary} disabled={submitting} onClick={submit}>Agendar</button>
        </div>
      </div>
    </Modal>
  )
}
