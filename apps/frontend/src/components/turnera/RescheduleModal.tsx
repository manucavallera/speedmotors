import { useState } from 'react'
import { type RentalSlot } from '../../types/turnera.types'

interface Props {
  slot: RentalSlot
  submitting: boolean
  onClose: () => void
  onSubmit: (date: string, startTime: string, endTime: string) => void
}

// Minutos desde medianoche de un "HH:MM"
function toMin(t: string) { const [h, m] = t.split(':').map(Number); return h * 60 + m }
function toHHMM(min: number) { const h = Math.floor(min / 60) % 24; const m = min % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` }

// Correr un turno: cambia fecha/hora de inicio, la duración se mantiene igual
export function RescheduleModal({ slot, submitting, onClose, onSubmit }: Props) {
  const duration = toMin(slot.endTime) - toMin(slot.startTime)
  const [date, setDate] = useState(slot.date)
  const [start, setStart] = useState(slot.startTime)
  const end = toHHMM(toMin(start) + duration)

  function submit() { onSubmit(date, start, end) }

  const label = { fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' }
  const input = { width: '100%', padding: '9px 11px', fontSize: '14px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' as const }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '14px', padding: '22px', width: '100%', maxWidth: '360px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Correr turno</h2>
        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>{slot.boatName ?? 'lancha'} · {slot.clientName ?? 'sin cliente'}</div>

        <div style={{ marginBottom: '12px' }}>
          <label style={label}>Nueva fecha</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={input} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={label}>Nueva hora de inicio</label>
          <input type="time" value={start} onChange={e => setStart(e.target.value)} style={input} />
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>Termina {end} (dura {duration} min)</div>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 16px', fontSize: '13.5px', fontWeight: 600, background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '9px', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={submit} disabled={submitting || end <= start} style={{ padding: '9px 18px', fontSize: '13.5px', fontWeight: 600, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white', border: 'none', borderRadius: '9px', cursor: submitting ? 'wait' : 'pointer', opacity: (submitting || end <= start) ? 0.6 : 1 }}>Correr turno</button>
        </div>
      </div>
    </div>
  )
}
