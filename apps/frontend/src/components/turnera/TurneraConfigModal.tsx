import { useState } from 'react'
import { toast } from '../../lib/toast'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import { type TurneraConfig, toMin } from '../../lib/turneraConfig'

interface Props {
  config: TurneraConfig
  onClose: () => void
  onSave: (cfg: TurneraConfig) => void
}

const PRESETS = [5, 10, 15, 20, 30, 60]

export function TurneraConfigModal({ config, onClose, onSave }: Props) {
  const [intervalMin, setIntervalMin] = useState(String(config.intervalMin))
  const [dayStart, setDayStart] = useState(config.dayStart)
  const [dayEnd, setDayEnd] = useState(config.dayEnd)

  function save() {
    const iv = Number(intervalMin)
    if (!iv || iv <= 0) { toast.error('El intervalo debe ser mayor a 0'); return }
    if (!/^\d{2}:\d{2}$/.test(dayStart) || !/^\d{2}:\d{2}$/.test(dayEnd)) { toast.error('Cargá desde y hasta'); return }
    if (toMin(dayEnd) <= toMin(dayStart)) { toast.error('"Hasta" debe ser posterior a "Desde"'); return }
    onSave({ intervalMin: iv, dayStart, dayEnd })
  }

  return (
    <Modal title="Configurar turnos" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ fontSize: '12.5px', color: '#64748b' }}>
          Elegí cada cuántos minutos es un turno y el rango horario del día. La grilla se arma sola con esos casilleros.
        </div>

        <FormField label="Cada cuántos minutos">
          <input style={inputStyle} type="number" min={1} value={intervalMin} onChange={e => setIntervalMin(e.target.value)} />
        </FormField>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '-6px' }}>
          {PRESETS.map(p => (
            <button key={p} onClick={() => setIntervalMin(String(p))} style={{
              fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '7px', cursor: 'pointer',
              border: '1px solid', borderColor: String(p) === intervalMin ? '#1d4ed8' : '#e2e8f0',
              background: String(p) === intervalMin ? '#eff6ff' : 'white', color: String(p) === intervalMin ? '#1d4ed8' : '#64748b',
            }}>{p} min</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}><FormField label="Desde"><input style={inputStyle} type="time" value={dayStart} onChange={e => setDayStart(e.target.value)} /></FormField></div>
          <div style={{ flex: 1 }}><FormField label="Hasta"><input style={inputStyle} type="time" value={dayEnd} onChange={e => setDayEnd(e.target.value)} /></FormField></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button style={btnSecondary} onClick={onClose}>Cancelar</button>
          <button style={btnPrimary} onClick={save}>Guardar</button>
        </div>
      </div>
    </Modal>
  )
}
