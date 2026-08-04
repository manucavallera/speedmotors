import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTurnera } from '../hooks/useTurnera'
import { DaySchedule } from '../components/turnera/DaySchedule'
import { CalendarPicker } from '../components/turnera/CalendarPicker'
import { SlotGrid } from '../components/turnera/SlotGrid'
import { TurnoModal } from '../components/turnera/TurnoModal'
import { RescheduleModal } from '../components/turnera/RescheduleModal'
import { EditItemsModal } from '../components/turnera/EditItemsModal'
import { TurneraConfigModal } from '../components/turnera/TurneraConfigModal'
import { printDayList } from '../lib/printDayList'
import { type TurneraConfig } from '../lib/turneraConfig'
import { HelpModal, HelpButton } from '../components/ui/HelpModal'
import { TURNERA_HELP } from '../lib/helpContent'
import { type SlotForm, type RentalSlot } from '../types/turnera.types'

function today() { return new Date().toISOString().slice(0, 10) }
const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

// Etiqueta legible del día seleccionado
function prettyDate(d: string) {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function Stat({ value, label, color, small }: { value: string | number; label: string; color: string; small?: boolean }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', minWidth: 0 }}>
      <div style={{ fontSize: small ? '15px' : '22px', fontWeight: 700, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>{label}</div>
    </div>
  )
}

export function TurneraPage() {
  const navigate = useNavigate()
  const [date, setDate] = useState(today())
  const { units, services, slots, slotsQuery, monthDays, createSlot, setStatus, reschedule, updateItems, charge, removeSlot, config, saveConfig } = useTurnera(date)
  const [showModal, setShowModal] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [rescheduling, setRescheduling] = useState<RentalSlot | null>(null)
  const [editingItems, setEditingItems] = useState<RentalSlot | null>(null)
  const [preset, setPreset] = useState<{ start: string; end: string } | null>(null)

  // Reservar desde un casillero libre de la grilla: abre el modal con el horario prellenado
  function reserveSlot(start: string, end: string) {
    setPreset({ start, end })
    setShowModal(true)
  }
  function openManual() {
    setPreset(null)
    setShowModal(true)
  }
  function handleSaveConfig(cfg: TurneraConfig) {
    saveConfig.mutate(cfg, { onSuccess: () => setShowConfig(false) })
  }

  const activos = slots.filter(s => s.status !== 'cancelado')
  const reserved = activos.length
  const cobradoDia = slots.filter(s => s.paidAt).reduce((a, s) => a + Number(s.price), 0)
  const cobradoMes = monthDays.reduce((a, d) => a + (d.cobrado || 0), 0)
  // Próxima salida pendiente del día (por hora de inicio)
  const proxima = [...slots].filter(s => s.status === 'reservado').sort((a, b) => a.startTime.localeCompare(b.startTime))[0]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Turnera</h1>
          <div style={{ fontSize: '13px', color: '#94a3b8', textTransform: 'capitalize' }}>{prettyDate(date)} · {reserved} salida{reserved === 1 ? '' : 's'}</div>
        </div>
        <HelpButton onClick={() => setShowHelp(true)} />
        <button
          style={{ padding: '9px 14px', fontSize: '13.5px', fontWeight: 600, background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '9px', cursor: activos.length ? 'pointer' : 'not-allowed', opacity: activos.length ? 1 : 0.5 }}
          onClick={() => printDayList(prettyDate(date), slots)}
          disabled={!activos.length}
        >🖨 Imprimir lista</button>
        <button
          style={{ padding: '9px 14px', fontSize: '13.5px', fontWeight: 600, background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '9px', cursor: 'pointer' }}
          onClick={() => setShowConfig(true)}
        >⚙ Configurar turnos</button>
        <button
          style={{ padding: '9px 18px', fontSize: '13.5px', fontWeight: 600, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white', border: 'none', borderRadius: '9px', cursor: units.length ? 'pointer' : 'not-allowed', opacity: units.length ? 1 : 0.5 }}
          onClick={openManual}
          disabled={!units.length}
        >+ Salida al agua</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        <Stat value={reserved} label="Salidas del día" color="#1d4ed8" />
        <Stat value={fmt(cobradoDia)} label="Cobrado hoy" color="#16a34a" />
        <Stat value={fmt(cobradoMes)} label="Cobrado en el mes" color="#0f172a" />
        <Stat value={proxima ? `${proxima.startTime} · ${proxima.boatName ?? 'lancha'}` : '—'} label="Próxima salida" color="#0f172a" small />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr)', gap: '20px', alignItems: 'start' }} className="turnera-layout">
        <CalendarPicker date={date} days={monthDays} onSelect={setDate} />
        <div>
          {!units.length ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', border: '1.5px dashed #bfdbfe', background: '#f8fbff', borderRadius: '12px' }}>
              <div style={{ color: '#334155', fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>No hay embarcaciones para agendar</div>
              <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>Primero guardá una embarcación con su cliente en Guardería.</div>
              <button onClick={() => navigate('/guarderia')} style={{ padding: '9px 15px', border: 'none', borderRadius: '9px', background: '#2563eb', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                Ir a Guardería
              </button>
            </div>
          ) : slotsQuery.isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
          ) : (
            <>
              <SlotGrid slots={slots} config={config} onReserve={reserveSlot} />
              <DaySchedule
                slots={slots}
                onCharge={(id) => charge.mutate(id)}
                onCancel={(id) => setStatus.mutate({ id, status: 'cancelado' })}
                onReschedule={(s) => setRescheduling(s)}
                onEditItems={(s) => setEditingItems(s)}
                onRemove={(id) => removeSlot.mutate(id)}
              />
            </>
          )}
        </div>
      </div>

      {showModal && (
        <TurnoModal
          units={units}
          services={services}
          date={date}
          presetStart={preset?.start}
          presetEnd={preset?.end}
          submitting={createSlot.isPending}
          onClose={() => { setShowModal(false); setPreset(null) }}
          onSubmit={(data: SlotForm) => createSlot.mutate(data, { onSuccess: () => { setShowModal(false); setPreset(null) } })}
        />
      )}

      {editingItems && (
        <EditItemsModal
          slot={editingItems}
          services={services}
          submitting={updateItems.isPending}
          onClose={() => setEditingItems(null)}
          onSubmit={(items) => updateItems.mutate({ id: editingItems.id, items }, { onSuccess: () => setEditingItems(null) })}
        />
      )}

      {rescheduling && (
        <RescheduleModal
          slot={rescheduling}
          submitting={reschedule.isPending}
          onClose={() => setRescheduling(null)}
          onSubmit={(d, startTime, endTime) => reschedule.mutate(
            { id: rescheduling.id, date: d, startTime, endTime },
            { onSuccess: () => setRescheduling(null) },
          )}
        />
      )}

      {showConfig && (
        <TurneraConfigModal
          config={config}
          onClose={() => setShowConfig(false)}
          onSave={handleSaveConfig}
        />
      )}

      {showHelp && <HelpModal title="Cómo funciona la Turnera" sections={TURNERA_HELP} onClose={() => setShowHelp(false)} />}
    </div>
  )
}
