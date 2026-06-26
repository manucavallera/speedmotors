import { useState } from 'react'
import { useTurnera } from '../hooks/useTurnera'
import { DaySchedule } from '../components/turnera/DaySchedule'
import { TurnoModal } from '../components/turnera/TurnoModal'
import { inputStyle } from '../components/ui/FormField'
import { type SlotForm } from '../types/turnera.types'

function today() { return new Date().toISOString().slice(0, 10) }
const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

function Stat({ value, label, color, small }: { value: string | number; label: string; color: string; small?: boolean }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', minWidth: 0 }}>
      <div style={{ fontSize: small ? '15px' : '22px', fontWeight: 700, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>{label}</div>
    </div>
  )
}

export function TurneraPage() {
  const [date, setDate] = useState(today())
  const { units, services, slots, slotsQuery, createSlot, setStatus, charge, removeSlot } = useTurnera(date)
  const [showModal, setShowModal] = useState(false)

  const activos = slots.filter(s => s.status !== 'cancelado')
  const reserved = activos.length
  const cobradoHoy = slots.filter(s => s.paidAt).reduce((a, s) => a + Number(s.price), 0)
  // Próxima salida pendiente del día (por hora de inicio)
  const proxima = [...slots].filter(s => s.status === 'reservado').sort((a, b) => a.startTime.localeCompare(b.startTime))[0]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Turnera</h1>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>Salidas al agua · {reserved} este día</div>
        </div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, width: 'auto' }} />
        <button
          style={{ padding: '9px 18px', fontSize: '13.5px', fontWeight: 600, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white', border: 'none', borderRadius: '9px', cursor: 'pointer' }}
          onClick={() => setShowModal(true)}
          disabled={!units.length}
        >+ Salida al agua</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
        <Stat value={reserved} label="Salidas del día" color="#1d4ed8" />
        <Stat value={fmt(cobradoHoy)} label="Cobrado" color="#16a34a" />
        <Stat value={proxima ? `${proxima.startTime} · ${proxima.boatName ?? 'lancha'}` : '—'} label="Próxima salida" color="#0f172a" small />
      </div>

      {!units.length ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', border: '1.5px dashed #e2e8f0', borderRadius: '12px' }}>
          No hay lanchas en guardería para botar. Cargá unidades en Guardería primero.
        </div>
      ) : slotsQuery.isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
      ) : (
        <DaySchedule
          slots={slots}
          onCharge={(id) => charge.mutate(id)}
          onCancel={(id) => setStatus.mutate({ id, status: 'cancelado' })}
          onRemove={(id) => removeSlot.mutate(id)}
        />
      )}

      {showModal && (
        <TurnoModal
          units={units}
          services={services}
          date={date}
          submitting={createSlot.isPending}
          onClose={() => setShowModal(false)}
          onSubmit={(data: SlotForm) => createSlot.mutate(data, { onSuccess: () => setShowModal(false) })}
        />
      )}
    </div>
  )
}
