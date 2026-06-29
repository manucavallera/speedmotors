import { type RentalSlot } from '../../types/turnera.types'
import { type TurneraConfig, buildSlots, toMin } from '../../lib/turneraConfig'

interface Props {
  slots: RentalSlot[]                              // reservas existentes del día
  config: TurneraConfig
  onReserve: (start: string, end: string) => void  // click en casillero libre
}

// Encuentra la reserva (no cancelada) que solapa un casillero
function occupant(cell: { start: string; end: string }, slots: RentalSlot[]) {
  const cs = toMin(cell.start), ce = toMin(cell.end)
  return slots.find(s => s.status !== 'cancelado' && cs < toMin(s.endTime) && ce > toMin(s.startTime)) ?? null
}

export function SlotGrid({ slots, config, onReserve }: Props) {
  const cells = buildSlots(config)

  if (!cells.length) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#dc2626', fontSize: '13px', border: '1.5px dashed #fecaca', borderRadius: '12px', marginBottom: '14px' }}>
        Configuración inválida: revisá el rango horario (desde/hasta) y el intervalo.
      </div>
    )
  }

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.3px' }}>Turnos · cada {config.intervalMin} min</span>
        <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>{config.dayStart}–{config.dayEnd}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '7px' }}>
        {cells.map(c => {
          const occ = occupant(c, slots)
          if (!occ) {
            return (
              <button
                key={c.start}
                onClick={() => onReserve(c.start, c.end)}
                title="Reservar este turno"
                style={{
                  textAlign: 'left', cursor: 'pointer', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 10px',
                  background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '2px',
                }}
              >
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>{c.start}–{c.end}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a' }}>Libre · reservar</span>
              </button>
            )
          }
          const done = occ.paidAt || occ.status === 'completado'
          return (
            <div
              key={c.start}
              title={`${occ.boatName ?? 'lancha'} · ${occ.clientName ?? ''}`}
              style={{
                borderRadius: '8px', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '2px',
                border: '1px solid', borderColor: done ? '#86efac' : '#93c5fd', background: done ? '#f0fdf4' : '#eff6ff',
              }}
            >
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: done ? '#15803d' : '#1d4ed8' }}>{c.start}–{c.end}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: done ? '#15803d' : '#1d4ed8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {done ? '✓ ' : ''}{occ.boatName ?? 'lancha'}{occ.clientName ? ` · ${occ.clientName}` : ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
