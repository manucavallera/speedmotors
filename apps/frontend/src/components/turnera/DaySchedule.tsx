import { type RentalSlot } from '../../types/turnera.types'

interface Props {
  slots: RentalSlot[]
  onCharge: (id: number) => void
  onCancel: (id: number) => void
  onReschedule: (slot: RentalSlot) => void
  onEditItems: (slot: RentalSlot) => void
  onRemove: (id: number) => void
}

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

// Etiqueta de estado de la botadura
const STATUS_LABEL: Record<RentalSlot['status'], string> = { reservado: 'Reservado', completado: 'Completado', cancelado: 'Cancelado' }

// Estilo del badge de estado
function badgeStyle(s: RentalSlot): React.CSSProperties {
  if (s.status === 'cancelado') return { background: '#e2e8f0', color: '#64748b' }
  if (s.paidAt || s.status === 'completado') return { background: '#bbf7d0', color: '#15803d' }
  return { background: '#bfdbfe', color: '#1d4ed8' }
}

// Color del chip según estado de la botadura
function rowStyle(s: RentalSlot): React.CSSProperties {
  if (s.status === 'cancelado') return { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8', textDecoration: 'line-through' }
  if (s.paidAt || s.status === 'completado') return { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }
  return { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }
}

export function DaySchedule({ slots, onCharge, onCancel, onReschedule, onEditItems, onRemove }: Props) {
  if (!slots.length) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', border: '1.5px dashed #e2e8f0', borderRadius: '12px' }}>
        <div style={{ fontSize: '34px', marginBottom: '8px' }}>🌊</div>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Sin salidas al agua este día</div>
        <div style={{ fontSize: '13px', color: '#94a3b8' }}>Tocá "+ Salida al agua" para agendar la primera</div>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {slots.map(s => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', ...rowStyle(s), borderRadius: '9px', padding: '9px 12px' }}>
          <span style={{ fontWeight: 700, fontSize: '13px', minWidth: '90px' }}>{s.startTime}–{s.endTime}</span>
          <span style={{ ...badgeStyle(s), fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', borderRadius: '5px', padding: '2px 7px', textDecoration: 'none' }}>{STATUS_LABEL[s.status]}</span>
          <span style={{ fontSize: '13px', fontWeight: 600, flex: 1, minWidth: '120px' }}>{s.boatName ?? 'lancha'} <span style={{ fontWeight: 400, color: '#64748b' }}>· {s.clientName ?? 'sin cliente'}</span></span>
          {Number(s.price) > 0 && <span style={{ fontSize: '12.5px', fontWeight: 600 }}>{fmt(Number(s.price))}</span>}
          {s.paidAt && <span style={{ fontSize: '11px', fontWeight: 700 }}>✓ cobrado</span>}
          {s.status !== 'cancelado' && (
            <span style={{ display: 'flex', gap: '6px' }}>
              {!s.paidAt && Number(s.price) > 0 && <button onClick={() => onCharge(s.id)} style={{ fontSize: '11px', fontWeight: 600, color: '#15803d', background: 'white', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer' }}>Cobrar</button>}
              {!s.paidAt && s.status === 'reservado' && <button onClick={() => onReschedule(s)} style={{ fontSize: '11px', color: '#1d4ed8', background: 'white', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer' }}>Correr</button>}
              {!s.paidAt && s.status === 'reservado' && <button onClick={() => onEditItems(s)} style={{ fontSize: '11px', color: '#1d4ed8', background: 'white', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer' }}>Editar</button>}
              {!s.paidAt && <button onClick={() => onCancel(s.id)} style={{ fontSize: '11px', color: '#64748b', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer' }}>Cancelar</button>}
            </span>
          )}
          <button onClick={() => { if (window.confirm('¿Eliminar esta salida?')) onRemove(s.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: '15px' }}>×</button>
        </div>
      ))}
    </div>
  )
}
