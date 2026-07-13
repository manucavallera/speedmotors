import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { type MapSpot, type UnitDetail } from '../../types/guarderia.types'
import { btnPrimary } from '../ui/FormField'

interface Props {
  spot: MapSpot | null
  onGuardar: (spotId: number) => void
  onCobrar: (unit: UnitDetail) => void
  onRetirar: (unitId: number) => void
  onMover: (unit: UnitDetail) => void
  onVerCliente: (clientId: number) => void
  onSaldar: (chargeId: number) => void
}

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')
const fmtDate = (s: string) => new Date(s).toLocaleDateString('es-AR')

function Row({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13.5px' }}>
      <span style={{ color: '#64748b' }}>{k}</span>
      <span style={{ fontWeight: 600, color: color ?? '#0f172a' }}>{v}</span>
    </div>
  )
}

export function SpotPanel({ spot, onGuardar, onCobrar, onRetirar, onMover, onVerCliente, onSaldar }: Props) {
  const unitId = spot?.unit?.id ?? null
  const { data: unit } = useQuery<UnitDetail>({
    queryKey: ['guarderia', 'unit', unitId],
    queryFn: () => api.get(`/guarderia/units/${unitId}`).then(r => r.data),
    enabled: unitId != null,
  })

  const card: React.CSSProperties = { background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }

  if (!spot) {
    return <div style={{ ...card, color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '40px 18px' }}>Tocá un lugar para ver el detalle</div>
  }

  // Las cunas de las líneas sin piso no se pueden usar todavía
  if (!spot.active) {
    return (
      <div style={card}>
        <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Cuna {spot.code}</h3>
        <div style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '16px' }}>Línea en obra</div>
        <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
          Esta línea todavía no tiene piso. Cuando esté lista, se activa desde "Configurar lugares".
        </div>
      </div>
    )
  }

  if (!spot.occupied) {
    return (
      <div style={card}>
        <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Cuna {spot.code}</h3>
        <div style={{ fontSize: '12.5px', color: '#16a34a', marginBottom: '16px' }}>Libre — disponible</div>
        <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No hay ninguna embarcación acá.</div>
        <button style={{ ...btnPrimary, width: '100%' }} onClick={() => onGuardar(spot.spotId)}>+ Guardar embarcación acá</button>
      </div>
    )
  }

  if (!unit) {
    return <div style={{ ...card, color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '40px 18px' }}>Cargando...</div>
  }

  return (
    <div style={card}>
      <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Cuna {spot.code}</h3>
      <div style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '14px' }}>{unit.description}</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13.5px' }}>
        <span style={{ color: '#64748b' }}>Cliente</span>
        <button
          onClick={() => onVerCliente(unit.clientId)}
          style={{ fontWeight: 600, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
        >
          {unit.clientName ?? '—'}
        </button>
      </div>
      {unit.categoryName && <Row k="Categoría" v={unit.categoryName} />}
      {unit.fixedServices.length > 0 && <Row k="Servicios fijos" v={unit.fixedServices.map(s => s.name).join(', ')} />}
      {unit.hp != null && <Row k="Motor" v={`${unit.hp} HP`} />}
      {unit.lengthM != null && <Row k="Largo" v={`${Number(unit.lengthM)} m`} />}
      <Row k="Desde" v={fmtDate(unit.entryDate)} />
      <Row k="Tarifa" v={fmt(Number(unit.rate))} />
      <Row k="Estado" v={unit.debt > 0 ? 'Debe' : 'Al día'} color={unit.debt > 0 ? '#dc2626' : '#16a34a'} />
      {unit.debt > 0 && <Row k="Deuda" v={fmt(unit.debt)} color="#dc2626" />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
        <button style={{ ...btnPrimary, width: '100%', background: 'linear-gradient(135deg,#16a34a,#15803d)' }} onClick={() => onCobrar(unit)}>
          Cobrar {fmt(Number(unit.rate))}
        </button>
        <button
          style={{ width: '100%', padding: '9px 18px', fontSize: '13.5px', fontWeight: 600, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '9px', cursor: 'pointer' }}
          onClick={() => onMover(unit)}
        >
          Mover de cuna
        </button>
        <button
          style={{ width: '100%', padding: '9px 18px', fontSize: '13.5px', fontWeight: 600, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '9px', cursor: 'pointer' }}
          onClick={() => onRetirar(unit.id)}
        >
          Retirar embarcación
        </button>
      </div>

      {unit.charges.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>ÚLTIMOS COBROS</div>
          {unit.charges.slice(0, 5).map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', padding: '5px 0', borderBottom: '1px solid #f8fafc', gap: '8px' }}>
              <span style={{ color: '#64748b' }}>{fmtDate(c.chargeDate)}{c.periodLabel ? ` · ${c.periodLabel}` : ''}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600, color: c.paidAt ? '#16a34a' : '#dc2626' }}>{fmt(Number(c.amount))} {c.paidAt ? '✓' : 'deuda'}</span>
                {!c.paidAt && (
                  <button
                    onClick={() => onSaldar(c.id)}
                    style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '2px 7px', cursor: 'pointer' }}
                  >Saldar</button>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
